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
      let { data: movies, error: moviesError } = await supabase
        .from('cinema')
        .select('id, titulo, capa, year, category, genero, created_at, tmdb_id, rating')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (moviesError) {
        console.error('[useRecentContent] Erro ao buscar filmes:', moviesError);
      }

      // Buscar séries das últimas 24h
      let { data: series, error: seriesError } = await supabase
        .from('series')
        .select('id_n, titulo, capa, ano, genero, tmdb_id, created_at')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });

      if (seriesError) {
        console.error('[useRecentContent] Erro ao buscar séries:', seriesError);
      }

      // Se não houver conteúdo nas últimas 24h, buscar os mais recentes (até 30 dias)
      if ((!movies || movies.length === 0) && (!series || series.length === 0)) {
        console.log('[useRecentContent] Nenhum conteúdo nas últimas 24h, buscando conteúdo mais recente...');
        
        const extendedCutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        
        // Buscar filmes dos últimos 30 dias, limitado aos 30 mais recentes
        const { data: recentMovies } = await supabase
          .from('cinema')
          .select('id, titulo, capa, year, category, genero, created_at, tmdb_id, rating')
          .gte('created_at', extendedCutoffDate)
          .order('created_at', { ascending: false })
          .limit(30);
        
        movies = recentMovies || [];
        
        // Buscar séries dos últimos 30 dias, limitado aos 30 mais recentes
        const { data: recentSeries } = await supabase
          .from('series')
          .select('id_n, titulo, capa, ano, genero, tmdb_id, created_at')
          .gte('created_at', extendedCutoffDate)
          .order('created_at', { ascending: false })
          .limit(30);
        
        series = recentSeries || [];
      }

      // Se ainda não houver conteúdo, buscar os últimos 20 itens independentemente da data
      if ((!movies || movies.length === 0) && (!series || series.length === 0)) {
        console.log('[useRecentContent] Buscando últimos itens cadastrados...');
        
        const { data: lastMovies } = await supabase
          .from('cinema')
          .select('id, titulo, capa, year, category, genero, created_at, tmdb_id, rating')
          .order('created_at', { ascending: false })
          .limit(20);
        
        movies = lastMovies || [];
        
        const { data: lastSeries } = await supabase
          .from('series')
          .select('id_n, titulo, capa, ano, genero, tmdb_id, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
        
        series = lastSeries || [];
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

      const allContent = [...formattedMovies, ...formattedSeries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50); // Limitar a 50 itens
      
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
