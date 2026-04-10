import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Romance {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseRomancesReturn {
  romances: Romance[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useRomances = (userId?: string): UseRomancesReturn => {
  const [romances, setRomances] = useState<Romance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRomances = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('[useRomances] Buscando filmes/séries de romance...');
      
      // Busca TODOS os itens de romance (sem limite)
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
          .or('genero.ilike.%romance%,category.ilike.%romance%')
          .limit(50),
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, ano, genero')
          .or('genero.ilike.%romance%')
          .limit(50)
      ]);

      console.log('[useRomances] Cinema result:', cinemaData.data?.length || 0, 'itens');
      console.log('[useRomances] Series result:', seriesData.data?.length || 0, 'itens');
      console.log('[useRomances] Erros:', cinemaData.error, seriesData.error);

      const allRomances: Romance[] = [
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

      // Remover duplicados (mesmo ID)
      const uniqueRomances = allRomances.filter((item, index, self) =>
        index === self.findIndex((r) => r.id === item.id)
      );

      // Fisher-Yates shuffle para randomização justa
      const shuffleArray = (array: Romance[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffled = shuffleArray(uniqueRomances);
      console.log('[useRomances] Total combinado:', allRomances.length);
      console.log('[useRomances] Únicos após filtro:', uniqueRomances.length);
      console.log('[useRomances] Selecionados:', shuffled.length);

      setRomances(shuffled);
    } catch (err) {
      console.error('[useRomances] Erro ao buscar romances:', err);
      setRomances([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchRomances();
  }, [fetchRomances]);

  useEffect(() => {
    // Sempre buscar na montagem (atualiza a cada reinício)
    fetchRomances();
  }, [fetchRomances]);

  return {
    romances,
    isLoading,
    refresh,
  };
};

export default useRomances;
