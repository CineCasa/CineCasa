import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Colunas reais da tabela user_progress:
 * id, user_id, content_id, content_type, time_position, progress,
 * duration, updated_at, created_at, current_time, last_watched,
 * title, episode_id, season_number, episode_number
 *
 * CORREÇÕES:
 * - last_position → time_position (campo real no banco)
 * - completed → REMOVIDO (coluna não existe na tabela)
 * - current_time → existe e é mantido
 * - episode_id → FK para episodios.id_n (usado junto com episode_number)
 */

interface WatchProgress {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  progress: number;
  current_time: number;
  time_position: number; // campo real (era last_position no hook)
  duration: number;
  episode_number?: number;
  season_number?: number;
  episode_id?: string;   // FK para episodios
  title?: string;
  last_watched?: string;
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
  syncInterval = 5000,
  enableRealtime = true,
}: UseWatchProgressOptions = {}) {
  const queryClient = useQueryClient();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Buscar progresso do usuário
  const { data: progressData, isLoading, error } = useQuery({
    queryKey: ['watch-progress', userId],
    queryFn: async (): Promise<WatchProgress[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar watch progress:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Atualizar progresso — usa campos reais da tabela
  const updateProgress = useMutation({
    mutationFn: async ({
      contentId,
      contentType,
      progress,
      currentTime,
      duration,
      episodeNumber,
      seasonNumber,
      episodeId,
      title,
    }: {
      contentId: string;
      contentType: 'movie' | 'series';
      progress: number;
      currentTime: number;
      duration: number;
      episodeNumber?: number;
      seasonNumber?: number;
      episodeId?: string;
      title?: string;
    }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const progressData = {
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
        progress: Math.min(Math.round(progress), 100),
        current_time: currentTime,
        time_position: currentTime,   // campo real (não last_position)
        duration,
        episode_number: episodeNumber ?? null,
        season_number: seasonNumber ?? null,
        episode_id: episodeId ?? null, // FK para episodios.id_n
        title: title ?? null,
        last_watched: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // NÃO inclui: completed, last_position (não existem na tabela)
      };

      const { data, error } = await supabase
        .from('user_progress')
        .upsert(progressData, {
          onConflict: 'user_id,content_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar progresso:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['watch-progress', userId], (old: WatchProgress[] = []) => {
        const filtered = old.filter(item => item.content_id !== variables.contentId);
        return [data, ...filtered];
      });
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
    },
  });

  // Marcar como concluído — atualiza progress para 100
  const markAsCompleted = useMutation({
    mutationFn: async ({
      contentId,
      contentType,
    }: {
      contentId: string;
      contentType: 'movie' | 'series';
    }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('user_progress')
        .update({
          progress: 100,
          updated_at: new Date().toISOString(),
          last_watched: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao marcar como concluído:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
    },
  });

  // Limpar progresso
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
        .from('user_progress')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (error) {
        console.error('Erro ao limpar progresso:', error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watch-progress', userId] });
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
    },
  });

  // Obter progresso específico de um conteúdo
  const getProgress = useCallback(
    (contentId: string, contentType: 'movie' | 'series') => {
      if (!progressData) return null;
      return (
        progressData.find(
          item => item.content_id === contentId && item.content_type === contentType
        ) || null
      );
    },
    [progressData]
  );

  // Versão throttled para chamadas frequentes (dentro do player)
  const updateProgressThrottled = useCallback(
    (
      contentId: string,
      contentType: 'movie' | 'series',
      currentTime: number,
      duration: number,
      episodeNumber?: number,
      seasonNumber?: number,
      episodeId?: string,
      title?: string
    ) => {
      if (!userId || !duration) return;

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(() => {
        const progress = (currentTime / duration) * 100;
        updateProgress.mutate({
          contentId,
          contentType,
          progress,
          currentTime,
          duration,
          episodeNumber,
          seasonNumber,
          episodeId,
          title,
        });
      }, syncInterval);
    },
    [userId, syncInterval, updateProgress]
  );

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Realtime updates
  useEffect(() => {
    if (!enableRealtime || !userId) return;

    const channel = supabase
      .channel(`watch-progress-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['watch-progress', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, enableRealtime, queryClient]);

  const currentProgress = progressData?.[0];

  return {
    progressData: progressData || [],
    isLoading,
    error,
    updateProgress: updateProgress.mutate,
    updateProgressThrottled,
    markAsCompleted: markAsCompleted.mutate,
    clearProgress: clearProgress.mutate,
    getProgress,
    isUpdating: updateProgress.isPending,

    // Helpers para o player
    currentTime: currentProgress?.current_time || 0,
    duration: currentProgress?.duration || 0,
    progress: currentProgress?.progress || 0,
    timePosition: currentProgress?.time_position || 0,
  };
}

export default useWatchProgress;
