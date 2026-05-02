import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useRecomendacoes = (email?: string) => {
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topGenres, setTopGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetchRecomendacoes = async () => {
      try {
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .order('rating', { ascending: false })
          .limit(20);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
        }));
        
        setRecomendacoes(mapped);
        setTopGenres(['Ação', 'Drama', 'Comédia']);
      } catch (err) {
        console.log('[useRecomendacoes] Erro:', err);
        setRecomendacoes([]);
        setTopGenres([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecomendacoes();
  }, [email]);

  return { recomendacoes, isLoading, topGenres };
};

export default useRecomendacoes;
