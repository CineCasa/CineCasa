import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useRomances = () => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRomances = async () => {
      try {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .ilike('genre', '%Romance%')
          .limit(20);
        
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
        console.log('[useRomances] Erro:', err);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRomances();
  }, []);

  return { movies, isLoading, items: movies };
};

export default useRomances;
