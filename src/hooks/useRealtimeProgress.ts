import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RealtimeProgressEvent {
  id: string;
  content_id: number;
  content_type: 'movie' | 'series';
  current_time: number;
  duration: number;
  progress: number;
  episode_id?: number;
  season_number?: number;
  episode_number?: number;
  last_watched: string;
  updated_at: string;
}

export type ProgressChangeCallback = (event: RealtimeProgressEvent, changeType: 'INSERT' | 'UPDATE' | 'DELETE') => void;

export const useRealtimeProgress = (
  userId: string | null | undefined,
  onChange: ProgressChangeCallback
) => {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;

  const setupRealtimeSubscription = useCallback(() => {
    if (!userId) {
      console.log('[useRealtimeProgress] Sem userId, não configurando realtime');
      return null;
    }

    console.log('[useRealtimeProgress] Configurando realtime para user:', userId);

    const channel = supabase
      .channel(`user_progress_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[useRealtimeProgress] Change recebido:', payload);
          
          const event: RealtimeProgressEvent = {
            id: payload.new?.id || payload.old?.id,
            content_id: payload.new?.content_id || payload.old?.content_id,
            content_type: payload.new?.content_type || payload.old?.content_type,
            current_time: payload.new?.current_time || 0,
            duration: payload.new?.duration || 0,
            progress: payload.new?.progress || 0,
            episode_id: payload.new?.episode_id,
            season_number: payload.new?.season_number,
            episode_number: payload.new?.episode_number,
            last_watched: payload.new?.last_watched || new Date().toISOString(),
            updated_at: payload.new?.updated_at || new Date().toISOString(),
          };

          callbackRef.current(event, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeProgress] Status subscription:', status);
      });

    return channel;
  }, [userId]);

  useEffect(() => {
    const channel = setupRealtimeSubscription();
    
    return () => {
      if (channel) {
        console.log('[useRealtimeProgress] Limpando subscription');
        supabase.removeChannel(channel);
      }
    };
  }, [setupRealtimeSubscription]);
};

// Hook para sincronização bidirecional completa
export const useRealtimeProgressSync = (userId: string | null | undefined) => {
  const refreshCallbacks = useRef<Set<() => void>>(new Set());

  const onProgressChange = useCallback((event: RealtimeProgressEvent, changeType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    console.log(`[useRealtimeProgressSync] ${changeType}:`, event);
    
    // Notificar todos os listeners registrados
    refreshCallbacks.current.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error('[useRealtimeProgressSync] Erro em callback:', err);
      }
    });
  }, []);

  useRealtimeProgress(userId, onProgressChange);

  const registerRefreshCallback = useCallback((callback: () => void) => {
    refreshCallbacks.current.add(callback);
    
    return () => {
      refreshCallbacks.current.delete(callback);
    };
  }, []);

  return { registerRefreshCallback };
};

export default useRealtimeProgress;
