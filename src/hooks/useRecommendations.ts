import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWatchProgress } from './useWatchProgress';

interface RecommendationItem {
  id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  description?: string;
  coverImage?: string;
  backdropPath?: string;
  genre?: string;
  year?: number;
  rating?: number;
  duration?: number;
  score: number; // Pontuação de relevância
  reason: string; // Motivo da recomendação
  category: 'similar' | 'genre' | 'trending' | 'personalized' | 'collaborative';
  metadata?: {
    similarityScore?: number;
    popularityScore?: number;
    userPreferenceScore?: number;
    collaborativeScore?: number;
  };
}

interface UseRecommendationsOptions {
  userId?: string;
  limit?: number;
  categories?: string[];
  excludeWatched?: boolean;
  excludeInProgress?: boolean;
  boostRecent?: boolean;
  algorithm?: 'hybrid' | 'content-based' | 'collaborative' | 'trending';
}

export function useRecommendations({
  userId,
  limit = 20,
  categories = ['similar', 'genre', 'trending', 'personalized'],
  excludeWatched = true,
  excludeInProgress = true,
  boostRecent = true,
  algorithm = 'hybrid',
}: UseRecommendationsOptions = {}) {
  const queryClient = useQueryClient();
  const { progress } = useWatchProgress({ userId });

  // Query para buscar recomendações
  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations', userId, limit, categories, algorithm],
    queryFn: async (): Promise<RecommendationItem[]> => {
      if (!userId) return [];

      try {
        // Buscar dados do usuário
        const [watchHistoryResult, userProfileResult, trendingResult] = await Promise.all([
          // Histórico de visualização
          supabase
            .from('user_progress')
            .select(`
              content_id,
              content_type,
              progress,
              genre,
              rating,
              updated_at
            `)
            .eq('user_id', userId)
            .not('completed', 'eq', true)
            .order('updated_at', { ascending: false })
            .limit(50),

          // Perfil do usuário (se existir)
          supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single(),

          // Conteúdo em alta
          supabase
            .from('cinema')
            .select('id, tmdb_id, titulo, poster, year, rating, category, genre')
            .order('view_count', { ascending: false })
            .limit(100),
        ]);

        const watchHistory = watchHistoryResult.data || [];
        const userProfile = userProfileResult.data;
        const trending = trendingResult.data || [];

        // Análise de preferências do usuário
        const userPreferences = analyzeUserPreferences(watchHistory, userProfile);
        
        // Gerar recomendações baseado no algoritmo
        let recommendations: RecommendationItem[] = [];

        if (algorithm === 'hybrid' || algorithm === 'content-based') {
          recommendations.push(...await generateContentBasedRecommendations(
            watchHistory, 
            userPreferences, 
            trending, 
            excludeWatched, 
            excludeInProgress
          ));
        }

        if (algorithm === 'hybrid' || algorithm === 'collaborative') {
          recommendations.push(...await generateCollaborativeRecommendations(
            userId, 
            userPreferences, 
            excludeWatched
          ));
        }

        if (algorithm === 'hybrid' || algorithm === 'trending') {
          recommendations.push(...generateTrendingRecommendations(
            trending, 
            userPreferences, 
            excludeWatched
          ));
        }

        // Se híbrido, combinar e pontuar
        if (algorithm === 'hybrid') {
          recommendations = combineAndScoreRecommendations(recommendations, userPreferences, boostRecent);
        }

        // Limitar e ordenar
        return recommendations
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

      } catch (error) {
        console.error('❌ Erro ao gerar recomendações:', error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Análise de preferências do usuário
  const analyzeUserPreferences = useCallback((
    watchHistory: any[], 
    userProfile: any
  ) => {
    // Gêneros mais assistidos
    const genreCounts = watchHistory.reduce((acc, item) => {
      const genre = item.genre || 'unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    // Faixa de rating preferida
    const ratings = watchHistory.map(item => item.rating).filter(Boolean);
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    const preferredRatingRange = {
      min: Math.max(0, avgRating - 1),
      max: Math.min(10, avgRating + 1),
    };

    // Período preferido
    const years = watchHistory.map(item => item.year).filter(Boolean);
    const avgYear = years.length > 0 ? Math.floor(years.reduce((sum, y) => sum + y, 0) / years.length) : 2020;
    const preferredYearRange = {
      min: avgYear - 10,
      max: avgYear + 2,
    };

    // Tipo de conteúdo preferido
    const contentTypeCounts = watchHistory.reduce((acc, item) => {
      const type = item.content_type || 'movie';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const preferredContentType = Object.entries(contentTypeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'movie';

    return {
      topGenres,
      preferredRatingRange,
      preferredYearRange,
      preferredContentType,
      avgRating,
      avgYear,
      userProfile,
    };
  }, []);

  // Recomendações baseadas em conteúdo
  const generateContentBasedRecommendations = useCallback(async (
    watchHistory: any[],
    userPreferences: any,
    trending: any[],
    excludeWatched: boolean,
    excludeInProgress: boolean
  ) => {
    const watchedIds = excludeWatched ? new Set(watchHistory.map(item => item.content_id)) : new Set();
    const inProgressIds = excludeInProgress ? 
      new Set(watchHistory.filter(item => !item.completed).map(item => item.content_id)) : new Set();

    // Recomendações por gênero
    const genreRecommendations = [];
    for (const genre of userPreferences.topGenres) {
      const { data: genreContent } = await supabase
        .from('cinema')
        .select('*')
        .eq('genre', genre)
        .in('rating', [userPreferences.preferredRatingRange.min, userPreferences.preferredRatingRange.max])
        .gte('year', userPreferences.preferredYearRange.min)
        .lte('year', userPreferences.preferredYearRange.max)
        .not('id', watchedIds.size > 0 ? Array.from(watchedIds) : '')
        .limit(10);

      genreRecommendations.push(...genreContent.map(item => ({
        id: `genre_${item.id}`,
        content_id: item.id,
        content_type: 'movie' as const,
        title: item.title,
        description: item.description,
        coverImage: item.cover_image,
        backdropPath: item.backdrop_path,
        genre: item.genre,
        year: item.year,
        rating: item.rating,
        score: calculateGenreScore(item, userPreferences),
        reason: `Porque você gosta de ${genre}`,
        category: 'genre' as const,
        metadata: {
          userPreferenceScore: calculateUserPreferenceScore(item, userPreferences),
        },
      })));
    }

    // Recomendações similares
    const similarRecommendations = [];
    const recentItems = watchHistory.slice(0, 5);
    
    for (const recentItem of recentItems) {
      const { data: similarContent } = await supabase
        .from('cinema')
        .select('*')
        .eq('genre', recentItem.genre)
        .neq('id', recentItem.content_id)
        .not('id', watchedIds.size > 0 ? Array.from(watchedIds) : '')
        .limit(5);

      similarRecommendations.push(...similarContent.map(item => ({
        id: `similar_${item.id}_${item.content_id}`,
        content_id: item.id,
        content_type: 'movie' as const,
        title: item.title,
        description: item.description,
        coverImage: item.cover_image,
        backdropPath: item.backdrop_path,
        genre: item.genre,
        year: item.year,
        rating: item.rating,
        score: calculateSimilarityScore(item, recentItem),
        reason: `Similar a ${recentItem.title}`,
        category: 'similar' as const,
        metadata: {
          similarityScore: calculateSimilarityScore(item, recentItem),
        },
      })));
    }

    return [...genreRecommendations, ...similarRecommendations];
  }, []);

  // Recomendações colaborativas
  const generateCollaborativeRecommendations = useCallback(async (
    userId: string,
    userPreferences: any,
    excludeWatched: boolean
  ) => {
    try {
      // Encontrar usuários similares
      const { data: similarUsers } = await supabase
        .from('user_progress')
        .select('user_id')
        .neq('user_id', userId)
        .in('genre', userPreferences.topGenres)
        .limit(50);

      if (!similarUsers || similarUsers.length === 0) return [];

      const similarUserIds = similarUsers.map(u => u.user_id);

      // Buscar conteúdo que usuários similares assistiram
      const { data: collaborativeContent } = await supabase
        .from('user_progress')
        .select(`
          content_id,
          content_type,
          progress,
          cinema:cinema(id, title, description, cover_image, backdrop_path, genre, year, rating)
        `)
        .in('user_id', similarUserIds)
        .not('user_id', userId)
        .gte('progress', 70) // Usuários que completaram
        .limit(100);

      // Agrupar e pontuar
      const contentScores = collaborativeContent.reduce((acc, item) => {
        const contentId = item.content_id;
        if (!acc[contentId]) {
          acc[contentId] = {
            count: 0,
            totalProgress: 0,
            content: item.cinema,
          };
        }
        acc[contentId].count++;
        acc[contentId].totalProgress += item.progress;
        return acc;
      }, {} as Record<string, any>);

      return Object.entries(contentScores)
        .filter(([_, data]) => data.count >= 2) // Pelo menos 2 usuários similares
        .map(([contentId, data]) => ({
          id: `collaborative_${contentId}`,
          content_id: contentId,
          content_type: 'movie' as const,
          title: data.content.title,
          description: data.content.description,
          coverImage: data.content.cover_image,
          backdropPath: data.content.backdrop_path,
          genre: data.content.genre,
          year: data.content.year,
          rating: data.content.rating,
          score: (data.count / 10) + (data.totalProgress / data.count / 100),
          reason: `${data.count} usuários similares assistiram`,
          category: 'collaborative' as const,
          metadata: {
            collaborativeScore: data.count,
          },
        }));

    } catch (error) {
      console.error('❌ Erro nas recomendações colaborativas:', error);
      return [];
    }
  }, []);

  // Recomendações trending
  const generateTrendingRecommendations = useCallback((
    trending: any[],
    userPreferences: any,
    excludeWatched: boolean
  ) => {
    return trending
      .filter(item => {
        // Filtrar por preferências do usuário
        const inGenreRange = userPreferences.topGenres.includes(item.genre);
        const inRatingRange = item.rating >= userPreferences.preferredRatingRange.min && 
                               item.rating <= userPreferences.preferredRatingRange.max;
        const inYearRange = item.year >= userPreferences.preferredYearRange.min && 
                           item.year <= userPreferences.preferredYearRange.max;

        return inGenreRange || inRatingRange || inYearRange;
      })
      .map(item => ({
        id: `trending_${item.id}`,
        content_id: item.id,
        content_type: 'movie' as const,
        title: item.title,
        coverImage: item.cover_image,
        genre: item.genre,
        year: item.year,
        rating: item.rating,
        score: (item.view_count / 1000) + (item.rating / 10),
        reason: 'Em alta no momento',
        category: 'trending' as const,
        metadata: {
          popularityScore: item.view_count,
        },
      }));
  }, []);

  // Funções de cálculo de score
  const calculateGenreScore = useCallback((item: any, userPreferences: any) => {
    let score = 0;
    
    // Score por gênero
    if (userPreferences.topGenres.includes(item.genre)) {
      score += 30;
    }
    
    // Score por rating
    if (item.rating >= userPreferences.preferredRatingRange.min && 
        item.rating <= userPreferences.preferredRatingRange.max) {
      score += 20;
    }
    
    // Score por ano
    if (item.year >= userPreferences.preferredYearRange.min && 
        item.year <= userPreferences.preferredYearRange.max) {
      score += 15;
    }
    
    return score;
  }, []);

  const calculateSimilarityScore = useCallback((item: any, referenceItem: any) => {
    let score = 0;
    
    // Mesmo gênero
    if (item.genre === referenceItem.genre) score += 40;
    
    // Rating similar
    const ratingDiff = Math.abs(item.rating - referenceItem.rating);
    if (ratingDiff <= 1) score += 20;
    else if (ratingDiff <= 2) score += 10;
    
    // Ano similar
    const yearDiff = Math.abs(item.year - referenceItem.year);
    if (yearDiff <= 2) score += 15;
    else if (yearDiff <= 5) score += 10;
    
    return score;
  }, []);

  const calculateUserPreferenceScore = useCallback((item: any, userPreferences: any) => {
    let score = 0;
    
    score += calculateGenreScore(item, userPreferences);
    score += calculateSimilarityScore(item, {
      genre: userPreferences.topGenres[0],
      rating: userPreferences.avgRating,
      year: userPreferences.avgYear,
    });
    
    return score;
  }, []);

  // Combinar e pontuar recomendações
  const combineAndScoreRecommendations = useCallback((
    allRecommendations: RecommendationItem[],
    userPreferences: any,
    boostRecent: boolean
  ) => {
    // Remover duplicados
    const uniqueRecommendations = allRecommendations.reduce((acc, rec) => {
      const existing = acc.find(item => item.content_id === rec.content_id);
      if (existing) {
        // Combinar scores
        existing.score = Math.max(existing.score, rec.score);
        if (!existing.reason.includes(rec.reason)) {
          existing.reason += `, ${rec.reason}`;
        }
      } else {
        acc.push(rec);
      }
      return acc;
    }, [] as RecommendationItem[]);

    // Aplicar boost para conteúdo recente
    if (boostRecent) {
      uniqueRecommendations.forEach(rec => {
        if (rec.category === 'similar') {
          rec.score *= 1.2;
        }
      });
    }

    return uniqueRecommendations;
  }, []);

  // Estatísticas das recomendações
  const stats = useMemo(() => {
    if (!recommendations) return {
      total: 0,
      byCategory: {},
      topGenres: {},
      avgScore: 0,
    };

    const total = recommendations.length;
    const byCategory = recommendations.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topGenres = recommendations.reduce((acc, rec) => {
      if (rec.genre) {
        acc[rec.genre] = (acc[rec.genre] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / total;

    return {
      total,
      byCategory,
      topGenres,
      avgScore,
    };
  }, [recommendations]);

  return {
    // Dados
    recommendations,
    isLoading,
    error,
    stats,
    
    // Ações
    refetch,
    
    // Estados
    hasRecommendations: recommendations.length > 0,
    isEmpty: recommendations.length === 0,
  };
}

// Hook para recomendações específicas
export function useContentRecommendations(
  contentId: string,
  contentType: 'movie' | 'series',
  userId?: string,
  limit = 10
) {
  const { recommendations } = useRecommendations({
    userId,
    limit,
    categories: ['similar'],
  });

  const similarContent = recommendations.filter(rec => 
    rec.category === 'similar'
  );

  return {
    similarContent,
    hasSimilar: similarContent.length > 0,
  };
}
