import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useLancamentos = (email?: string) => {
  const [lancamentos, setLancamentos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLancamentos = async () => {
      try {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
        }));
        
        setLancamentos(mapped);
      } catch (err) {
        console.log('[useLancamentos] Erro:', err);
        setLancamentos([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLancamentos();
  }, [email]);

  return { lancamentos, isLoading };
};

export default useLancamentos;
