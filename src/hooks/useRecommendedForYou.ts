import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Debounce utility
const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

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
  logInteraction: (contentId: string, contentType: 'movie' | 'series', interactionType: 'watched' | 'liked' | 'saved' | 'rated' | 'skip', rating?: number, genre?: string) => Promise<void>;
  behaviorMetrics: UserBehaviorMetrics | null;
}

const RECOMMENDATIONS_CACHE_KEY = 'cinecasa_recommended_for_you_cache';
const RECOMMENDATIONS_TIMESTAMP_KEY = 'cinecasa_recommended_for_you_timestamp';

export interface UserBehaviorMetrics {
  totalInteractions: number;
  topGenres: { genre: string; count: number; score: number }[];
  topRatedContent: { contentId: string; contentType: string; rating: number }[];
  abandonedContent: { contentId: string; contentType: string; reason: string }[];
}

export const useRecommendedForYou = (userId?: string): UseRecommendedForYouReturn => {
  const [recommendations, setRecommendations] = useState<RecommendedContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [behaviorMetrics, setBehaviorMetrics] = useState<UserBehaviorMetrics | null>(null);
  const isInitialized = useRef(false);
  const realtimeChannelRef = useRef<any>(null);

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

      // Buscar recomendações ML (aprendizado contínuo + comportamento individual)
      const { data, error: rpcError } = await supabase
        .rpc('get_ml_recommendations', {
          p_user_id: userId,
          p_limit: 20 // Buscar mais para poder filtrar e embaralhar
        });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw rpcError;
      }

      if (data && data.length > 0) {
        // Mapear resultados com scores de recomendação
        const mapped: RecommendedContent[] = data.map((item: any) => ({
          id: item.content_id,
          tmdbId: item.content_id, // Usando content_id como tmdbId fallback
          title: item.title,
          poster: item.poster || '/api/placeholder/300/450',
          type: item.content_type as 'movie' | 'series',
          year: item.year || 'N/A',
          rating: item.rating?.toString() || 'N/A',
          genreMatch: item.genero,
          relevanceScore: item.recommendation_score
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

  // Buscar métricas de comportamento do usuário
  const fetchBehaviorMetrics = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error: metricsError } = await supabase
        .rpc('get_user_behavior_metrics', {
          p_user_id: userId
        });

      if (metricsError) {
        console.error('Erro ao buscar métricas:', metricsError);
        return;
      }

      if (data) {
        const metrics: UserBehaviorMetrics = {
          totalInteractions: 0,
          topGenres: [],
          topRatedContent: [],
          abandonedContent: []
        };

        data.forEach((metric: any) => {
          switch (metric.metric_name) {
            case 'total_interactions':
              metrics.totalInteractions = metric.metric_value;
              break;
            case 'top_genres':
              metrics.topGenres = metric.metric_details || [];
              break;
            case 'top_rated_content':
              metrics.topRatedContent = metric.metric_details || [];
              break;
            case 'abandoned_content':
              metrics.abandonedContent = metric.metric_details || [];
              break;
          }
        });

        setBehaviorMetrics(metrics);
      }
    } catch (err) {
      console.error('Erro ao processar métricas:', err);
    }
  }, [userId]);

  // Registrar interação do usuário (com debounce)
  const logInteraction = useCallback(async (
    contentId: string,
    contentType: 'movie' | 'series',
    interactionType: 'watched' | 'liked' | 'saved' | 'rated' | 'skip',
    rating?: number,
    genre?: string
  ) => {
    if (!userId) return;

    try {
      await supabase.rpc('log_user_interaction', {
        p_user_id: userId,
        p_content_id: contentId,
        p_content_type: contentType,
        p_interaction_type: interactionType,
        p_rating: rating,
        p_genre: genre
      });
    } catch (err) {
      // Silenciar erro - não bloquear a experiência do usuário
      console.error('Erro ao registrar interação:', err);
    }
  }, [userId]);

  // Debounced refresh para evitar excesso de chamadas
  const debouncedRefresh = useRef(
    debounce(async () => {
      if (!userId) return;
      await refresh();
    }, 1000) // 1 segundo de debounce
  ).current;

  // Configurar Realtime subscription para user_interactions
  useEffect(() => {
    if (!userId) return;

    // Limpar canal anterior se existir
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    // Criar novo canal para escutar mudanças em user_interactions
    const channel = supabase
      .channel(`user_interactions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_interactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('[Realtime] Nova interação detectada:', payload);
          // Atualizar recomendações com debounce
          debouncedRefresh();
          // Atualizar métricas
          fetchBehaviorMetrics();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status do canal user_interactions:', status);
      });

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [userId, debouncedRefresh, fetchBehaviorMetrics]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchRecommendations();
      fetchBehaviorMetrics();
    }
  }, [fetchRecommendations, fetchBehaviorMetrics]);

  return {
    recommendations,
    isLoading,
    error,
    refresh,
    logInteraction,
    behaviorMetrics
  };
};

export default useRecommendedForYou;
