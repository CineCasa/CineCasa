import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export interface RatingInput {
  content_id: string;
  content_type: string;
  titulo: string;
  poster?: string | null;
  banner?: string | null;
  rating?: string;
}

export const useRatings = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRatings = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data } = await supabase.from('ratings').select('*').eq('user_id', user.id);
    setRatings(data || []);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const isLiked = (contentId: string, contentType: string) => 
    ratings.some(r => r.content_id === contentId && r.content_type === contentType && r.rating_type === 'like');

  const isDisliked = (contentId: string, contentType: string) => 
    ratings.some(r => r.content_id === contentId && r.content_type === contentType && r.rating_type === 'dislike');

  const toggleRating = async (input: RatingInput, type: 'like' | 'dislike') => {
    if (!user?.id) { toast.error('Faça login para avaliar'); return false; }
    
    const current = ratings.find(r => r.content_id === input.content_id && r.content_type === input.content_type);
    
    if (current?.rating_type === type) {
      await supabase.from('ratings').delete().eq('id', current.id);
      toast.success('Avaliação removida');
    } else {
      await supabase.from('ratings').upsert({
        user_id: user.id,
        content_id: input.content_id,
        content_type: input.content_type,
        titulo: input.titulo,
        poster: input.poster,
        banner: input.banner,
        rating: input.rating || '',
        rating_type: type,
        rating_value: type === 'like' ? 1 : -1,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id,content_id' });
      toast.success(type === 'like' ? 'Marcado como gostei!' : 'Marcado como não gostei!');
    }
    await fetchRatings();
    return true;
  };

  return { ratings, isLoading, isLiked, isDisliked, toggleRating, fetchRatings };
};

export default useRatings;
