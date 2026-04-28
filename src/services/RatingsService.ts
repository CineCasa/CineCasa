import { supabase } from '@/integrations/supabase/client';

export interface Rating {
  id: string;
  user_id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  rating: number;
  review: string | null;
  contains_spoilers: boolean;
  helpful_count: number;
  status: 'approved' | 'pending' | 'rejected' | 'spam';
  created_at: string;
  updated_at: string;
}

export interface RatingStats {
  average_rating: number;
  total_reviews: number;
  rating_1_count: number;
  rating_2_count: number;
  rating_3_count: number;
  rating_4_count: number;
  rating_5_count: number;
}

export interface ReviewWithUser extends Rating {
  username: string | null;
  avatar_url: string | null;
}

export interface TopRatedContent {
  content_id: string;
  content_type: 'movie' | 'series';
  average_rating: number;
  total_reviews: number;
}

class RatingsService {
  private static instance: RatingsService;

  static getInstance(): RatingsService {
    if (!RatingsService.instance) {
      RatingsService.instance = new RatingsService();
    }
    return RatingsService.instance;
  }

  async createOrUpdateRating(
    userId: string,
    contentId: string,
    contentType: 'movie' | 'series',
    rating: number,
    review?: string,
    containsSpoilers: boolean = false
  ): Promise<{ success: boolean; ratingId?: string; error?: string }> {
    try {
      if (rating < 1 || rating > 5) {
        return { success: false, error: 'Rating deve estar entre 1 e 5 estrelas' };
      }

      const { data, error } = await supabase.rpc('create_or_update_rating', {
        p_user_id: userId,
        p_content_id: contentId,
        p_content_type: contentType,
        p_rating: rating,
        p_review: review || null,
        p_contains_spoilers: containsSpoilers,
      });

      if (error) {
        console.error('[RatingsService] Erro ao salvar avaliação:', error);
        return { success: false, error: error.message };
      }

      return { success: true, ratingId: data };
    } catch (err: any) {
      console.error('[RatingsService] Exceção ao salvar:', err);
      return { success: false, error: err.message };
    }
  }

  async deleteRating(userId: string, contentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('delete_rating', {
        p_user_id: userId,
        p_content_id: contentId,
      });

      if (error) {
        console.error('[RatingsService] Erro ao deletar:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[RatingsService] Exceção ao deletar:', err);
      return false;
    }
  }

  async getUserRating(userId: string, contentId: string): Promise<Rating | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_rating', {
        p_user_id: userId,
        p_content_id: contentId,
      });

      if (error) {
        console.error('[RatingsService] Erro ao buscar avaliação:', error);
        return null;
      }

      if (!data || data.length === 0) return null;
      return data[0] as Rating;
    } catch (err) {
      console.error('[RatingsService] Exceção ao buscar:', err);
      return null;
    }
  }

  async getContentStats(contentId: string): Promise<RatingStats> {
    try {
      const { data, error } = await supabase.rpc('get_content_average_rating', {
        p_content_id: contentId,
      });

      if (error) {
        console.error('[RatingsService] Erro ao buscar stats:', error);
        return {
          average_rating: 0,
          total_reviews: 0,
          rating_1_count: 0,
          rating_2_count: 0,
          rating_3_count: 0,
          rating_4_count: 0,
          rating_5_count: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          average_rating: 0,
          total_reviews: 0,
          rating_1_count: 0,
          rating_2_count: 0,
          rating_3_count: 0,
          rating_4_count: 0,
          rating_5_count: 0,
        };
      }

      return data[0] as RatingStats;
    } catch (err) {
      console.error('[RatingsService] Exceção ao buscar stats:', err);
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_1_count: 0,
        rating_2_count: 0,
        rating_3_count: 0,
        rating_4_count: 0,
        rating_5_count: 0,
      };
    }
  }

  async getContentReviews(
    contentId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ reviews: ReviewWithUser[]; hasMore: boolean }> {
    try {
      const { data, error } = await supabase.rpc('get_content_reviews', {
        p_content_id: contentId,
        p_limit: limit + 1, // Busca um a mais para saber se tem mais
        p_offset: offset,
      });

      if (error) {
        console.error('[RatingsService] Erro ao buscar reviews:', error);
        return { reviews: [], hasMore: false };
      }

      const allReviews = (data || []) as ReviewWithUser[];
      const hasMore = allReviews.length > limit;
      const reviews = hasMore ? allReviews.slice(0, limit) : allReviews;

      return { reviews, hasMore };
    } catch (err) {
      console.error('[RatingsService] Exceção ao buscar reviews:', err);
      return { reviews: [], hasMore: false };
    }
  }

  async getUserRecentRatings(userId: string, limit: number = 10): Promise<Rating[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_recent_ratings', {
        p_user_id: userId,
        p_limit: limit,
      });

      if (error) {
        console.error('[RatingsService] Erro ao buscar recentes:', error);
        return [];
      }

      return (data || []) as Rating[];
    } catch (err) {
      console.error('[RatingsService] Exceção ao buscar recentes:', err);
      return [];
    }
  }

  async getTopRated(
    contentType?: 'movie' | 'series',
    limit: number = 10,
    minReviews: number = 3
  ): Promise<TopRatedContent[]> {
    try {
      const { data, error } = await supabase.rpc('get_top_rated_contents', {
        p_content_type: contentType || null,
        p_limit: limit,
        p_min_reviews: minReviews,
      });

      if (error) {
        console.error('[RatingsService] Erro ao buscar top rated:', error);
        return [];
      }

      return (data || []) as TopRatedContent[];
    } catch (err) {
      console.error('[RatingsService] Exceção ao buscar top rated:', err);
      return [];
    }
  }

  async incrementHelpful(ratingId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_helpful_count', {
        p_rating_id: ratingId,
      });

      if (error) {
        console.error('[RatingsService] Erro ao incrementar helpful:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[RatingsService] Exceção ao incrementar:', err);
      return false;
    }
  }

  async countUserRatings(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('count_user_ratings', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[RatingsService] Erro ao contar:', error);
        return 0;
      }

      return (data as number) || 0;
    } catch {
      return 0;
    }
  }
}

export const ratingsService = RatingsService.getInstance();
export default ratingsService;
