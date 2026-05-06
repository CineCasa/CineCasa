import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useInfantil = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch movies from Infantil category
        const { data: movies } = await supabase
          .from('cinema')
          .select('*')
          .eq('genre', 'Infantil')
          .order('rating', { ascending: false });

        // Fetch series from Infantil category
        const { data: series } = await supabase
          .from('series')
          .select('*')
          .eq('genre', 'Infantil')
          .order('rating', { ascending: false });

        // Combine movies and series
        const allContent = [
          ...(movies || []).map((item: any) => ({
            ...item,
            type: 'movie'
          })),
          ...(series || []).map((item: any) => ({
            ...item,
            type: 'series'
          }))
        ];

        // Shuffle content randomly using Fisher-Yates algorithm
        const shuffledContent = [...allContent];
        for (let i = shuffledContent.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledContent[i], shuffledContent[j]] = [shuffledContent[j], shuffledContent[i]];
        }

        // Take first 5 items
        const selectedContent = shuffledContent.slice(0, 5);
        
        const mapped = selectedContent.map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: item.type,
          genre: item.genre,
        }));
        
        setContent(mapped);
      } catch (err) {
        console.log('[useInfantil] Erro:', err);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  return { content, isLoading, items: content };
};

export default useInfantil;
