import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { xpService, type XPSourceType } from '@/services/XPService';

const USER_XP_KEY = 'user-xp';
const USER_LEVEL_KEY = 'user-level';
const LEVEL_INFO_KEY = 'level-info';
const XP_LOGS_KEY = 'xp-logs';

export function useUserXP(userId?: string) {
  return useQuery({
    queryKey: [USER_XP_KEY, userId],
    queryFn: () => xpService.getOrCreateUserXP(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useUserLevel(userId?: string) {
  return useQuery({
    queryKey: [USER_LEVEL_KEY, userId],
    queryFn: () => xpService.getOrCreateUserLevel(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useLevelInfo(userId?: string) {
  return useQuery({
    queryKey: [LEVEL_INFO_KEY, userId],
    queryFn: () => xpService.getLevelInfo(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useLevelConfig() {
  return useQuery({
    queryKey: ['level-config'],
    queryFn: () => xpService.getLevelConfig(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useXPLogs(userId?: string, limit: number = 50) {
  return useQuery({
    queryKey: [XP_LOGS_KEY, userId, limit],
    queryFn: () => xpService.getXPLogs(userId!, limit),
    enabled: !!userId,
    staleTime: 1000 * 30,
  });
}

export function useGainXP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, source, sourceId }: { userId: string; amount: number; source: XPSourceType; sourceId?: string }) => {
      return xpService.gainXP(userId, amount, source, sourceId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [USER_XP_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [USER_LEVEL_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [LEVEL_INFO_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [XP_LOGS_KEY, userId] });
    },
  });
}

export function useLeaderboard(limit: number = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => xpService.getTopUsers(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserRank(userId?: string) {
  return useQuery({
    queryKey: ['user-rank', userId],
    queryFn: () => xpService.getUserRank(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
