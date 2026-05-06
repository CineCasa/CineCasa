import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useFinancas = () => {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancas = async () => {
      try {
        // Buscar filmes da categoria "Finanças" (exato)
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .eq('genre', 'Finanças')
          .order('rating', { ascending: false })
          .limit(5);
        
        const mapped = (data || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
          genre: item.genre // Adicionar genre para identificação
        }));
        
        setMovies(mapped);
      } catch (err) {
        console.log('[useFinancas] Erro:', err);
        setMovies([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFinancas();
  }, []);

  return { movies, isLoading, items: movies };
};

export default useFinancas;
