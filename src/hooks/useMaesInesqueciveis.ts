import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useMaesInesqueciveis = () => {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .ilike('genre', '%Família%')
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
        setSeries([]);
      } catch (err) {
        console.log('[useMaesInesqueciveis] Erro:', err);
        setMovies([]);
        setSeries([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  return { movies, series, isLoading, isVisible };
};

export default useMaesInesqueciveis;
