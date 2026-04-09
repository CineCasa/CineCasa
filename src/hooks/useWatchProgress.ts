import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WatchProgress {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  progress: number; // 0-100
  current_time: number; // segundos
  duration: number; // segundos
  episode_number?: number;
  season_number?: number;
  last_position?: number; // segundos
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface UseWatchProgressOptions {
  userId?: string;
  autoSync?: boolean;
  syncInterval?: number;
  enableRealtime?: boolean;
}

export function useWatchProgress({
  userId,
  autoSync = true,
  syncInterval = 5000, // 5 segundos
  enableRealtime = true,
}: UseWatchProgressOptions = {}) {
  const queryClient = useQueryClient();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Query para buscar progresso do usuário
  const { data: progressData, isLoading, error } = useQuery({
    queryKey: ['watch-progress', userId],
    queryFn: async (): Promise<WatchProgress[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar watch progress:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para atualizar progresso
  const updateProgress = useMutation({
    mutationFn: async ({
      contentId,
      contentType,
      progress,
      currentTime,
      duration,
      episodeNumber,
      seasonNumber,
    }: {
      contentId: string;
      contentType: 'movie' | 'series';
      progress: number;
      currentTime: number;
      duration: number;
      episodeNumber?: number;
      seasonNumber?: number;
    }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const progressData = {
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
        progress: Math.min(progress, 100),
        current_time: currentTime,
        duration,
        episode_number: episodeNumber,
        season_number: seasonNumber,
        last_position: currentTime,
        completed: progress >= 95, // Considera completo com 95%
        updated_at: new Date().toISOString(),
      };

      // Upsert (update ou insert)
      const { data, error } = await supabase
        .from('watch_progress')
        .upsert(progressData, {
          onConflict: 'user_id,content_id,content_type,episode_number,season_number',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar progresso:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Atualizar cache local
      queryClient.setQueryData(['watch-progress', userId], (old: WatchProgress[] = []) => {
        const filtered = old.filter(
          item => !(item.content_id === variables.contentId && 
                   item.content_type === variables.contentType &&
                   item.episode_number === variables.episodeNumber &&
                   item.season_number === variables.seasonNumber)
        );
        return [data, ...filtered];
      });

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de progresso:', error);
    },
  });

  // Mutation para marcar como concluído
  const markAsCompleted = useMutation({
    mutationFn: async ({
      contentId,
      contentType,
      episodeNumber,
      seasonNumber,
    }: {
      contentId: string;
      contentType: 'movie' | 'series';
      episodeNumber?: number;
      seasonNumber?: number;
    }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('watch_progress')
        .update({
          completed: true,
          progress: 100,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('episode_number', episodeNumber || 0)
        .eq('season_number', seasonNumber || 0)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao marcar como concluído:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
    },
  });

  // Mutation para limpar progresso
  const clearProgress = useMutation({
    mutationFn: async ({
      contentId,
      contentType,
    }: {
      contentId: string;
      contentType: 'movie' | 'series';
    }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('watch_progress')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (error) {
        console.error('❌ Erro ao limpar progresso:', error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
    },
  });

  // Função para obter progresso específico
  const getProgress = useCallback((contentId: string, contentType: 'movie' | 'series') => {
    if (!progressData) return null;

    return progressData.find(item => 
      item.content_id === contentId && item.content_type === contentType
    ) || null;
  }, [progressData]);

  // Função para atualizar progresso (throttled)
  const updateProgressThrottled = useCallback((
    contentId: string,
    contentType: 'movie' | 'series',
    currentTime: number,
    duration: number,
    episodeNumber?: number,
    seasonNumber?: number
  ) => {
    if (!userId) return;

    const progress = (currentTime / duration) * 100;
    
    updateProgress.mutate({
      contentId,
      contentType,
      progress,
      currentTime,
      duration,
      episodeNumber,
      seasonNumber,
    });
  }, [userId, updateProgress]);

  // Função para sincronização automática
  const syncProgress = useCallback(async () => {
    if (!userId || !autoSync) return;

    try {
      // Buscar progresso do servidor
      const { data: serverData } = await supabase
        .from('watch_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      // Atualizar cache
      queryClient.setQueryData(['watch-progress', userId], serverData || []);
      
      console.log('🔄 Progresso sincronizado com sucesso');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  }, [userId, autoSync, queryClient]);

  // Auto sincronização
  useEffect(() => {
    if (!autoSync || !userId) return;

    // Sincronizar a cada intervalo
    const interval = setInterval(syncProgress, syncInterval);

    // Sincronizar quando voltar online
    const handleOnline = () => syncProgress();
    window.addEventListener('online', handleOnline);

    // Sincronizar quando a aba ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoSync, syncInterval, syncProgress, userId]);

  // Realtime updates
  useEffect(() => {
    if (!enableRealtime || !userId) return;

    const channel = supabase
      .channel('watch_progress_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watch_progress',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📡 Realtime update:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            queryClient.setQueryData(['watch-progress', userId], (old: WatchProgress[] = []) => {
              const filtered = old.filter(item => item.id !== payload.new.id);
              return [payload.new, ...filtered];
            });
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(['watch-progress', userId], (old: WatchProgress[] = []) => 
              old.filter(item => item.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealtime, userId, queryClient]);

  // Limpar timeouts
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Dados
    progress: progressData || [],
    isLoading,
    error,
    
    // Ações
    updateProgress: updateProgressThrottled,
    markAsCompleted: markAsCompleted.mutate,
    clearProgress: clearProgress.mutate,
    getProgress,
    syncProgress,
    
    // Estados
    isUpdating: updateProgress.isPending,
    isCompleting: markAsCompleted.isPending,
    isClearing: clearProgress.isPending,
  };
}

// Hook para progresso específico de conteúdo
export function useContentProgress(
  contentId: string,
  contentType: 'movie' | 'series',
  userId?: string
) {
  const { progress, getProgress } = useWatchProgress({ userId });
  
  const contentProgress = getProgress(contentId, contentType);
  
  return {
    progress: contentProgress,
    percentage: contentProgress?.progress || 0,
    currentTime: contentProgress?.current_time || 0,
    duration: contentProgress?.duration || 0,
    completed: contentProgress?.completed || false,
    lastPosition: contentProgress?.last_position || 0,
    hasProgress: !!contentProgress,
  };
}
