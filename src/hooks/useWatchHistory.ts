import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WatchHistoryItem {
  id: string;
  user_id: string;
  profile_id?: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  description?: string;
  coverImage?: string;
  backdropPath?: string;
  genre?: string;
  year?: number;
  rating?: number;
  duration?: number;
  episode_number?: number;
  season_number?: number;
  episode_title?: string;
  series_title?: string;
  watch_date: string;
  completion_date?: string;
  progress: number;
  current_time: number;
  total_time: number;
  session_id?: string;
  device_type?: string;
  location?: string;
  quality?: string;
  subtitles_enabled?: boolean;
  playback_speed?: number;
  rewatch_count?: number;
  metadata?: {
    binge_session?: boolean;
    marathon_session?: boolean;
    skipped_intro?: boolean;
    skipped_credits?: boolean;
    pause_count?: number;
    seek_count?: number;
    rating_given?: number;
    tags?: string[];
  };
}

interface WatchHistoryStats {
  totalWatchTime: number;
  totalItemsWatched: number;
  averageSessionDuration: number;
  averageRating: number;
  topGenres: Array<{ genre: string; count: number; percentage: number }>;
  topActors: Array<{ actor: string; count: number }>;
  topDirectors: Array<{ director: string; count: number }>;
  watchingPatterns: {
    bestDay: string;
    bestTime: string;
    averageDailyTime: number;
    bingeDays: string[];
  };
  monthlyStats: Array<{
    month: string;
    watchTime: number;
    itemsWatched: number;
    averageRating: number;
  }>;
}

interface UseWatchHistoryOptions {
  userId?: string;
  profileId?: string;
  limit?: number;
  includeDetails?: boolean;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  filters?: {
    contentType?: 'all' | 'movie' | 'series';
    genres?: string[];
    ratingRange?: [number, number];
    dateRange?: 'all' | 'today' | 'week' | 'month' | 'year';
  };
}

export function useWatchHistory({
  userId,
  profileId,
  limit = 100,
  includeDetails = true,
  dateRange,
  filters = {},
}: UseWatchHistoryOptions = {}) {
  const queryClient = useQueryClient();

  // Query para histórico de visualização
  const { data: history, isLoading, error, refetch } = useQuery({
    queryKey: ['watch-history', userId, profileId, limit, filters, dateRange],
    queryFn: async (): Promise<WatchHistoryItem[]> => {
      if (!userId) return [];

      try {
        let query = supabase
          .from('watch_history')
          .select(`
            *,
            cinema:cinema(id, title, description, cover_image, backdrop_path, genre, year, rating, duration, actors, director),
            series:series(id, title, description, cover_image, backdrop_path, genre, year, rating, duration)
          `)
          .eq('user_id', userId);

        // Filtrar por perfil se especificado
        if (profileId) {
          query = query.eq('profile_id', profileId);
        }

        // Aplicar filtros de tipo de conteúdo
        if (filters.contentType && filters.contentType !== 'all') {
          query = query.eq('content_type', filters.contentType);
        }

        // Aplicar filtros de gênero
        if (filters.genres && filters.genres.length > 0) {
          query = query.in('genre', filters.genres);
        }

        // Aplicar filtros de rating
        if (filters.ratingRange) {
          query = query.gte('rating', filters.ratingRange[0])
                     .lte('rating', filters.ratingRange[1]);
        }

        // Aplicar filtros de data
        if (filters.dateRange && filters.dateRange !== 'all') {
          const now = new Date();
          let startDate: Date;

          switch (filters.dateRange) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              break;
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'year':
              startDate = new Date(now.getFullYear(), 0, 1);
              break;
          }

          if (startDate) {
            query = query.gte('watch_date', startDate.toISOString());
          }
        }

        // Aplicar range de datas personalizado
        if (dateRange?.start) {
          query = query.gte('watch_date', dateRange.start.toISOString());
        }
        if (dateRange?.end) {
          query = query.lte('watch_date', dateRange.end.toISOString());
        }

        // Ordenar por data mais recente
        query = query.order('watch_date', { ascending: false });

        // Limitar resultados
        query = query.limit(limit);

        const { data, error } = await query;

        if (error) {
          console.error('❌ Erro ao buscar histórico:', error);
          throw error;
        }

        // Processar resultados
        return (data || []).map(item => ({
          id: item.id,
          user_id: item.user_id,
          profile_id: item.profile_id,
          content_id: item.content_id,
          content_type: item.content_type,
          title: item.title,
          description: item.description,
          coverImage: item.content_type === 'movie' 
            ? item.cinema?.cover_image 
            : item.series?.cover_image,
          backdropPath: item.content_type === 'movie' 
            ? item.cinema?.backdrop_path 
            : item.series?.backdrop_path,
          genre: item.content_type === 'movie' 
            ? item.cinema?.genre 
            : item.series?.genre,
          year: item.content_type === 'movie' 
            ? item.cinema?.year 
            : item.series?.year,
          rating: item.content_type === 'movie' 
            ? item.cinema?.rating 
            : item.series?.rating,
          duration: item.content_type === 'movie' 
            ? item.cinema?.duration 
            : item.series?.duration,
          episode_number: item.episode_number,
          season_number: item.season_number,
          episode_title: item.episode_title,
          series_title: item.content_type === 'series' ? item.series?.title : undefined,
          watch_date: item.watch_date,
          completion_date: item.completion_date,
          progress: item.progress,
          current_time: item.current_time,
          total_time: item.total_time,
          session_id: item.session_id,
          device_type: item.device_type,
          location: item.location,
          quality: item.quality,
          subtitles_enabled: item.subtitles_enabled,
          playback_speed: item.playback_speed,
          rewatch_count: item.rewatch_count || 0,
          actors: item.content_type === 'movie' ? item.cinema?.actors : undefined,
          director: item.content_type === 'movie' ? item.cinema?.director : undefined,
          metadata: item.metadata || {},
        }));
      } catch (error) {
        console.error('❌ Erro ao processar histórico:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minuto
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para adicionar item ao histórico
  const addToHistory = useMutation({
    mutationFn: async (historyData: Partial<WatchHistoryItem>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const newHistoryItem = {
        user_id: userId,
        profile_id: profileId,
        watch_date: new Date().toISOString(),
        progress: 0,
        current_time: 0,
        total_time: 0,
        rewatch_count: 0,
        ...historyData,
      };

      const { data, error } = await supabase
        .from('watch_history')
        .insert(newHistoryItem)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar ao histórico:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['watch-history-stats', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de adicionar ao histórico:', error);
    },
  });

  // Mutation para atualizar item do histórico
  const updateHistoryItem = useMutation({
    mutationFn: async ({ 
      historyId, 
      updates 
    }: { 
      historyId: string; 
      updates: Partial<WatchHistoryItem> 
    }) => {
      const { data, error } = await supabase
        .from('watch_history')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', historyId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar histórico:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(['watch-history', userId, profileId, limit, filters, dateRange], 
        (old: WatchHistoryItem[] = []) =>
          old.map(item => item.id === historyId ? { ...item, ...updatedItem } : item)
      );
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de atualizar histórico:', error);
    },
  });

  // Mutation para limpar histórico
  const clearHistory = useMutation({
    mutationFn: async (options: {
      olderThan?: Date;
      contentType?: 'movie' | 'series';
      profileId?: string;
    } = {}) => {
      let query = supabase
        .from('watch_history')
        .delete()
        .eq('user_id', userId);

      // Limpar por perfil
      if (options.profileId) {
        query = query.eq('profile_id', options.profileId);
      }

      // Limpar por tipo de conteúdo
      if (options.contentType) {
        query = query.eq('content_type', options.contentType);
      }

      // Limpar mais antigo que
      if (options.olderThan) {
        query = query.lt('watch_date', options.olderThan.toISOString());
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Erro ao limpar histórico:', error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['watch-history-stats', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de limpar histórico:', error);
    },
  });

  // Query para estatísticas do histórico
  const { data: stats } = useQuery({
    queryKey: ['watch-history-stats', userId, profileId],
    queryFn: async (): Promise<WatchHistoryStats> => {
      if (!userId) return getDefaultStats();

      try {
        // Buscar dados brutos para análise
        const { data: rawData } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId || '')
          .order('watch_date', { ascending: false })
          .limit(1000); // Limitar para performance

        if (!rawData || rawData.length === 0) return getDefaultStats();

        // Calcular estatísticas básicas
        const totalWatchTime = rawData.reduce((sum, item) => sum + (item.total_time || 0), 0);
        const totalItemsWatched = rawData.length;
        const averageSessionDuration = totalWatchTime / totalItemsWatched;
        const averageRating = rawData.reduce((sum, item) => sum + (item.rating || 0), 0) / totalItemsWatched;

        // Análise de gêneros
        const genreCounts = rawData.reduce((acc, item) => {
          const genre = item.genre || 'unknown';
          acc[genre] = (acc[genre] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topGenres = Object.entries(genreCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([genre, count]) => ({
            genre,
            count,
            percentage: (count / totalItemsWatched) * 100,
          }));

        // Análise de atores e diretores
        const actorCounts = rawData.reduce((acc, item) => {
          if (item.actors && Array.isArray(item.actors)) {
            item.actors.forEach((actor: string) => {
              acc[actor] = (acc[actor] || 0) + 1;
            });
          }
          return acc;
        }, {} as Record<string, number>);

        const topActors = Object.entries(actorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([actor, count]) => ({ actor, count }));

        const directorCounts = rawData.reduce((acc, item) => {
          if (item.director) {
            acc[item.director] = (acc[item.director] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const topDirectors = Object.entries(directorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([director, count]) => ({ director, count }));

        // Análise de padrões de visualização
        const dayOfWeekCounts = rawData.reduce((acc, item) => {
          const day = new Date(item.watch_date).toLocaleDateString('en-US', { weekday: 'long' });
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const bestDay = Object.entries(dayOfWeekCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday';

        const hourCounts = rawData.reduce((acc, item) => {
          const hour = new Date(item.watch_date).getHours();
          const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
          acc[period] = (acc[period] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const bestTime = Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'evening';

        const averageDailyTime = totalWatchTime / 30; // Assumindo 30 dias

        // Identificar dias de maratona
        const bingeDays = Object.entries(dayOfWeekCounts)
          .filter(([, count]) => count >= 4) // 4+ itens no mesmo dia
          .map(([day]) => day);

        // Estatísticas mensais
        const monthlyStats = calculateMonthlyStats(rawData);

        return {
          totalWatchTime,
          totalItemsWatched,
          averageSessionDuration,
          averageRating,
          topGenres,
          topActors,
          topDirectors,
          watchingPatterns: {
            bestDay,
            bestTime,
            averageDailyTime,
            bingeDays,
          },
          monthlyStats,
        };
      } catch (error) {
        console.error('❌ Erro ao calcular estatísticas:', error);
        return getDefaultStats();
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Funções utilitárias
  const searchHistory = useCallback((query: string) => {
    if (!history || !query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    return history.filter(item =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.genre?.toLowerCase().includes(lowerQuery) ||
      item.actors?.some((actor: string) => actor.toLowerCase().includes(lowerQuery)) ||
      item.director?.toLowerCase().includes(lowerQuery)
    );
  }, [history]);

  const exportHistory = useCallback(async (format: 'json' | 'csv' = 'json') => {
    if (!history) return;

    const exportData = {
      userId,
      profileId,
      exportDate: new Date().toISOString(),
      totalItems: history.length,
      history: history.map(item => ({
        title: item.title,
        genre: item.genre,
        year: item.year,
        rating: item.rating,
        watchDate: item.watch_date,
        progress: item.progress,
        duration: item.duration,
        rewatchCount: item.rewatch_count,
      })),
      stats,
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinecasa-watch-history-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csv = convertToCSV(exportData.history);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cinecasa-watch-history-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [history, stats]);

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';

    const headers = ['Title', 'Genre', 'Year', 'Rating', 'Watch Date', 'Progress', 'Duration', 'Rewatch Count'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        `"${item.title}"`,
        `"${item.genre}"`,
        `"${item.year}"`,
        `"${item.rating}"`,
        `"${item.watchDate}"`,
        `"${item.progress}%"`,
        `"${item.duration}"`,
        `"${item.rewatchCount}"`
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  const getDefaultStats = (): WatchHistoryStats => ({
    totalWatchTime: 0,
    totalItemsWatched: 0,
    averageSessionDuration: 0,
    averageRating: 0,
    topGenres: [],
    topActors: [],
    topDirectors: [],
    watchingPatterns: {
      bestDay: 'Monday',
      bestTime: 'evening',
      averageDailyTime: 0,
      bingeDays: [],
    },
    monthlyStats: [],
  });

  const calculateMonthlyStats = (data: WatchHistoryItem[]) => {
    const monthlyData = data.reduce((acc, item) => {
      const month = new Date(item.watch_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!acc[month]) {
        acc[month] = {
          watchTime: 0,
          itemsWatched: 0,
          ratings: [],
        };
      }
      
      acc[month].watchTime += item.total_time || 0;
      acc[month].itemsWatched += 1;
      if (item.rating) {
        acc[month].ratings.push(item.rating);
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      watchTime: data.watchTime,
      itemsWatched: data.itemsWatched,
      averageRating: data.ratings.length > 0 
        ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length 
        : 0,
    }));
  };

  return {
    // Dados
    history: history || [],
    stats,
    isLoading,
    error,
    
    // Ações
    addToHistory: addToHistory.mutate,
    updateHistoryItem: updateHistoryItem.mutate,
    clearHistory: clearHistory.mutate,
    searchHistory,
    exportHistory,
    refetch,
    
    // Estados
    hasHistory: history.length > 0,
    isEmpty: history.length === 0,
  };
}
