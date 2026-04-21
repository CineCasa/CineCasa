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
        .from('watch_progress')
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
        const idColumn = watchItem.content_type === 'movie' ? 'id' : 'id_n';
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

  const findSimilarContent = async (
    sourceItem: WatchHistoryItem,
    contentType: 'movie' | 'series',
    userId: string
  ): Promise<Recommendation[]> => {
    const recommendations: Recommendation[] = [];

    try {
      // Extrair gêneros do item fonte
      const sourceGenres = sourceItem.genero?.split(',').map(g => g.trim()) || [];
      
      // Buscar conteúdos assistidos para excluir
      const { data: watchedContent } = await supabase
        .from('watch_progress')
        .select('content_id')
        .eq('user_id', userId);

      const watchedIds = watchedContent?.map(w => w.content_id) || [];

      // Buscar na tabela apropriada
      const table = contentType === 'movie' ? 'cinema' : 'series';
      const idColumn = contentType === 'movie' ? 'id' : 'id_n';

      const { data: similarItems, error } = await supabase
        .from(table)
        .select(contentType === 'movie' ? `${idColumn}, titulo, poster, banner, genero, rating, ano, descricao` : `${idColumn}, titulo, banner, genero, rating, ano, descricao`)
        .not(idColumn, 'in', `(${[sourceItem.content_id, ...watchedIds].join(',')})`);

      if (error || !similarItems) return [];

      // Calcular score de similaridade para cada item
      for (const item of similarItems) {
        const itemGenres = item.genero?.split(',').map((g: string) => g.trim()) || [];
        
        // Calcular match de gêneros
        const matchingGenres = sourceGenres.filter(g => 
          itemGenres.some((ig: string) => ig.toLowerCase() === g.toLowerCase())
        );
        
        const genreMatchScore = matchingGenres.length / Math.max(sourceGenres.length, 1);
        
        // Se tem pelo menos 1 gênero em comum
        if (genreMatchScore > 0) {
          // Criar razão personalizada
          let reason = '';
          if (genreMatchScore >= 0.7) {
            reason = `Porque você assistiu ${sourceItem.title} — Muito similar`;
          } else if (genreMatchScore >= 0.4) {
            reason = `Porque você assistiu ${sourceItem.title}`;
          } else {
            reason = `Baseado em ${sourceItem.title}`;
          }

          recommendations.push({
            id: item[idColumn]?.toString() || '',
            title: item.titulo,
            poster: contentType === 'movie' ? item.poster : item.banner,
            backdrop: item.banner,
            rating: parseFloat(item.rating) || 0,
            year: item.ano,
            genero: item.genero,
            description: item.descricao,
            reason,
            matchScore: genreMatchScore,
            sourceItem: sourceItem.title,
          });
        }
      }

      // Ordenar por score (sem limite)
      return recommendations
        .sort((a, b) => b.matchScore - a.matchScore);

    } catch (err) {
      console.error('[findSimilarContent] Erro:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchBecauseYouWatched();
  }, [fetchBecauseYouWatched]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchBecauseYouWatched,
  };
}

export default useBecauseYouWatched;
