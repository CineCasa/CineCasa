import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { avatarService, type AvatarItem, type UserAvatarItem, type EquippedSlots } from '@/services/AvatarService';

const AVATAR_ITEMS_KEY = 'avatar-items';
const USER_ITEMS_KEY = 'user-avatar-items';
const EQUIPPED_KEY = 'user-equipped-avatar';

export function useAvatarItems() {
  return useQuery({
    queryKey: [AVATAR_ITEMS_KEY],
    queryFn: () => avatarService.getAllItems(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAvatarItemsByCategory(category: string) {
  return useQuery({
    queryKey: [AVATAR_ITEMS_KEY, category],
    queryFn: () => avatarService.getItemsByCategory(category as any),
    enabled: !!category,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserAvatarItems(userId?: string) {
  return useQuery({
    queryKey: [USER_ITEMS_KEY, userId],
    queryFn: () => avatarService.getUserItems(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useEquippedAvatar(userId?: string) {
  return useQuery({
    queryKey: [EQUIPPED_KEY, userId],
    queryFn: () => avatarService.getEquippedAvatar(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, slot, itemId }: { userId: string; slot: keyof EquippedSlots; itemId: string | null }) => {
      await avatarService.equipItem(userId, slot, itemId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [EQUIPPED_KEY, userId] });
      queryClient.invalidateQueries({ queryKey: [USER_ITEMS_KEY, userId] });
    },
  });
}

export function useUnlockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, itemId, unlockedBy }: { userId: string; itemId: string; unlockedBy?: string }) => {
      return avatarService.unlockItem(userId, itemId, unlockedBy);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [USER_ITEMS_KEY, userId] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, itemId }: { userId: string; itemId: string }) => {
      return avatarService.toggleFavorite(userId, itemId);
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: [USER_ITEMS_KEY, userId] });
    },
  });
}

export function useRarityColor() {
  return useCallback((rarity: string) => avatarService.getRarityColor(rarity as any), []);
}

export function useRarityLabel() {
  return useCallback((rarity: string) => avatarService.getRarityLabel(rarity as any), []);
}
