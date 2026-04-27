import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RecommendedContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  genreMatch?: string;
  relevanceScore?: number;
}

interface UseRecommendedForYouReturn {
  recommendations: RecommendedContent[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logInteraction: (contentId: string, contentType: 'movie' | 'series', interactionType: 'watched' | 'liked' | 'saved', genre?: string) => Promise<void>;
}

const RECOMMENDATIONS_CACHE_KEY = 'cinecasa_recommended_for_you_cache';
const RECOMMENDATIONS_TIMESTAMP_KEY = 'cinecasa_recommended_for_you_timestamp';

export const useRecommendedForYou = (userId?: string): UseRecommendedForYouReturn => {
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // Fisher-Yates shuffle para randomização justa
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    // Se não tiver usuário, retornar vazio
    if (!userId) {
      setRecommendations([]);
      setIsLoading(false);
      return;
    }

    const loadingTimeout = setTimeout(() => setIsLoading(true), 300);

    try {
      // Verificar cache (1 hora)
      if (!forceRefresh) {
        const cacheKey = `${RECOMMENDATIONS_CACHE_KEY}_${userId}`;
        const timestampKey = `${RECOMMENDATIONS_TIMESTAMP_KEY}_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        const timestamp = localStorage.getItem(timestampKey);

        if (cached && timestamp) {
          const hoursSinceLastLoad = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
          if (hoursSinceLastLoad < 1) {
            setRecommendations(JSON.parse(cached));
            setIsLoading(false);
            clearTimeout(loadingTimeout);
            return;
          }
        }
      }

      // Buscar recomendações via RPC do Supabase
      const { data, error: rpcError } = await supabase
        .rpc('get_recommended_content', {
          p_user_id: userId,
          p_limit: 10 // Buscar mais para poder embaralhar
        });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw rpcError;
      }

      if (data && data.length > 0) {
        // Mapear resultados
        const mapped: RecommendedContent[] = data.map((item: any) => ({
          id: item.id,
          tmdbId: item.tmdb_id,
          title: item.title,
          poster: item.poster || '/api/placeholder/300/450',
          type: item.type as 'movie' | 'series',
          year: item.year || 'N/A',
          rating: item.rating || 'N/A',
          genreMatch: item.genre_match,
          relevanceScore: item.relevance_score
        }));

        // Embaralhar e pegar apenas 5
        const shuffled = shuffleArray(mapped);
        const selected = shuffled.slice(0, 5);

        // Salvar no cache
        const cacheKey = `${RECOMMENDATIONS_CACHE_KEY}_${userId}`;
        const timestampKey = `${RECOMMENDATIONS_TIMESTAMP_KEY}_${userId}`;
        localStorage.setItem(cacheKey, JSON.stringify(selected));
        localStorage.setItem(timestampKey, Date.now().toString());

        setRecommendations(selected);
      } else {
        // Fallback: buscar filmes populares se não houver recomendações personalizadas
        const { data: popularMovies, error: popularError } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating')
          .not('poster', 'is', null)
          .order('id', { ascending: false })
          .limit(5);

        if (!popularError && popularMovies) {
          const fallback: RecommendedContent[] = popularMovies.map((item: any) => ({
            id: item.id.toString(),
            tmdbId: item.tmdb_id,
            title: item.titulo,
            poster: item.poster,
            type: 'movie',
            year: item.year || 'N/A',
            rating: item.rating || 'N/A',
            genreMatch: 'Popular',
            relevanceScore: 0
          }));

          setRecommendations(shuffleArray(fallback));
        } else {
          setRecommendations([]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar recomendações:', err);
      setError('Não foi possível carregar as recomendações');
      setRecommendations([]);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    // Limpar cache
    if (userId) {
      const cacheKey = `${RECOMMENDATIONS_CACHE_KEY}_${userId}`;
      const timestampKey = `${RECOMMENDATIONS_TIMESTAMP_KEY}_${userId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(timestampKey);
    }
    await fetchRecommendations(true);
  }, [fetchRecommendations, userId]);

  // Registrar interação do usuário
  const logInteraction = useCallback(async (
    contentId: string,
    contentType: 'movie' | 'series',
    interactionType: 'watched' | 'liked' | 'saved',
    genre?: string
  ) => {
    if (!userId) return;

    try {
      await supabase.rpc('log_user_interaction', {
        p_user_id: userId,
        p_content_id: contentId,
        p_content_type: contentType,
        p_interaction_type: interactionType,
        p_genre: genre
      });
    } catch (err) {
      // Silenciar erro - não bloquear a experiência do usuário
      console.error('Erro ao registrar interação:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchRecommendations();
    }
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh,
    logInteraction
  };
};

export default useRecommendedForYou;
