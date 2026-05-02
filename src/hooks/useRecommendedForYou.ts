import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useRecommendedForYou = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .order('rating', { ascending: false })
          .limit(15);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
        }));
        
        setRecommendations(mapped);
      } catch (err) {
        console.log('[useRecommendedForYou] Erro:', err);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, []);

  return { recommendations, isLoading, items: recommendations };
};

export default useRecommendedForYou;
