import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

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
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchNegritude = useCallback(async () => {
    const loadingTimeout = setTimeout(() => setIsLoading(true), 500);
    
    try {
      // Busca otimizada de itens de negritude
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
          .or('genero.ilike.%negritude%,category.ilike.%negritude%')
          .limit(30),
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, ano, genero, banner')
          .or('genero.ilike.%negritude%')
          .limit(20)
      ]);

      // REMOVER COLEÇÕES dos filmes de negritude
      const filteredCinemaData = (cinemaData.data || []).filter(isNotCollection);
      
      const allNegritude: Negritude[] = [
        ...(filteredCinemaData).map((item: any) => ({
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
          poster: item.banner || '/api/placeholder/300/450', // Usar banner se disponível
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
          const tempI = shuffled[i];
          const tempJ = shuffled[j];
          if (tempI !== undefined && tempJ !== undefined) {
            shuffled[i] = tempJ;
            shuffled[j] = tempI;
          }
        }
        return shuffled;
      };

      // Não buscar fallback - buscar todos os filmes causa lentidão

      const shuffled = shuffleArray(uniqueNegritude);
      setNegritude(shuffled);
      clearTimeout(loadingTimeout);
    } catch (err) {
      console.error('Erro ao buscar negritude:', err);
      setNegritude([]);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchNegritude();
  }, [fetchNegritude]);

  useEffect(() => {
    // Carregar sem bloquear UI
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchNegritude();
    }
  }, [fetchNegritude]);

  return {
    negritude,
    isLoading,
    refresh,
  };
};

export default useNegritude;
