import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

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
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchInfantil = useCallback(async () => {
    // Carregar em background sem mostrar loading
    
    
    try {
      // Buscar filmes e séries da categoria infantil (limitado para performance)
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
          .or('genero.ilike.%infantil%,category.ilike.%infantil%')
          .limit(30),
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, ano, genero, capa, banner')
          .or('genero.ilike.%infantil%')
          .limit(20)
      ]);

      const allInfantil: Infantil[] = [
        ...(cinemaData.data || []).map((item: any) => ({
          id: item.id.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          type: 'movie' as const,
          year: item.year,
          rating: item.rating,
        })),
        ...(seriesData.data || []).map((item: any) => ({
          id: item.id_n?.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: item.capa ? tmdbImageUrl(item.capa, 'w500') : (item.banner ? tmdbImageUrl(item.banner, 'w500') : ''),
          type: 'series' as const,
          year: String(item.ano || 'N/A'),
          rating: 'N/A',
        })),
      ];

      // Não buscar fallback - buscar todos os filmes causa lentidão

      // Limitar a 30 itens para performance
      const shuffled = allInfantil.sort(() => Math.random() - 0.5).slice(0, 30);
      setInfantil(shuffled);
    } catch (err) {
      console.error('Erro ao buscar conteúdo infantil:', err);
      setInfantil([]);
    }
  }, [setIsLoading]);

  const refresh = useCallback(async () => {
    await fetchInfantil();
  }, [fetchInfantil]);

  useEffect(() => {
    // Carregar sem bloquear UI
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
