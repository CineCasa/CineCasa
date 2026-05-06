import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useCineRiso = () => {
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch movies from Comédia category
        const { data: movies } = await supabase
          .from('cinema')
          .select('*')
          .eq('genre', 'Comédia')
          .order('rating', { ascending: false });

        // Fetch series from Comédia category
        const { data: series } = await supabase
          .from('series')
          .select('*')
          .eq('genero', 'Comédia')
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
          id: item.id || item.id_n,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : (item.capa ? tmdbImageUrl(item.capa, 'w500') : ''),
          year: item.year || item.ano,
          rating: item.rating,
          type: item.type,
          genre: item.genre || item.genero,
        }));
        
        setContent(mapped);
      } catch (err) {
        console.log('[useCineRiso] Erro:', err);
        setContent([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  return { content, isLoading, items: content };
};

export default useCineRiso;
