import { createContext, useContext, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { gamificationService, type GamificationResult } from '@/services/GamificationService';

interface GamificationContextType {
  processWatch: (contentId: string, contentType: 'movie' | 'series', genre?: string) => Promise<GamificationResult | null>;
  processRating: (contentId: string, contentType: 'movie' | 'series') => Promise<GamificationResult | null>;
  processReview: (contentId: string, contentType: 'movie' | 'series') => Promise<GamificationResult | null>;
  invalidateGamification: () => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

interface GamificationProviderProps {
  children: ReactNode;
  userId?: string;
}

export function GamificationProvider({ children, userId }: GamificationProviderProps) {
  const queryClient = useQueryClient();

  const invalidateGamification = useCallback(() => {
    if (!userId) return;
    queryClient.invalidateQueries({ queryKey: ['user-xp', userId] });
    queryClient.invalidateQueries({ queryKey: ['user-level', userId] });
    queryClient.invalidateQueries({ queryKey: ['user-achievements', userId] });
    queryClient.invalidateQueries({ queryKey: ['user-avatar-items', userId] });
  }, [queryClient, userId]);

  const processWatch = useCallback(async (
    contentId: string,
    contentType: 'movie' | 'series',
    genre?: string
  ): Promise<GamificationResult | null> => {
    if (!userId) return null;

    try {
      const result = await gamificationService.processEvent({
        type: 'watch',
        userId,
        contentId,
        contentType,
        genre,
      });

      invalidateGamification();
      return result;
    } catch (error) {
      console.error('[GamificationProvider] Watch error:', error);
      return null;
    }
  }, [userId, invalidateGamification]);

  const processRating = useCallback(async (
    contentId: string,
    contentType: 'movie' | 'series'
  ): Promise<GamificationResult | null> => {
    if (!userId) return null;

    try {
      const result = await gamificationService.processEvent({
        type: 'rate',
        userId,
        contentId,
        contentType,
      });

      invalidateGamification();
      return result;
    } catch (error) {
      console.error('[GamificationProvider] Rating error:', error);
      return null;
    }
  }, [userId, invalidateGamification]);

  const processReview = useCallback(async (
    contentId: string,
    contentType: 'movie' | 'series'
  ): Promise<GamificationResult | null> => {
    if (!userId) return null;

    try {
      const result = await gamificationService.processEvent({
        type: 'review',
        userId,
        contentId,
        contentType,
      });

      invalidateGamification();
      return result;
    } catch (error) {
      console.error('[GamificationProvider] Review error:', error);
      return null;
    }
  }, [userId, invalidateGamification]);

  return (
    <GamificationContext.Provider
      value={{
        processWatch,
        processRating,
        processReview,
        invalidateGamification,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationContext must be used within GamificationProvider');
  }
  return context;
}

export default GamificationProvider;
