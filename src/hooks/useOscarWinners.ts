import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useOscarWinners = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOscarWinners = async () => {
      try {
        // Fetch movies with Oscar awards
        const { data: movies } = await supabase
          .from('cinema')
          .select('*')
          .eq('category', 'Oscar Winners')
          .order('year', { ascending: false });

        // Fetch series with Oscar awards
        const { data: series } = await supabase
          .from('series')
          .select('*')
          .eq('genero', 'Oscar Winners')
          .order('ano', { ascending: false });

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

        // Shuffle randomly for variety
        const shuffledContent = [...allContent];
        for (let i = shuffledContent.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledContent[i], shuffledContent[j]] = [shuffledContent[j], shuffledContent[i]];
        }

        // Take first 5 items
        const selectedContent = shuffledContent.slice(0, 5);
        
        const mapped = selectedContent.map((item: any) => ({
          id: item.id || item.id_n,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : (item.capa ? tmdbImageUrl(item.capa, 'w500') : ''),
          year: item.year || item.ano,
          rating: item.rating,
          type: item.type,
          genre: item.genre || item.genero,
          oscarYear: item.year || item.ano, // Include Oscar year for display
          awards: item.awards || [] // Include awards information if available
        }));
        
        setContent(mapped);
      } catch (err) {
        console.log('[useOscarWinners] Erro:', err);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOscarWinners();
  }, []);

  return { content, isLoading, items: content };
};

export default useOscarWinners;
