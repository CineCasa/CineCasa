import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useTravesseiroEdredon = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .ilike('category', '%Relaxante%')
          .limit(15);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
        }));
        
        setContent(mapped);
      } catch (err) {
        console.log('[useTravesseiroEdredon] Erro:', err);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  return { content, isLoading, items: content };
};

export default useTravesseiroEdredon;
