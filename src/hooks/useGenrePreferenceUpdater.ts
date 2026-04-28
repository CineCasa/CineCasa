/**
 * Hook utilitário para atualizar preferências de gênero
 * 
 * Usado em componentes de player para rastrear eventos de visualização
 * e atualizar as preferências de gênero do usuário.
 */

import { useCallback, useRef } from 'react';
import { updateGenrePreferences, processGenres, GenreActionType } from '@/services/genrePreferencesService';

interface UseGenrePreferenceUpdaterOptions {
  userId?: string;
  contentId: string;
  contentType: 'movie' | 'series';
  genres: string | string[];
  enabled?: boolean;
}

/**
 * Hook para atualizar preferências de gênero baseado em eventos de visualização
 */
export function useGenrePreferenceUpdater({
  userId,
  contentId,
  contentType,
  genres,
  enabled = true,
}: UseGenrePreferenceUpdaterOptions) {
  // Refs para controlar estado de atualização e evitar duplicatas
  const updatedRef = useRef({
    watchStarted: false,
    watch25: false,
    watch50: false,
    watch75: false,
    watchComplete: false,
  });

  /**
   * Atualiza preferências de gênero com uma ação específica
   */
  const updatePreferences = useCallback(async (action: GenreActionType | number) => {
    if (!userId || !enabled) return;

    try {
      await updateGenrePreferences(userId, genres, action);
    } catch (error) {
      // Silenciar erro - não bloquear experiência do usuário
      console.error('[useGenrePreferenceUpdater] Erro:', error);
    }
  }, [userId, genres, enabled]);

  /**
   * Registra início de visualização
   */
  const trackWatchStart = useCallback(() => {
    if (updatedRef.current.watchStarted) return;
    updatedRef.current.watchStarted = true;
    updatePreferences('WATCH_START');
  }, [updatePreferences]);

  /**
   * Registra progresso de visualização (25%, 50%, 75%, 100%)
   */
  const trackProgress = useCallback((progress: number) => {
    if (!userId || !enabled) return;

    // 25% - Primeiro quartil
    if (progress >= 25 && progress < 50 && !updatedRef.current.watch25) {
      updatedRef.current.watch25 = true;
      updatePreferences('WATCH_25_PERCENT');
    }
    // 50% - Metade
    else if (progress >= 50 && progress < 75 && !updatedRef.current.watch50) {
      updatedRef.current.watch50 = true;
      updatePreferences('WATCH_50_PERCENT');
    }
    // 75% - Terceiro quartil
    else if (progress >= 75 && progress < 95 && !updatedRef.current.watch75) {
      updatedRef.current.watch75 = true;
      updatePreferences('WATCH_75_PERCENT');
    }
    // 95%+ - Completo
    else if (progress >= 95 && !updatedRef.current.watchComplete) {
      updatedRef.current.watchComplete = true;
      updatePreferences('WATCH_COMPLETE');
    }
  }, [userId, enabled, updatePreferences]);

  /**
   * Registra abandono de visualização
   */
  const trackAbandon = useCallback((progress: number) => {
    if (!userId || !enabled) return;

    if (progress < 10) {
      // Abandono precoce
      updatePreferences('ABANDON_EARLY');
    } else if (progress < 50) {
      // Abandono no meio
      updatePreferences('ABANDON_MID');
    }
  }, [userId, enabled, updatePreferences]);

  /**
   * Registra avaliação do usuário
   */
  const trackRating = useCallback((rating: number) => {
    if (!userId || !enabled) return;

    if (rating >= 4) {
      updatePreferences('RATE_HIGH');
    } else if (rating === 3) {
      updatePreferences('RATE_MEDIUM');
    } else {
      updatePreferences('RATE_LOW');
    }
  }, [userId, enabled, updatePreferences]);

  /**
   * Reseta o estado de rastreamento (para reutilização)
   */
  const resetTracking = useCallback(() => {
    updatedRef.current = {
      watchStarted: false,
      watch25: false,
      watch50: false,
      watch75: false,
      watchComplete: false,
    };
  }, []);

  return {
    updatePreferences,
    trackWatchStart,
    trackProgress,
    trackAbandon,
    trackRating,
    resetTracking,
    processedGenres: processGenres(genres),
  };
}

export default useGenrePreferenceUpdater;
