import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const usePreparePipoca = () => {
  const [series, setSeries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        const { data } = await supabase
          .from('series')
          .select('*')
          .limit(15);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'series',
        }));
        
        setSeries(mapped);
      } catch (err) {
        console.log('[usePreparePipoca] Erro:', err);
        setSeries([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeries();
  }, []);

  return { series, isLoading, items: series };
};

export default usePreparePipoca;
