import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WatchHistoryItem {
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  genero?: string;
  updated_at: string;
}

interface Recommendation {
  id: string;
  title: string;
  poster: string;
  backdrop?: string;
  rating: number;
  year?: number;
  genero?: string;
  description?: string;
  reason: string;
  matchScore: number;
  sourceItem: string; // Qual item do histórico gerou esta recomendação
}

interface BecauseYouWatchedData {
  sourceItem: WatchHistoryItem;
  recommendations: Recommendation[];
}

export function useBecauseYouWatched() {
  const [recommendations, setRecommendations] = useState<BecauseYouWatchedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBecauseYouWatched = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Buscar histórico de visualização recente (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: watchHistory, error: historyError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (historyError) throw historyError;

      if (!watchHistory || watchHistory.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Para cada item do histórico, buscar recomendações similares
      const becauseYouWatchedData: BecauseYouWatchedData[] = [];

      for (const watchItem of watchHistory) {
        // Buscar dados do conteúdo em tabela separada
        const table = watchItem.content_type === 'movie' ? 'cinema' : 'series';
        const idColumn = 'id';
        const contentId = watchItem.cinema_id || watchItem.serie_id;

        if (!contentId) continue;

        const { data: contentData } = await supabase
          .from(table)
          .select('titulo, genero')
          .eq(idColumn, contentId)
          .single();

        if (!contentData) continue;

        const sourceItem: WatchHistoryItem = {
          content_id: contentId.toString(),
          content_type: watchItem.content_type,
          title: contentData.titulo,
          genero: contentData.genero,
          updated_at: watchItem.updated_at,
        };

        // Buscar conteúdos similares baseados em gênero
        const similarContent = await findSimilarContent(
          sourceItem,
          watchItem.content_type,
          user.id
        );

        if (similarContent.length > 0) {
          becauseYouWatchedData.push({
            sourceItem,
            recommendations: similarContent,
          });
        }
      }

      setRecommendations(becauseYouWatchedData);
    } catch (err) {
      console.error('[useBecauseYouWatched] Erro:', err);
      setError('Erro ao carregar recomendações');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBecauseYouWatched();
  }, [fetchBecauseYouWatched]);

  return {
    recommendations,
    loading,
    error,
    refresh: fetchBecauseYouWatched
  };
}
