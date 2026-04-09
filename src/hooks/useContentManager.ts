import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePaginatedContent } from './usePaginatedContent';
import { useOptimisticFavorites } from './useOptimisticFavorites';
import { useEnhancedQuery } from './useEnhancedQuery';

interface ContentManagerOptions {
  userId?: string;
  enabled?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

interface ContentFilters {
  genre?: string;
  year?: number;
  type?: 'movie' | 'series' | 'all';
  search?: string;
  rating?: number;
  language?: string;
}

export function useContentManager({
  userId,
  enabled = true,
  cacheTime = 5 * 60 * 1000, // 5 minutos
  staleTime = 2 * 60 * 1000, // 2 minutos
}: ContentManagerOptions = {}) {
  const [filters, setFilters] = useState<ContentFilters>({});
  const [activeTab, setActiveTab] = useState<'all' | 'movies' | 'series'>('all');
  const queryClient = useQueryClient();

  // Query para filmes com paginação
  const movies = usePaginatedContent({
    table: 'cinema',
    filters: {
      ...filters,
      ...(activeTab === 'movies' && { type: 'movie' }),
    },
    orderBy: { column: 'created_at', ascending: false },
    initialPageSize: 20,
    enabled: enabled && (activeTab === 'all' || activeTab === 'movies'),
  });

  // Query para séries com paginação
  const series = usePaginatedContent({
    table: 'series',
    filters: {
      ...filters,
      ...(activeTab === 'series' && { type: 'series' }),
    },
    orderBy: { column: 'created_at', ascending: false },
    initialPageSize: 20,
    enabled: enabled && (activeTab === 'all' || activeTab === 'series'),
  });

  // Query para conteúdo destacado (usando enhanced query)
  const featured = useEnhancedQuery({
    queryKey: ['featured-content'],
    queryFn: async () => {
      const [moviesData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('*')
          .eq('featured', true)
          .limit(10),
        supabase
          .from('series')
          .select('*')
          .eq('featured', true)
          .limit(10),
      ]);

      return {
        movies: moviesData.data || [],
        series: seriesData.data || [],
      };
    },
    cacheTime: 10 * 60 * 1000, // 10 minutos para conteúdo destacado
    staleTime: 5 * 60 * 1000,
    prefetchOnMount: true,
    prefetchDelay: 2000,
  });

  // Query para continuar assistindo
  const continueWatching = useEnhancedQuery({
    queryKey: ['continue-watching', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data } = await supabase
        .from('watch_progress')
        .select(`
          *,
          cinema:cinema(id),
          series:series(id)
        `)
        .eq('user_id', userId)
        .not('progress', 'eq', 0)
        .not('progress', 'eq', 100)
        .order('updated_at', { ascending: false })
        .limit(20);

      return data || [];
    },
    enabled: enabled && !!userId,
    cacheTime: 60 * 1000, // 1 minuto para progresso
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Atualizar a cada 30 segundos
  });

  // Query para recomendações
  const recommendations = useEnhancedQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      if (!userId) return [];

      // Buscar baseado nos gêneros mais assistidos
      const { data: watchHistory } = await supabase
        .from('watch_progress')
        .select('genre')
        .eq('user_id', userId)
        .limit(50);

      if (!watchHistory || watchHistory.length === 0) {
        // Retornar conteúdo popular se não há histórico
        const { data: popular } = await supabase
          .from('cinema')
          .select('*')
          .order('rating', { ascending: false })
          .limit(20);

        return popular || [];
      }

      // Extrair gêneros mais assistidos
      const genreCounts = watchHistory.reduce((acc, item) => {
        const genre = item.genre;
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      // Buscar conteúdo dos top gêneros
      const { data: recommended } = await supabase
        .from('cinema')
        .select('*')
        .in('genre', topGenres)
        .order('rating', { ascending: false })
        .limit(20);

      return recommended || [];
    },
    enabled: enabled && !!userId,
    cacheTime: 15 * 60 * 1000, // 15 minutos
    staleTime: 5 * 60 * 1000,
    prefetchOnMount: true,
    prefetchDelay: 3000,
  });

  // Funções para manipular filtros
  const updateFilters = useCallback((newFilters: Partial<ContentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    movies.resetPagination();
    series.resetPagination();
  }, [movies.resetPagination, series.resetPagination]);

  const applyGenreFilter = useCallback((genre: string) => {
    updateFilters({ genre: genre !== 'all' ? genre : undefined });
  }, [updateFilters]);

  const applyYearFilter = useCallback((year: number) => {
    updateFilters({ year: year > 0 ? year : undefined });
  }, [updateFilters]);

  const applySearchFilter = useCallback((search: string) => {
    updateFilters({ search: search.trim() || undefined });
  }, [updateFilters]);

  // Funções para invalidar cache
  const invalidateContentCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['paginated'] });
    queryClient.invalidateQueries({ queryKey: ['featured-content'] });
    queryClient.invalidateQueries({ queryKey: ['recommendations'] });
  }, [queryClient]);

  const invalidateContinueWatching = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
  }, [queryClient, userId]);

  // Prefetch de conteúdo relacionado
  const prefetchRelatedContent = useCallback((movieId: string) => {
    // Prefetch detalhes do filme
    queryClient.prefetchQuery({
      queryKey: ['movie-details', movieId],
      queryFn: async () => {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .eq('id', movieId)
          .single();

        return data;
      },
      staleTime: 10 * 60 * 1000,
    });

    // Prefetch filmes similares
    queryClient.prefetchQuery({
      queryKey: ['similar-movies', movieId],
      queryFn: async () => {
        const { data: movie } = await supabase
          .from('cinema')
          .select('genre')
          .eq('id', movieId)
          .single();

        if (movie?.genre) {
          const { data: similar } = await supabase
            .from('cinema')
            .select('*')
            .eq('genre', movie.genre)
            .neq('id', movieId)
            .limit(12);

          return similar || [];
        }

        return [];
      },
      staleTime: 15 * 60 * 1000,
    });
  }, [queryClient]);

  // Estatísticas do cache
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    
    const contentQueries = allQueries.filter(q => 
      q.queryKey.some(key => 
        typeof key === 'string' && 
        ['paginated', 'featured-content', 'recommendations', 'continue-watching'].includes(key)
      )
    );

    return {
      totalQueries: contentQueries.length,
      cachedQueries: contentQueries.filter(q => q.state.data !== undefined).length,
      staleQueries: contentQueries.filter(q => q.state.isStale).length,
      fetchingQueries: contentQueries.filter(q => q.state.fetchStatus === 'fetching').length,
      memoryUsage: JSON.stringify(contentQueries).length, // Estimativa grosseira
    };
  }, [queryClient]);

  // Função para resetar todo o cache de conteúdo
  const resetContentCache = useCallback(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['paginated', 'featured-content', 'recommendations', 'continue-watching'] 
    });
  }, [queryClient]);

  return {
    // Dados
    movies: movies.data,
    series: series.data,
    featured: featured.data,
    continueWatching: continueWatching.data,
    recommendations: recommendations.data,
    
    // Estados de loading
    isLoadingMovies: movies.isLoading,
    isLoadingSeries: series.isLoading,
    isLoadingFeatured: featured.isLoading,
    isLoadingContinueWatching: continueWatching.isLoading,
    isLoadingRecommendations: recommendations.isLoading,
    
    // Estados de paginação
    moviesPagination: {
      currentPage: movies.currentPage,
      hasNextPage: movies.hasNextPage,
      hasPreviousPage: movies.hasPreviousPage,
      totalCount: movies.totalCount,
      fetchNextPage: movies.fetchNextPage,
      fetchPreviousPage: movies.fetchPreviousPage,
      goToPage: movies.goToPage,
      reset: movies.resetPagination,
    },
    seriesPagination: {
      currentPage: series.currentPage,
      hasNextPage: series.hasNextPage,
      hasPreviousPage: series.hasPreviousPage,
      totalCount: series.totalCount,
      fetchNextPage: series.fetchNextPage,
      fetchPreviousPage: series.fetchPreviousPage,
      goToPage: series.goToPage,
      reset: series.resetPagination,
    },
    
    // Filtros
    filters,
    activeTab,
    updateFilters,
    clearFilters,
    applyGenreFilter,
    applyYearFilter,
    applySearchFilter,
    setActiveTab,
    
    // Cache management
    invalidateContentCache,
    invalidateContinueWatching,
    prefetchRelatedContent,
    getCacheStats,
    resetContentCache,
  };
}
