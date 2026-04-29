import { useCallback } from 'react';
import { useProcessGamificationEvent, useUpdateWatchStreak, useTrackWatchEvent, useTrackRatingEvent } from './useGamification';
import { useGainXP } from './useXP';
import { useTrackAchievement } from './useAchievements';

/**
 * Hook para integrar gamificação com o sistema de streaming existente
 * Use este hook nos componentes de player e watch history
 */
export function useStreamingGamification() {
  const trackWatch = useTrackWatchEvent();
  const trackRating = useTrackRatingEvent();
  const gainXP = useGainXP();
  const trackAchievement = useTrackAchievement();

  /**
   * Registra que o usuário assistiu conteúdo
   * - Atualiza streak
   - Ganha XP
   - Verifica achievements
   */
  const onWatchComplete = useCallback(async (
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series',
    watchDuration: number, // em minutos
    genre?: string
  ) => {
    try {
      // Processa o evento completo de gamificação
      const result = await trackWatch(userId, contentId, contentType, genre);

      // XP bônus baseado no tempo assistido
      if (watchDuration > 30) {
        const bonusXP = Math.floor(watchDuration / 10);
        await gainXP.mutateAsync({
          userId,
          amount: bonusXP,
          source: 'watch',
          sourceId: contentId,
        });
      }

      return result;
    } catch (error) {
      console.error('[Gamification] Erro ao processar watch:', error);
      return null;
    }
  }, [trackWatch, gainXP]);

  /**
   * Registra uma avaliação do usuário
   */
  const onRateContent = useCallback(async (
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series',
    rating: number
  ) => {
    try {
      const result = await trackRating(userId, contentId, contentType);

      // XP bônus para avaliações detalhadas (4+ estrelas)
      if (rating >= 4) {
        await gainXP.mutateAsync({
          userId,
          amount: 5,
          source: 'rate',
          sourceId: contentId,
        });
      }

      return result;
    } catch (error) {
      console.error('[Gamification] Erro ao processar rating:', error);
      return null;
    }
  }, [trackRating, gainXP]);

  /**
   * Registra que o usuário completou uma série
   */
  const onSeriesComplete = useCallback(async (
    userId: string,
    seriesId: string,
    totalEpisodes: number
  ) => {
    try {
      // Achievement especial: completista
      await trackAchievement.mutateAsync({
        userId,
        code: 'completist',
        increment: 1,
      });

      // XP bônus por completar série
      const bonusXP = Math.min(100, totalEpisodes * 5);
      await gainXP.mutateAsync({
        userId,
        amount: bonusXP,
        source: 'watch',
        sourceId: seriesId,
      });

      return { success: true };
    } catch (error) {
      console.error('[Gamification] Erro ao processar série completa:', error);
      return null;
    }
  }, [trackAchievement, gainXP]);

  /**
   * Registra streak diário (chamar uma vez por dia por usuário)
   */
  const onDailyLogin = useCallback(async (userId: string) => {
    try {
      const { updateWatchStreak } = useUpdateWatchStreak();
      const result = await updateWatchStreak.mutateAsync(userId);

      if (result.milestone) {
        // XP bônus por milestone de streak
        const milestoneXP = result.streak * 2;
        await gainXP.mutateAsync({
          userId,
          amount: milestoneXP,
          source: 'streak',
        });
      }

      return result;
    } catch (error) {
      console.error('[Gamification] Erro ao processar daily login:', error);
      return null;
    }
  }, [gainXP]);

  return {
    onWatchComplete,
    onRateContent,
    onSeriesComplete,
    onDailyLogin,
  };
}

/**
 * Hook para integrar gamificação com sistema social (reviews, comentários)
 */
export function useSocialGamification() {
  const processEvent = useProcessGamificationEvent();
  const gainXP = useGainXP();

  const onWriteReview = useCallback(async (
    userId: string,
    contentId: string,
    reviewLength: number
  ) => {
    try {
      // XP base por review
      let xpAmount = 20;

      // Bônus por review detalhada
      if (reviewLength > 200) xpAmount += 10;
      if (reviewLength > 500) xpAmount += 20;

      const result = await gainXP.mutateAsync({
        userId,
        amount: xpAmount,
        source: 'review',
        sourceId: contentId,
      });

      return result;
    } catch (error) {
      console.error('[Gamification] Erro ao processar review:', error);
      return null;
    }
  }, [gainXP]);

  const onSocialInteraction = useCallback(async (
    userId: string,
    interactionType: 'like' | 'comment' | 'share',
    targetUserId?: string
  ) => {
    try {
      // Não dar XP para interações consigo mesmo
      if (targetUserId === userId) return null;

      const xpMap = {
        like: 2,
        comment: 5,
        share: 10,
      };

      return await gainXP.mutateAsync({
        userId,
        amount: xpMap[interactionType],
        source: 'social',
      });
    } catch (error) {
      console.error('[Gamification] Erro ao processar interação social:', error);
      return null;
    }
  }, [gainXP]);

  return {
    onWriteReview,
    onSocialInteraction,
  };
}

export default useStreamingGamification;
