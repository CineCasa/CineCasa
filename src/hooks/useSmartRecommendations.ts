import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { genreWeightsService } from '@/services/GenreWeightsService';
import { processGenres } from '@/services/genrePreferencesService';
import { useAuth } from '@/components/AuthProvider';

interface ContentItem {
  id: string | number;
  titulo?: string;
  title?: string;
  category?: string;
  genres?: string[];
  poster?: string;
  rating?: string | number;
  year?: string | number;
  description?: string;
  type?: 'movie' | 'series';
}

interface ScoredContent {
  content: ContentItem;
  score: number;
  matchedGenres: string[];
  reasons: string[];
}

interface UseSmartRecommendationsOptions {
  content: ContentItem[];
  contentType?: 'movie' | 'series';
  limit?: number;
  minScore?: number;
}

interface UseSmartRecommendationsReturn {
  recommendations: ScoredContent[];
  isLoading: boolean;
  hasRecommendations: boolean;
  refresh: () => Promise<void>;
  getContentScore: (content: ContentItem) => Promise<number>;
}

export function useSmartRecommendations({
  content,
  contentType = 'movie',
  limit = 20,
  minScore = 0.3
}: UseSmartRecommendationsOptions): UseSmartRecommendationsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [recommendations, setRecommendations] = useState<ScoredContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasCalculatedRef = useRef(false);

  // Calcular score para conteúdo específico
  const getContentScore = useCallback(async (item: ContentItem): Promise<number> => {
    const genres = processGenres(item.category || item.genres);
    if (genres.length === 0) return 0.5;

    const score = await genreWeightsService.calculateRecommendationScore(
      String(item.id),
      genres,
      userId
    );
    
    return score;
  }, [userId]);

  // Calcular todos os scores
  const calculateRecommendations = useCallback(async () => {
    if (!content || content.length === 0) {
      setRecommendations([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const scored: ScoredContent[] = [];

      // Processar em lotes de 5 para não sobrecarregar
      const batchSize = 5;
      for (let i = 0; i < content.length; i += batchSize) {
        const batch = content.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map(async (item) => {
            const genres = processGenres(item.category || item.genres);
            
            // Calcular score
            const score = await genreWeightsService.calculateRecommendationScore(
              String(item.id),
              genres,
              userId
            );

            // Gerar reasons para explicação
            const reasons: string[] = [];
            if (score > 2.5) reasons.push('Baseado nos seus gêneros favoritos');
            if (score > 3.5) reasons.push('Alta compatibilidade com seu perfil');

            return {
              content: item,
              score,
              matchedGenres: genres,
              reasons
            };
          })
        );

        scored.push(...batchResults);
      }

      // Ordenar por score e filtrar
      const filtered = scored
        .filter(item => item.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      setRecommendations(filtered);
    } catch (err) {
      console.error('[useSmartRecommendations] Erro:', err);
    } finally {
      setIsLoading(false);
    }
  }, [content, userId, limit, minScore]);

  // Efeito para calcular
  useEffect(() => {
    if (content && content.length > 0 && !hasCalculatedRef.current) {
      hasCalculatedRef.current = true;
      calculateRecommendations();
    }
  }, [content, calculateRecommendations]);

  // Reset quando content mudar
  useEffect(() => {
    hasCalculatedRef.current = false;
  }, [contentType]);

  const refresh = useCallback(async () => {
    hasCalculatedRef.current = false;
    await calculateRecommendations();
  }, [calculateRecommendations]);

  const hasRecommendations = useMemo(() => 
    recommendations.length > 0, 
    [recommendations]
  );

  return {
    recommendations,
    isLoading,
    hasRecommendations,
    refresh,
    getContentScore
  };
}

export default useSmartRecommendations;
