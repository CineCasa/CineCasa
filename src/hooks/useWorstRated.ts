import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useWorstRated = () => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorstRated = async () => {
      try {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .lt('rating', 5)
          .order('rating', { ascending: true })
          .limit(10);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
        }));
        
        setMovies(mapped);
      } catch (err) {
        console.log('[useWorstRated] Erro:', err);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorstRated();
  }, []);

  return { movies, isLoading, items: movies };
};

export default useWorstRated;
