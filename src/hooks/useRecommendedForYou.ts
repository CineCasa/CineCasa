import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export const useRecommendedForYou = (userId?: string) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setRecommendations([]);
        setIsLoading(false);
        return;
      }

      try {
        // Temas variados do sistema para recomendações
        const variedThemes = [
          'Ação', 'Drama', 'Comédia', 'Romance', 'Terror',
          'Ficção', 'Animação', 'Documentário', 'Musical', 'Aventura',
          'Suspense', 'Fantasia', 'Guerra', 'História', 'Biografia'
        ];

        // Buscar filmes de múltiplos temas variados
        const { data: moviesData } = await supabase
          .from('cinema')
          .select('*')
          .in('genre', variedThemes)
          .order('rating', { ascending: false })
          .limit(10);

        // Buscar séries de múltiplos temas variados
        const { data: seriesData } = await supabase
          .from('series')
          .select('*')
          .in('genero', variedThemes)
          .order('rating', { ascending: false })
          .limit(5);

        // Mapear filmes
        const movieRecommendations = (moviesData || []).map((item: any) => ({
          id: item.id,
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'movie',
          genre: item.genre
        }));

        // Mapear séries
        const seriesRecommendations = (seriesData || []).map((item: any) => ({
          id: item.id_n,
          title: item.titulo,
          poster: item.capa ? tmdbImageUrl(item.capa, 'w500') : '',
          year: item.year,
          rating: item.rating,
          type: 'series',
          genre: item.genero
        }));

        // Combinar e ordenar por rating
        const allRecommendations = [...movieRecommendations, ...seriesRecommendations]
          .sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'))
          .slice(0, 5); // Limitar para 5 capas

        setRecommendations(allRecommendations);
      } catch (err) {
        console.log('[useRecommendedForYou] Erro:', err);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [userId]);

  return { recommendations, isLoading, items: recommendations };
};

export default useRecommendedForYou;
