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
  const [isLoading, setIsLoading] = useState(true);
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
      } finally {
        setIsLoading(false);
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
      
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          content_id: parseInt(config.contentId),
          content_type: config.contentType === 'series' ? 'series' : 'movie',
          "current_time": Math.round(currentTime),
          progress: Math.round(progress),
          duration: Math.round(duration),
          updated_at: new Date().toISOString(),
          episode_id: config.episodeId ? parseInt(config.episodeId) : null,
          season_number: config.seasonNumber,
          episode_number: config.episodeNumber,
        }, { 
          onConflict: 'user_id,content_id,content_type,episode_id'
        });

      if (error) {
        console.error('[ElitePlayer] ❌ Erro ao salvar progresso:', error);
      } else {
        console.log('[ElitePlayer] ✅ Progresso salvo com sucesso:', Math.round(currentTime), '/', Math.round(duration));
      }
    } catch (err) {
      console.error('[ElitePlayer] ❌ Falha ao salvar progresso:', err);
    } finally {
      saveInProgress.current = false;
    }
  }, [user?.id, config]);

  // Throttled version (10 seconds)
  const saveProgress = useCallback(
    throttle(saveProgressToSupabase, 10000),
    [saveProgressToSupabase]
  );

  // ==========================================
  // CHECK NEXT EPISODE
  // ==========================================
  
  const checkNextEpisode = async () => {
    if (config.contentType !== 'series' || !config.seasonNumber || !config.episodeNumber) {
      setHasNextEpisode(false);
      return;
    }

    try {
      // Check if there's a next episode
      const { data: nextEpisode, error } = await supabase
        .from('episodios')
        .select('id, numero, titulo')
        .eq('temporada_id', config.episodeId?.split('-')[0] || '')
        .eq('numero', config.episodeNumber + 1)
        .single();

      if (!error && nextEpisode) {
        setHasNextEpisode(true);
      } else {
        // Check next season
        const { data: nextSeason, error: seasonError } = await supabase
          .from('temporadas')
          .select('id, numero')
          .eq('id_n', config.contentId)
          .eq('numero', config.seasonNumber + 1)
          .single();

        if (!seasonError && nextSeason) {
          setHasNextEpisode(true);
        } else {
          setHasNextEpisode(false);
        }
      }
    } catch (err) {
      console.error('[ElitePlayer] Error checking next episode:', err);
      setHasNextEpisode(false);
    }
  };

  // ==========================================
  // GET NEXT EPISODE URL
  // ==========================================
  
  const getNextEpisodeUrl = async (): Promise<string | null> => {
    if (!hasNextEpisode) return null;

    try {
      // Try same season next episode
      const { data: nextEpisode, error } = await supabase
        .from('episodios')
        .select('id, url, numero, titulo')
        .eq('temporada_id', config.episodeId?.split('-')[0] || '')
        .eq('numero', config.episodeNumber! + 1)
        .single();

      if (!error && nextEpisode?.url) {
        return nextEpisode.url;
      }

      // Try next season first episode
      const { data: nextSeason } = await supabase
        .from('temporadas')
        .select('id')
        .eq('id_n', config.contentId)
        .eq('numero', config.seasonNumber! + 1)
        .single();

      if (nextSeason) {
        const { data: firstEpisode } = await supabase
          .from('episodios')
          .select('id, url, numero, titulo')
          .eq('temporada_id', nextSeason.id)
          .eq('numero', 1)
          .single();

        if (firstEpisode?.url) {
          return firstEpisode.url;
        }
      }

      return null;
    } catch (err) {
      console.error('[ElitePlayer] Error getting next episode:', err);
      return null;
    }
  };

  // ==========================================
  // REFRESH TOKEN
  // ==========================================
  
  const refreshToken = useCallback(async () => {
    if (!user) return;

    const newToken = await refreshVideoToken(
      token,
      user.id,
      config.contentId,
      config.contentType
    );

    if (newToken) {
      setToken(newToken);
      
      if (isArchiveOrgUrl(config.url)) {
        const proxiedUrl = getProxiedVideoUrl(config.url, newToken);
        setVideoUrl(proxiedUrl);
      }
    }
  }, [user, token, config.url, config.contentId, config.contentType]);

  return {
    videoUrl,
    isLoading,
    error,
    savedProgress,
    saveProgress,
    token,
    refreshToken,
    hasNextEpisode,
    getNextEpisodeUrl,
  };
}

export default useElitePlayer;
