import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecentContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster?: string;
  year?: string;
  category?: string;
  genero?: string;
  created_at: string;
  tmdb_id?: number;
  rating?: string;
}

interface UseRecentContentReturn {
  content: RecentContentItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useRecentContent(hoursBack: number = 24): UseRecentContentReturn {
  const [content, setContent] = useState<RecentContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecentContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      
      console.log(`[useRecentContent] Buscando conteúdo desde: ${cutoffDate}`);

      // Buscar filmes das últimas 24h
      const { data: movies, error: moviesError } = await supabase
        .from('filmes')
        .select('id, titulo, capa, year, category, genero, created_at, tmdb_id, rating')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (moviesError) {
        console.error('[useRecentContent] Erro ao buscar filmes:', moviesError);
      }

      // Buscar séries das últimas 24h
      const { data: series, error: seriesError } = await supabase
        .from('series')
        .select('id_n, titulo, capa, ano, genero, tmdb_id, created_at')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (seriesError) {
        console.error('[useRecentContent] Erro ao buscar séries:', seriesError);
      }

      // Combinar e formatar resultados
      const formattedMovies: RecentContentItem[] = (movies || []).map((item: any) => ({
        id: item.id.toString(),
        title: item.titulo,
        type: 'movie' as const,
        poster: item.capa,
        year: item.year,
        category: item.category,
        genero: item.genero,
        created_at: item.created_at,
        tmdb_id: item.tmdb_id,
        rating: item.rating,
      }));

      const formattedSeries: RecentContentItem[] = (series || []).map((item: any) => ({
        id: item.id_n?.toString() || item.id?.toString(),
        title: item.titulo,
        type: 'series' as const,
        poster: item.capa,
        year: item.ano,
        category: undefined,
        genero: item.genero,
        created_at: item.created_at,
        tmdb_id: item.tmdb_id,
        rating: undefined,
      }));

      const allContent = [...formattedMovies, ...formattedSeries];
      
      console.log(`[useRecentContent] Total encontrado: ${allContent.length} (${formattedMovies.length} filmes, ${formattedSeries.length} séries)`);
      
      setContent(allContent);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('[useRecentContent] Erro:', err);
      setError(err.message || 'Erro ao carregar conteúdo recente');
    } finally {
      setIsLoading(false);
    }
  }, [hoursBack]);

  // Polling para atualização automática
  useEffect(() => {
    fetchRecentContent();

    // Atualizar a cada 2 minutos
    const interval = setInterval(() => {
      fetchRecentContent();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchRecentContent]);

  return {
    content,
    isLoading,
    error,
    refresh: fetchRecentContent,
    lastUpdated,
  };
}

export default useRecentContent;
