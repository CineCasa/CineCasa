import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Negritude {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseNegritudeReturn {
  negritude: Negritude[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useNegritude = (userId?: string): UseNegritudeReturn => {
  const [negritude, setNegritude] = useState<Negritude[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNegritude = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Busca TODOS os itens de negritude (sem limite)
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
          .or('genero.ilike.%negritude%,category.ilike.%negritude%')
          .limit(50),
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, ano, genero')
          .or('genero.ilike.%negritude%')
          .limit(50)
      ]);

      const allNegritude: Negritude[] = [
        ...(cinemaData.data || []).map((item: any) => ({
          id: item.id.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: item.poster,
          type: 'movie' as const,
          year: item.year || item.ano,
          rating: item.rating,
        })),
        ...(seriesData.data || []).map((item: any) => ({
          id: item.id_n?.toString() || item.id?.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: '/api/placeholder/300/450', // Fallback para poster (séries não têm poster)
          type: 'series' as const,
          year: item.ano,
          rating: 'N/A', // Séries não têm rating na tabela
        })),
      ];

      // Remover duplicados (mesmo ID)
      const uniqueNegritude = allNegritude.filter((item, index, self) =>
        index === self.findIndex((n) => n.id === item.id)
      );

      // Fisher-Yates shuffle para randomização justa
      const shuffleArray = (array: Negritude[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffled = shuffleArray(uniqueNegritude);
      setNegritude(shuffled);
    } catch (err) {
      console.error('Erro ao buscar negritude:', err);
      setNegritude([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchNegritude();
  }, [fetchNegritude]);

  useEffect(() => {
    // Sempre buscar na montagem (atualiza a cada reinício)
    fetchNegritude();
  }, [fetchNegritude]);

  return {
    negritude,
    isLoading,
    refresh,
  };
};

export default useNegritude;
