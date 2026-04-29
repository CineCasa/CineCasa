import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamificationService, type GamificationEvent } from '@/services/GamificationService';

const GAMIFICATION_EVENT_KEY = 'gamification-event';
const LEADERBOARD_KEY = 'gamification-leaderboard';
const STREAK_KEY = 'user-streak';

export function useProcessGamificationEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: GamificationEvent) => {
      return gamificationService.processEvent(event);
    },
    onSuccess: (_, event) => {
      // Invalidate all gamification-related queries
      queryClient.invalidateQueries({ queryKey: ['user-xp', event.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-level', event.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements', event.userId] });
      queryClient.invalidateQueries({ queryKey: [LEADERBOARD_KEY] });
    },
  });
}

export function useUpdateWatchStreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return gamificationService.updateWatchStreak(userId);
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [STREAK_KEY, userId] });
    },
  });
}

export function useLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: [LEADERBOARD_KEY, limit],
    queryFn: () => gamificationService.getLeaderboard(limit),
    staleTime: 1000 * 60 * 5,
  });
}

// Hook for tracking a watch event with full gamification processing
export function useTrackWatchEvent() {
  const processEvent = useProcessGamificationEvent();
  const updateStreak = useUpdateWatchStreak();

  return async (userId: string, contentId: string, contentType: 'movie' | 'series', genre?: string) => {
    // Update streak first
    const streakResult = await updateStreak.mutateAsync(userId);

    // Process full gamification event
    const event: GamificationEvent = {
      type: 'watch',
      userId,
      contentId,
      contentType,
      genre,
    };

    const result = await processEvent.mutateAsync(event);

    return { ...result, streak: streakResult.streak, streakMilestone: streakResult.milestone };
  };
}

// Hook for tracking a rating event
export function useTrackRatingEvent() {
  const processEvent = useProcessGamificationEvent();

  return async (userId: string, contentId: string, contentType: 'movie' | 'series') => {
    const event: GamificationEvent = {
      type: 'rate',
      userId,
      contentId,
      contentType,
    };

    return processEvent.mutateAsync(event);
  };
}

// Hook for tracking a review event
export function useTrackReviewEvent() {
  const processEvent = useProcessGamificationEvent();

  return async (userId: string, contentId: string, contentType: 'movie' | 'series') => {
    const event: GamificationEvent = {
      type: 'review',
      userId,
      contentId,
      contentType,
    };

    return processEvent.mutateAsync(event);
  };
}
