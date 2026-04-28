import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContentItem } from '@/data/content';

export interface GenreRecommendation {
  content: ContentItem;
  genreMatchScore: number;
  matchedGenres: string[];
}

export interface UserGenrePreference {
  genre: string;
  score: number;
}

interface UseGenreRecommendationsOptions {
  userId?: string;
  contentType?: 'movie' | 'series';
  limit?: number;
  excludeWatched?: boolean;
  enableRealtime?: boolean;
}

const POPULAR_GENRES: Record<string, string[]> = {
  movie: ['Ação', 'Comédia', 'Drama', 'Aventura', 'Thriller'],
  series: ['Drama', 'Comédia', 'Ação', 'Ficção Científica', 'Crime']
};

export function useGenreRecommendations({
  userId,
  contentType = 'movie',
  limit = 20,
  excludeWatched = true,
  enableRealtime = true,
}: UseGenreRecommendationsOptions = {}) {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  const { data: favoriteGenres, isLoading: isLoadingGenres } = useQuery({
    queryKey: ['genre-preferences', userId],
    queryFn: async (): Promise<UserGenrePreference[]> => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc('get_user_favorite_genres', {
        p_user_id: userId,
        p_limit: 10
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recommendations, isLoading: isLoadingRecommendations, refetch } = useQuery({
    queryKey: ['genre-recommendations', userId, contentType, limit],
    queryFn: async (): Promise<GenreRecommendation[]> => {
      if (!userId) return [];
      const { data: rpcData, error } = await supabase.rpc('get_content_by_genre_preferences', {
        p_user_id: userId,
        p_content_type: contentType,
        p_limit: limit,
        p_exclude_watched: excludeWatched
      });
      if (error || !rpcData) return [];
      return rpcData.map((item: any) => ({
        content: {
          id: item.id?.toString() || '',
          title: item.title || 'Sem título',
          image: item.poster || '',
          poster: item.poster,
          year: parseInt(item.year) || 0,
          rating: item.rating || 'N/A',
          genre: [item.genre || 'Geral'],
          category: item.genre || 'Geral',
          description: '',
          type: item.content_type as 'movie' | 'series',
          duration: '',
        },
        genreMatchScore: item.genre_match_score || 0,
        matchedGenres: [item.genre].filter(Boolean),
      }));
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
  });

  useEffect(() => {
    if (!enableRealtime || !userId) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`genre_preferences_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_genre_preferences',
        filter: `user_id=eq.${userId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['genre-preferences', userId] });
        queryClient.invalidateQueries({ queryKey: ['genre-recommendations', userId] });
      })
      .subscribe();
    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [enableRealtime, userId, queryClient]);

  const hasPreferences = (favoriteGenres?.length || 0) > 0;

  return {
    recommendations: recommendations || [],
    favoriteGenres: favoriteGenres || [],
    isLoading: isLoadingGenres || isLoadingRecommendations,
    hasPreferences,
    isNewUser: !hasPreferences && !isLoadingGenres,
    refresh: refetch,
  };
}

export function useGenrePreferences(userId?: string) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['genre-preferences', userId],
    queryFn: async (): Promise<UserGenrePreference[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_genre_preferences')
        .select('genre, score')
        .eq('user_id', userId)
        .order('score', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map(d => ({ genre: d.genre, score: d.score }));
    },
    enabled: !!userId,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['genre-preferences', userId] });
  }, [queryClient, userId]);

  return {
    preferences: data || [],
    topGenres: (data || []).slice(0, 5),
    isLoading,
    error,
    refresh,
    hasPreferences: (data?.length || 0) > 0,
  };
}
