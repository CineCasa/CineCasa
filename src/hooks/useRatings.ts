import { useState, useEffect, useCallback, useRef } from 'react';
import { ratingsService, type Rating, type RatingStats, type ReviewWithUser } from '@/services/RatingsService';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface UseRatingsReturn {
  // User's rating
  userRating: Rating | null;
  isLoadingUserRating: boolean;
  
  // Content stats
  stats: RatingStats;
  isLoadingStats: boolean;
  
  // Reviews
  reviews: ReviewWithUser[];
  isLoadingReviews: boolean;
  hasMoreReviews: boolean;
  
  // Actions
  submitRating: (
    contentId: string,
    contentType: 'movie' | 'series',
    rating: number,
    review?: string,
    containsSpoilers?: boolean
  ) => Promise<boolean>;
  deleteRating: (contentId: string) => Promise<boolean>;
  loadMoreReviews: () => Promise<void>;
  refreshReviews: () => Promise<void>;
  refreshStats: () => Promise<void>;
  refreshUserRating: () => Promise<void>;
}

export function useRatings(contentId: string): UseRatingsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  // User rating state
  const [userRating, setUserRating] = useState<Rating | null>(null);
  const [isLoadingUserRating, setIsLoadingUserRating] = useState(false);

  // Stats state
  const [stats, setStats] = useState<RatingStats>({
    average_rating: 0,
    total_reviews: 0,
    rating_1_count: 0,
    rating_2_count: 0,
    rating_3_count: 0,
    rating_4_count: 0,
    rating_5_count: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const REVIEWS_LIMIT = 10;

  // Refs to prevent duplicate fetches
  const hasFetchedUserRating = useRef(false);
  const hasFetchedStats = useRef(false);
  const hasFetchedReviews = useRef(false);

  // Fetch user's rating
  const fetchUserRating = useCallback(async () => {
    if (!userId || !contentId) return;
    
    setIsLoadingUserRating(true);
    try {
      const rating = await ratingsService.getUserRating(userId, contentId);
      setUserRating(rating);
    } catch (err) {
      console.error('[useRatings] Erro ao buscar avaliação do usuário:', err);
    } finally {
      setIsLoadingUserRating(false);
    }
  }, [userId, contentId]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!contentId) return;
    
    setIsLoadingStats(true);
    try {
      const data = await ratingsService.getContentStats(contentId);
      setStats(data);
    } catch (err) {
      console.error('[useRatings] Erro ao buscar estatísticas:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [contentId]);

  // Fetch reviews
  const fetchReviews = useCallback(async (offset: number = 0, append: boolean = false) => {
    if (!contentId) return;
    
    setIsLoadingReviews(true);
    try {
      const { reviews: data, hasMore } = await ratingsService.getContentReviews(
        contentId,
        REVIEWS_LIMIT,
        offset
      );
      
      if (append) {
        setReviews(prev => [...prev, ...data]);
      } else {
        setReviews(data);
      }
      
      setHasMoreReviews(hasMore);
      setReviewsOffset(offset + REVIEWS_LIMIT);
    } catch (err) {
      console.error('[useRatings] Erro ao buscar reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [contentId]);

  // Initial fetch
  useEffect(() => {
    if (contentId && !hasFetchedStats.current) {
      hasFetchedStats.current = true;
      fetchStats();
    }
  }, [contentId, fetchStats]);

  useEffect(() => {
    if (contentId && !hasFetchedReviews.current) {
      hasFetchedReviews.current = true;
      fetchReviews(0, false);
    }
  }, [contentId, fetchReviews]);

  useEffect(() => {
    if (userId && contentId && !hasFetchedUserRating.current) {
      hasFetchedUserRating.current = true;
      fetchUserRating();
    }
  }, [userId, contentId, fetchUserRating]);

  // Reset refs when contentId changes
  useEffect(() => {
    hasFetchedUserRating.current = false;
    hasFetchedStats.current = false;
    hasFetchedReviews.current = false;
    setReviews([]);
    setReviewsOffset(0);
  }, [contentId]);

  // Submit rating
  const submitRating = useCallback(async (
    cid: string,
    ctype: 'movie' | 'series',
    rating: number,
    review?: string,
    containsSpoilers: boolean = false
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('Faça login para avaliar');
      return false;
    }

    if (rating < 1 || rating > 5) {
      toast.error('Selecione uma nota de 1 a 5 estrelas');
      return false;
    }

    const { success, error } = await ratingsService.createOrUpdateRating(
      userId,
      cid,
      ctype,
      rating,
      review,
      containsSpoilers
    );

    if (success) {
      toast.success(userRating ? 'Avaliação atualizada!' : 'Avaliação enviada!');
      // Refresh data
      await Promise.all([fetchUserRating(), fetchStats(), fetchReviews(0, false)]);
      return true;
    } else {
      toast.error(error || 'Erro ao enviar avaliação');
      return false;
    }
  }, [userId, userRating, fetchUserRating, fetchStats, fetchReviews]);

  // Delete rating
  const deleteRating = useCallback(async (cid: string): Promise<boolean> => {
    if (!userId) return false;

    const success = await ratingsService.deleteRating(userId, cid);
    
    if (success) {
      toast.success('Avaliação removida');
      setUserRating(null);
      await Promise.all([fetchStats(), fetchReviews(0, false)]);
      return true;
    } else {
      toast.error('Erro ao remover avaliação');
      return false;
    }
  }, [userId, fetchStats, fetchReviews]);

  // Load more reviews
  const loadMoreReviews = useCallback(async () => {
    if (isLoadingReviews || !hasMoreReviews) return;
    await fetchReviews(reviewsOffset, true);
  }, [fetchReviews, reviewsOffset, isLoadingReviews, hasMoreReviews]);

  return {
    userRating,
    isLoadingUserRating,
    stats,
    isLoadingStats,
    reviews,
    isLoadingReviews,
    hasMoreReviews,
    submitRating,
    deleteRating,
    loadMoreReviews,
    refreshReviews: () => fetchReviews(0, false),
    refreshStats: fetchStats,
    refreshUserRating: fetchUserRating,
  };
}

export default useRatings;
