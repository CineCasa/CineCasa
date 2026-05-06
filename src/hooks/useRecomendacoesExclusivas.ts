import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

interface ViewingHistory {
  content_id: number;
  content_type: 'cinema' | 'series';
  watched_at: string;
  progress?: number;
}

interface Recommendation {
  id: number;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year?: string;
  rating?: string;
  matchScore: number;
  genre?: string;
}

export const useRecomendacoesExclusivas = (email?: string) => {
  const [recomendacoes, setRecomendacoes] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topGenres, setTopGenres] = useState<string[]>([]);

  useEffect(() => {
    const fetchRecomendacoesExclusivas = async () => {
      if (!email) {
        setIsLoading(false);
        return;
      }

      try {
        // 1. Buscar histórico de visualização do usuário
        const { data: historyData, error: historyError } = await supabase
          .from('viewing_history')
          .select('content_id, content_type, watched_at, progress')
          .eq('user_id', email)
          .order('watched_at', { ascending: false })
          .limit(50);

        if (historyError) {
          console.log('[useRecomendacoesExclusivas] Erro ao buscar histórico:', historyError);
          setRecomendacoes([]);
          setTopGenres([]);
          setIsLoading(false);
          return;
        }

        // 2. Analisar padrões de visualização
        const movieIds = historyData
          .filter((item: ViewingHistory) => item.content_type === 'cinema')
          .map(item => item.content_id);

        const seriesIds = historyData
          .filter((item: ViewingHistory) => item.content_type === 'series')
          .map(item => item.content_id);

        // 3. Buscar gêneros mais assistidos
        const { data: moviesData } = await supabase
          .from('cinema')
          .select('genre')
          .in('id', movieIds)
          .not('genre', 'is', { count: 'exact' });

        const { data: seriesData } = await supabase
          .from('series')
          .select('genero')
          .in('id_n', seriesIds)
          .not('genero', 'is', { count: 'exact' });

        // 4. Contar frequência de gêneros
        const genreCount: Record<string, number> = {};
        
        moviesData?.forEach((movie: any) => {
          if (movie.genre) {
            genreCount[movie.genre] = (genreCount[movie.genre] || 0) + 1;
          }
        });

        seriesData?.forEach((serie: any) => {
          if (serie.genero) {
            const genres = serie.genero.split(',');
            genres.forEach(genre => {
              const cleanGenre = genre.trim();
              if (cleanGenre) {
                genreCount[cleanGenre] = (genreCount[cleanGenre] || 0) + 1;
              }
            });
          }
        });

        // 5. Obter top 5 gêneros mais assistidos
        const sortedGenres = Object.entries(genreCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([genre]) => genre);

        setTopGenres(sortedGenres);

        // 6. Buscar recomendações baseadas nos gêneros preferidos
        if (sortedGenres.length === 0) {
          setRecomendacoes([]);
          setIsLoading(false);
          return;
        }

        // 7. Buscar filmes que o usuário NÃO assistiu ainda
        const watchedMovieIds = new Set(movieIds);
        const watchedSeriesIds = new Set(seriesIds);

        const { data: recommendedMovies } = await supabase
          .from('cinema')
          .select('*')
          .in('genre', sortedGenres)
          .not('id', `(${[...watchedMovieIds].join(',')})`)
          .order('rating', { ascending: false })
          .limit(15);

        const { data: recommendedSeries } = await supabase
          .from('series')
          .select('*')
          .in('genero', sortedGenres)
          .not('id_n', `(${[...watchedSeriesIds].join(',')})`)
          .order('rating', { ascending: false })
          .limit(15);

        // 8. Mapear e calcular score de compatibilidade
        const movieRecommendations: Recommendation[] = (recommendedMovies || []).map((item: any) => {
          const genreScore = sortedGenres.includes(item.genre) ? 1 : 0;
          const ratingScore = parseFloat(item.rating) || 0;
          const matchScore = (genreScore * 0.7) + ((ratingScore / 10) * 0.3); // 70% gênero, 30% rating

          return {
            id: item.id,
            title: item.titulo,
            poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
            year: item.year,
            rating: item.rating,
            type: 'movie',
            matchScore,
            genre: item.genre
          };
        });

        const seriesRecommendations: Recommendation[] = (recommendedSeries || []).map((item: any) => {
          const itemGenres = item.genero.split(',').map(g => g.trim());
          const genreScore = itemGenres.some(g => sortedGenres.includes(g)) ? 1 : 0;
          const ratingScore = parseFloat(item.rating) || 0;
          const matchScore = (genreScore * 0.7) + ((ratingScore / 10) * 0.3);

          return {
            id: item.id_n,
            title: item.titulo,
            poster: item.capa ? tmdbImageUrl(item.capa, 'w500') : '',
            year: item.year,
            rating: item.rating,
            type: 'series',
            matchScore,
            genre: item.genero
          };
        });

        // 9. Combinar e ordenar por score de compatibilidade
        const allRecommendations = [...movieRecommendations, ...seriesRecommendations]
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10); // Top 10 recomendações

        setRecomendacoes(allRecommendations);

      } catch (err) {
        console.log('[useRecomendacoesExclusivas] Erro:', err);
        setRecomendacoes([]);
        setTopGenres([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecomendacoesExclusivas();
  }, [email]);

  return { recomendacoes, isLoading, topGenres };
};

export default useRecomendacoesExclusivas;
