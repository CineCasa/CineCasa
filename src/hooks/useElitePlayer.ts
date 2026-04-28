// ============================================
// ELITE PLAYER HOOK - CineCasa Premium Experience
// Cloudflare Worker + JWT + Supabase Sync
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { 
  generateVideoToken, 
  getProxiedUrl, 
  getProxiedVideoUrl, 
  refreshVideoToken,
  isArchiveOrgUrl 
} from '@/utils/videoProxy';

// ============================================
// TYPES
// ============================================

interface PlayerProgress {
  contentId: string;
  contentType: 'movie' | 'series';
  currentTime: number;
  duration: number;
  progress: number;
  lastWatched: string;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface ElitePlayerConfig {
  url: string;
  contentId: string;
  contentType: 'movie' | 'series';
  title: string;
  poster?: string;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface UseElitePlayerReturn {
  // Video URL
  videoUrl: string;
  isLoading: boolean;
  error: string | null;
  
  // Progress
  savedProgress: number;
  saveProgress: (currentTime: number, duration: number) => void;
  
  // Token
  token: string | null;
  refreshToken: () => Promise<void>;
  
  // Next episode
  hasNextEpisode: boolean;
  getNextEpisodeUrl: () => Promise<string | null>;
}

// ============================================
// THROTTLE UTILITY
// ============================================

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;

  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// ============================================
// HOOK
// ============================================

export function useElitePlayer(config: ElitePlayerConfig): UseElitePlayerReturn {
  const { user, profile } = useAuth();
  
  // States
  const [videoUrl, setVideoUrl] = useState<string>(config.url);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [savedProgress, setSavedProgress] = useState(0);
  const [hasNextEpisode, setHasNextEpisode] = useState(false);
  
  // Refs
  const lastSavedTime = useRef<number>(0);
  const saveInProgress = useRef<boolean>(false);

  // ==========================================
  // INITIALIZE TOKEN & PROXY URL
  // ==========================================
  
  useEffect(() => {
    const initPlayer = async () => {
      if (!user || !profile) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Generate token
        const newToken = await generateVideoToken(
          user.id,
          config.contentId,
          config.contentType
        );

        // Usar proxy para URLs do Archive.org
        if (isArchiveOrgUrl(config.url)) {
          const proxiedUrl = getProxiedUrl(config.url);
          setVideoUrl(proxiedUrl);
          console.log('[ElitePlayer] Using proxied URL:', proxiedUrl);
        } else {
          setVideoUrl(config.url);
        }

        // Load saved progress
        await loadSavedProgress();
        
        // Check for next episode
        if (config.contentType === 'series') {
          await checkNextEpisode();
        }

      } catch (err) {
        console.error('[ElitePlayer] Initialization error:', err);
        setError('Erro ao inicializar player');
        // Fallback to direct URL
        setVideoUrl(config.url);
      }
    };

    initPlayer();
  }, [user, profile, config.url, config.contentId, config.contentType]);

  // ==========================================
  // LOAD SAVED PROGRESS (user_progress table)
  // ==========================================
  
  const loadSavedProgress = async () => {
    if (!user?.id || !config.contentId) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('current_time, progress, duration')
        .eq('user_id', user.id)
        .eq('content_id', config.contentId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('[ElitePlayer] Error loading progress:', error);
        return;
      }

      if (data && data.current_time > 10) {
        setSavedProgress(data.current_time);
        console.log('[ElitePlayer] Loaded saved progress:', data.current_time);
      }
    } catch (err) {
      console.error('[ElitePlayer] Failed to load progress:', err);
    }
  };

  // ==========================================
  // SAVE PROGRESS (THROTTLED - 10 SECONDS)
  // user_progress table
  // ==========================================
  
  const saveProgressToSupabase = useCallback(async (
    currentTime: number,
    duration: number
  ) => {
    console.log('[ElitePlayer] saveProgressToSupabase chamado:', { currentTime, duration, userId: user?.id, contentId: config.contentId });
    
    if (!user?.id) {
      console.log('[ElitePlayer] ❌ Salvamento abortado: sem usuário');
      return;
    }
    if (!config.contentId) {
      console.log('[ElitePlayer] ❌ Salvamento abortado: sem contentId');
      return;
    }
    if (saveInProgress.current) {
      console.log('[ElitePlayer] ❌ Salvamento abortado: já em progresso');
      return;
    }
    
    // Avoid saving too frequently - permitir a cada 10 segundos
    const now = Date.now();
    if (now - lastSavedTime.current < 10000) {
      console.log('[ElitePlayer] ⏭️ Salvamento pulado (throttle):', Math.round((now - lastSavedTime.current) / 1000), 's desde último save');
      return;
    }
    
    // Don't save if at end (>= 95%)
    if (duration > 0 && (currentTime / duration) >= 0.95) {
      console.log('[ElitePlayer] ❌ Salvamento abortado: vídeo no final');
      return;
    }

    saveInProgress.current = true;
    lastSavedTime.current = now;

    try {
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
      
      console.log('[ElitePlayer] 💾 Salvando no Supabase:', {
        user_id: user.id,
        content_id: parseInt(config.contentId),
        content_type: config.contentType,
        current_time: Math.round(currentTime),
        progress: Math.round(progress),
        duration: Math.round(duration),
        episode_id: config.episodeId ? parseInt(config.episodeId) : null,
      });
      
      // Usar RPC upsert_user_progress para salvar/atualizar progresso
      const { data: result, error } = await supabase.rpc('upsert_user_progress', {
        p_user_id: user.id,
        p_content_id: parseInt(config.contentId),
        p_content_type: config.contentType === 'series' ? 'series' : 'movie',
        p_current_time: Math.round(currentTime),
        p_duration: Math.round(duration),
        p_progress: Math.round(progress),
        p_episode_id: config.episodeId ? parseInt(config.episodeId) : null,
        p_season_number: config.seasonNumber || null,
        p_episode_number: config.episodeNumber || null
      });

      if (error) {
        console.error('[ElitePlayer] ❌ Erro ao salvar progresso:', error);
      } else {
        console.log('[ElitePlayer] ✅ Progresso salvo via RPC:', result?.action || 'success', Math.round(currentTime), '/', Math.round(duration));
      }
    } catch (err) {
      console.error('[ElitePlayer] ❌ Falha ao salvar progresso:', err);

    }
  }, [user, config.contentId, config.contentType, config.episodeId, config.seasonNumber, config.episodeNumber]);

  // Carregar progresso salvo
  const loadProgress = useCallback(async (): Promise<PlayerProgress | null> => {
    if (!user || !config.contentId) return null;

    try {
      console.log('[ElitePlayer] 📂 Carregando progresso...');
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', parseInt(config.contentId))
        .eq('content_type', config.contentType === 'series' ? 'series' : 'movie')
        .maybeSingle();

      if (error) {
        console.error('[ElitePlayer] ❌ Erro ao carregar progresso:', error);
        return null;
      }

      if (data) {
        const progress: PlayerProgress = {
          contentId: config.contentId,
          contentType: config.contentType,
          currentTime: data.current_time || 0,
          duration: data.duration || 0,
          progress: data.progress || 0,
          lastWatched: data.last_watched,
          episodeId: data.episode_id?.toString(),
          seasonNumber: data.season_number,
          episodeNumber: data.episode_number
        };
        console.log('[ElitePlayer] ✅ Progresso carregado:', progress.currentTime, 's');
        return progress;
      }

      return null;
    } catch (err) {
      console.error('[ElitePlayer] ❌ Falha ao carregar progresso:', err);
      return null;
    }
  }, [user, config.contentId, config.contentType]);

  // Atualizar estado do player
  const updatePlayerState = useCallback((updates: Partial<ElitePlayerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    // Estado
    state,
    updatePlayerState,
    
    // Ações
    saveProgress,
    loadProgress,
    
    // Config
    config,
    updateConfig: setConfig
  };
}

export default useElitePlayer;
