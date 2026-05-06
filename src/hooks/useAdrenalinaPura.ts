import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useAdrenalinaPura = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch all movies from Ação and Aventura categories
        const { data: allMovies } = await supabase
          .from('cinema')
          .select('*')
          .or('genre.eq.Ação,genre.eq.Aventura')
          .order('rating', { ascending: false });
        
        if (!allMovies || allMovies.length === 0) {
          setContent([]);
          return;
        }

        // Shuffle movies randomly using Fisher-Yates algorithm
        const shuffledMovies = [...allMovies];
        for (let i = shuffledMovies.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledMovies[i], shuffledMovies[j]] = [shuffledMovies[j], shuffledMovies[i]];
        }

        // Take first 5 movies
        const selectedMovies = shuffledMovies.slice(0, 5);
        
        const mapped = selectedMovies.map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
          genre: item.genre,
        }));
        
        setContent(mapped);
      } catch (err) {
        console.log('[useAdrenalinaPura] Erro:', err);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  return { content, isLoading, items: content };
};

export default useAdrenalinaPura;
