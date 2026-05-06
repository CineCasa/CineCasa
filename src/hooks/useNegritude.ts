import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useNegritude = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Buscar filmes da categoria "Negritude" (exato)
        const { data } = await supabase
          .from('cinema')
          .select('*')
          .eq('genre', 'Negritude')
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
        
        setContent(mapped);
      } catch (err) {
        console.log('[useNegritude] Erro:', err);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  return { content, isLoading, items: content };
};

export default useNegritude;
