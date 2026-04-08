import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PoderiaContent {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  tmdb_rating?: number;
}

interface UsePoderiaSerMelhorReturn {
  content: PoderiaContent[];
  isLoading: boolean;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
}

export const usePoderiaSerMelhor = (userId?: string): UsePoderiaSerMelhorReturn => {
  const [content, setContent] = useState<PoderiaContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Buscar conteúdos de baixa avaliação diretamente do banco local
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, rating, year')
          .lt('rating', '6.0')  // Avaliação menor que 6.0
          .order('rating', { ascending: true }),
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, poster, rating, ano')
          .lt('rating', '6.0')
          .order('rating', { ascending: true })
      ]);

      const combinedContent: PoderiaContent[] = [
        ...(cinemaData.data || []).map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          poster: item.poster,
          type: 'movie' as const,
          year: item.year || item.ano,
          rating: item.rating,
          tmdb_rating: parseFloat(item.rating) || undefined,
        })),
        ...(seriesData.data || []).map((item: any) => ({
          id: item.id_n?.toString() || item.id?.toString(),
          title: item.titulo,
          poster: (item as any).poster,
          type: 'series' as const,
          year: item.ano,
          rating: (item as any).rating,
          tmdb_rating: parseFloat((item as any).rating) || undefined,
        }))
      ];

      // Retornar TODOS (sem limite)
      const shuffled = combinedContent.sort(() => Math.random() - 0.5);
      setContent(shuffled);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('[PoderiaSerMelhor] Erro ao buscar conteúdo:', err);
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    lastUpdated,
    refresh,
  };
};

export default usePoderiaSerMelhor;
