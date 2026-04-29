import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { achievementService, type AchievementCategory } from '@/services/AchievementService';

const ACHIEVEMENTS_KEY = 'achievements';
const USER_ACHIEVEMENTS_KEY = 'user-achievements';
const USER_PROGRESS_KEY = 'user-achievement-progress';

export function useAchievements() {
  return useQuery({
    queryKey: [ACHIEVEMENTS_KEY],
    queryFn: () => achievementService.getAll(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useAchievementsByCategory(category: AchievementCategory) {
  return useQuery({
    queryKey: [ACHIEVEMENTS_KEY, category],
    queryFn: () => achievementService.getAchievementsByCategory(category),
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserAchievements(userId?: string) {
  return useQuery({
    queryKey: [USER_ACHIEVEMENTS_KEY, userId],
    queryFn: () => achievementService.getUserAchievements(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUserAchievementProgress(userId?: string) {
  return useQuery({
    queryKey: [USER_PROGRESS_KEY, userId],
    queryFn: () => achievementService.getUserAchievementsWithProgress(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useCompletedAchievements(userId?: string) {
  return useQuery({
    queryKey: [USER_ACHIEVEMENTS_KEY, userId, 'completed'],
    queryFn: () => achievementService.getCompleted(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useTrackAchievement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, code, increment }: { userId: string; code: string; increment?: number }) => {
      return achievementService.trackProgress(userId, code, increment || 1);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [USER_ACHIEVEMENTS_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [USER_PROGRESS_KEY, userId] });
    },
  });
}
