import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Infantil {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseInfantilReturn {
  infantil: Infantil[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useInfantil = (userId?: string): UseInfantilReturn => {
  const [infantil, setInfantil] = useState<Infantil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchInfantil = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Buscar filmes e séries da categoria infantil
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
          .or(`(genero.ilike.%infantil%,category.ilike.%infantil%)`)
          .limit(50),
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, ano, genero')
          .or(`(genero.ilike.%infantil%)`)
          .limit(50)
      ]);

      const allInfantil: Infantil[] = [
        ...(cinemaData.data || []).map((item: any) => ({
          id: item.id.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: item.poster,
          type: 'movie' as const,
          year: item.year,
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

      // Retornar TODOS (sem limite)
      const shuffled = allInfantil.sort(() => Math.random() - 0.5);
      setInfantil(shuffled);
    } catch (err) {
      console.error('Erro ao buscar conteúdo infantil:', err);
      setInfantil([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchInfantil();
  }, [fetchInfantil]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchInfantil();
    }
  }, [fetchInfantil]);

  return {
    infantil,
    isLoading,
    refresh,
  };
};

export default useInfantil;
