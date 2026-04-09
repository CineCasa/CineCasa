import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWatchProgress } from './useWatchProgress';
import { useProfileSwitching } from './useProfileSwitching';

interface PersonalizedRecommendation {
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
  personalizedScore: number;
  reasons: string[];
  category: 'behavioral' | 'contextual' | 'temporal' | 'social' | 'adaptive';
  metadata: {
    timeOfDay?: string;
    dayOfWeek?: string;
    weatherContext?: string;
    moodPrediction?: string;
    socialProof?: {
      friendsWatched?: number;
      similarUsersWatched?: number;
      rating?: number;
    };
    learningScore?: number;
    confidence?: number;
  };
}

interface UserBehaviorPattern {
  timePatterns: {
    morning: string[];    // 6-12
    afternoon: string[];  // 12-18
    evening: string[];    // 18-22
    night: string[];      // 22-6
  };
  dayPatterns: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  moodPatterns: {
    stressed: string[];
    relaxed: string[];
    happy: string[];
    focused: string[];
    tired: string[];
  };
  preferences: {
    favoriteGenres: string[];
    favoriteActors: string[];
    favoriteDirectors: string[];
    preferredDuration: {
      min: number;
      max: number;
      average: number;
    };
    skipCredits: boolean;
    bingeWatching: boolean;
  };
}

interface UsePersonalizedRecommendationsOptions {
  userId?: string;
  profileId?: string;
  enableLearning?: boolean;
  enableContextual?: boolean;
  enableSocialProof?: boolean;
  refreshInterval?: number;
}

export function usePersonalizedRecommendations({
  userId,
  profileId,
  enableLearning = true,
  enableContextual = true,
  enableSocialProof = true,
  refreshInterval = 30 * 60 * 1000, // 30 minutos
}: UsePersonalizedRecommendationsOptions = {}) {
  const queryClient = useQueryClient();
  const { progress } = useWatchProgress({ userId });
  const { activeProfile } = useProfileSwitching({ userId });

  // Query para padrões de comportamento
  const { data: behaviorPatterns, isLoading: patternsLoading } = useQuery({
    queryKey: ['behavior-patterns', userId, profileId],
    queryFn: async (): Promise<UserBehaviorPattern> => {
      if (!userId) return getDefaultBehaviorPatterns();

      try {
        const { data, error } = await supabase
          .from('user_behavior_patterns')
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId || '')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('❌ Erro ao buscar padrões de comportamento:', error);
          return getDefaultBehaviorPatterns();
        }

        return data || getDefaultBehaviorPatterns();
      } catch (error) {
        console.error('❌ Erro ao analisar comportamento:', error);
        return getDefaultBehaviorPatterns();
      }
    },
    enabled: !!userId && enableLearning,
    staleTime: 60 * 60 * 1000, // 1 hora
    cacheTime: 24 * 60 * 1000, // 24 horas
  });

  // Query para recomendações personalizadas
  const { data: recommendations, isLoading, error, refetch } = useQuery({
    queryKey: ['personalized-recommendations', userId, profileId],
    queryFn: async (): Promise<PersonalizedRecommendation[]> => {
      if (!userId || !activeProfile) return [];

      try {
        // Analisar contexto atual
        const currentTime = new Date();
        const timeOfDay = getTimeOfDay(currentTime);
        const dayOfWeek = getDayOfWeek(currentTime);
        const weatherContext = await getWeatherContext(); // Se disponível
        const moodPrediction = predictMood(currentTime, behaviorPatterns);

        // Gerar recomendações baseadas em múltiplos fatores
        const recommendations: PersonalizedRecommendation[] = [];

        // 1. Recomendações comportamentais
        if (enableLearning) {
          recommendations.push(...generateBehavioralRecommendations(
            behaviorPatterns,
            timeOfDay,
            dayOfWeek,
            moodPrediction
          ));
        }

        // 2. Recomendações contextuais
        if (enableContextual) {
          recommendations.push(...generateContextualRecommendations(
            behaviorPatterns,
            timeOfDay,
            dayOfWeek,
            weatherContext
          ));
        }

        // 3. Recomendações sociais
        if (enableSocialProof) {
          recommendations.push(...generateSocialRecommendations(
            userId,
            behaviorPatterns
          ));
        }

        // 4. Recomendações adaptativas
        recommendations.push(...generateAdaptiveRecommendations(
          progress,
          behaviorPatterns,
          activeProfile
        ));

        // Ordenar por score personalizado
        return recommendations
          .sort((a, b) => b.personalizedScore - a.personalizedScore)
          .slice(0, 50);

      } catch (error) {
        console.error('❌ Erro ao gerar recomendações personalizadas:', error);
        return [];
      }
    },
    enabled: !!userId && !!activeProfile,
    staleTime: 15 * 60 * 1000, // 15 minutos
    cacheTime: 60 * 60 * 1000, // 1 hora
    refetchInterval: refreshInterval,
  });

  // Mutation para feedback do usuário
  const provideFeedback = useMutation({
    mutationFn: async ({
      recommendationId,
      feedback,
      rating,
    }: {
      recommendationId: string;
      feedback: 'liked' | 'disliked' | 'not_interested' | 'watched';
      rating?: number;
    }) => {
      const { data, error } = await supabase
        .from('recommendation_feedback')
        .insert({
          user_id: userId,
          profile_id: profileId || '',
          recommendation_id: recommendationId,
          feedback,
          rating,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar feedback:', error);
        throw error;
      }

      // Atualizar padrões de comportamento baseado no feedback
      if (enableLearning) {
        await updateBehaviorPatterns(feedback, rating);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar cache para forçar novas recomendações
      queryClient.invalidateQueries({ queryKey: ['personalized-recommendations', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro no feedback de recomendação:', error);
    },
  });

  // Função para analisar padrões de comportamento
  const analyzeBehaviorPatterns = useCallback(async () => {
    if (!userId || !progress) return;

    const patterns = analyzeWatchHistory(progress);
    
    // Salvar no banco
    await supabase
      .from('user_behavior_patterns')
      .upsert({
        user_id: userId,
        profile_id: profileId || '',
        patterns,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('profile_id', profileId || '');

    return patterns;
  }, [userId, profileId, progress]);

  // Funções de geração de recomendações
  const generateBehavioralRecommendations = useCallback((
    patterns: UserBehaviorPattern,
    timeOfDay: string,
    dayOfWeek: string,
    moodPrediction: string
  ): PersonalizedRecommendation[] => {
    const recommendations: PersonalizedRecommendation[] = [];
    
    // Baseado no padrão de horário
    const timeBasedGenres = patterns.timePatterns[timeOfDay as keyof typeof patterns.timePatterns] || [];
    
    // Baseado no padrão de dia da semana
    const dayBasedGenres = patterns.dayPatterns[dayOfWeek as keyof typeof patterns.dayPatterns] || [];
    
    // Baseado no humor previsto
    const moodBasedGenres = patterns.moodPatterns[moodPrediction as keyof typeof patterns.moodPatterns] || [];
    
    // Combinar todos os fatores
    const combinedGenres = [...new Set([...timeBasedGenres, ...dayBasedGenres, ...moodBasedGenres])];
    
    // Buscar conteúdo baseado nos gêneros combinados
    // (Implementação simplificada - em produção usaria busca real)
    combinedGenres.forEach(genre => {
      recommendations.push({
        id: `behavioral_${genre}_${Date.now()}`,
        content_id: `content_${genre}`,
        content_type: 'movie',
        title: `Recomendado por comportamento: ${genre}`,
        genre,
        personalizedScore: calculateBehavioralScore(patterns, genre, timeOfDay, dayOfWeek, moodPrediction),
        reasons: [
          `Baseado no seu padrão de ${timeOfDay}`,
          `Você costuma assistir ${genre} às ${dayOfWeek}s`,
          `Parece que você está com humor para ${moodPrediction}`,
        ],
        category: 'behavioral',
        metadata: {
          timeOfDay,
          dayOfWeek,
          moodPrediction,
          learningScore: 0.8,
          confidence: 0.75,
        },
      });
    });

    return recommendations;
  }, []);

  const generateContextualRecommendations = useCallback((
    patterns: UserBehaviorPattern,
    timeOfDay: string,
    dayOfWeek: string,
    weatherContext?: string
  ): PersonalizedRecommendation[] => {
    const recommendations: PersonalizedRecommendation[] = [];
    
    // Recomendações baseadas no tempo
    if (timeOfDay === 'morning') {
      recommendations.push({
        id: `contextual_morning_${Date.now()}`,
        content_id: `content_morning`,
        content_type: 'movie',
        title: 'Comece o dia com energia',
        genre: 'comedy',
        personalizedScore: 0.85,
        reasons: ['Conteúdo leve para começar o dia', 'Baseado no seu padrão matinal'],
        category: 'contextual',
        metadata: {
          timeOfDay,
          confidence: 0.8,
        },
      });
    }
    
    if (timeOfDay === 'night') {
      recommendations.push({
        id: `contextual_night_${Date.now()}`,
        content_id: `content_night`,
        content_type: 'movie',
        title: 'Relaxe antes de dormir',
        genre: 'drama',
        personalizedScore: 0.8,
        reasons: ['Conteúdo calmo para a noite', 'Baseado no seu padrão noturno'],
        category: 'contextual',
        metadata: {
          timeOfDay,
          confidence: 0.8,
        },
      });
    }

    // Recomendações baseadas no clima
    if (weatherContext === 'rainy') {
      recommendations.push({
        id: `contextual_rainy_${Date.now()}`,
        content_id: `content_rainy`,
        content_type: 'movie',
        title: 'Perfeito para um dia chuvoso',
        genre: 'drama',
        personalizedScore: 0.75,
        reasons: ['Conteúdo aconchegante para dia chuvoso', 'Baseado no clima atual'],
        category: 'contextual',
        metadata: {
          weatherContext,
          confidence: 0.7,
        },
      });
    }

    return recommendations;
  }, []);

  const generateSocialRecommendations = useCallback(async (
    userId: string,
    patterns: UserBehaviorPattern
  ): Promise<PersonalizedRecommendation[]> => {
    const recommendations: PersonalizedRecommendation[] = [];
    
    try {
      // Buscar amigos e seus gostos
      const { data: friends } = await supabase
        .from('user_friends')
        .select(`
          friend_id,
          friend_profiles:friend_id(name, preferences)
        `)
        .eq('user_id', userId)
        .limit(20);

      if (friends && friends.length > 0) {
        // Analisar padrões dos amigos
        const friendGenres = friends.reduce((acc, friend) => {
          const genres = friend.friend_profiles?.preferences?.favoriteGenres || [];
          genres.forEach(genre => {
            acc[genre] = (acc[genre] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);

        // Gerar recomendações baseadas nos amigos
        Object.entries(friendGenres)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .forEach(([genre, count]) => {
            recommendations.push({
              id: `social_${genre}_${Date.now()}`,
              content_id: `content_${genre}`,
              content_type: 'movie',
              title: `Popular entre seus amigos: ${genre}`,
              genre,
              personalizedScore: calculateSocialScore(count, patterns),
              reasons: [
                `${count} amigos assistiram ${genre}`,
                'Baseado no gosto de seus amigos',
              ],
              category: 'social',
              metadata: {
                socialProof: {
                  friendsWatched: count,
                  rating: 4.2,
                },
                confidence: 0.85,
              },
            });
          });
      }
    } catch (error) {
      console.error('❌ Erro ao gerar recomendações sociais:', error);
    }

    return recommendations;
  }, []);

  const generateAdaptiveRecommendations = useCallback((
    progress: any[],
    patterns: UserBehaviorPattern,
    activeProfile: any
  ): PersonalizedRecommendation[] => {
    const recommendations: PersonalizedRecommendation[] = [];
    
    // Análise de progresso recente
    const recentContent = progress.slice(0, 10);
    const recentGenres = [...new Set(recentContent.map(item => item.genre))];
    const recentRatings = recentContent.map(item => item.rating).filter(Boolean);
    const avgRecentRating = recentRatings.length > 0 
      ? recentRatings.reduce((sum, r) => sum + r, 0) / recentRatings.length 
      : 7;

    // Recomendações adaptativas baseadas no progresso
    if (avgRecentRating > 8) {
      // Usuário tem gostado de conteúdo de alta qualidade
      recommendations.push({
        id: `adaptive_high_quality_${Date.now()}`,
        content_id: `content_high_quality`,
        content_type: 'movie',
        title: 'Mais conteúdo de alta qualidade',
        genre: 'drama',
        personalizedScore: 0.9,
        reasons: [
          'Você tem assistido a conteúdo de alta avaliação',
          'Selecionamos os melhores filmes',
        ],
        category: 'adaptive',
        metadata: {
          learningScore: 0.9,
          confidence: 0.8,
        },
      });
    }

    if (recentGenres.includes('comedy') && recentGenres.length > 3) {
      // Usuário está em maratona de comédias
      recommendations.push({
        id: `adaptive_comedy_binge_${Date.now()}`,
        content_id: `content_comedy_binge`,
        content_type: 'movie',
        title: 'Continue a maratona de risadas',
        genre: 'comedy',
        personalizedScore: 0.85,
        reasons: [
          'Você está em uma maratona de comédias',
          'Mais filmes para continuar a diversão',
        ],
        category: 'adaptive',
        metadata: {
          learningScore: 0.85,
          confidence: 0.9,
        },
      });
    }

    return recommendations;
  }, []);

  // Funções utilitárias
  const calculateBehavioralScore = useCallback((
    patterns: UserBehaviorPattern,
    genre: string,
    timeOfDay: string,
    dayOfWeek: string,
    mood: string
  ): number => {
    let score = 0.5; // Base score

    // Score por padrão de tempo
    if (patterns.timePatterns[timeOfDay as keyof typeof patterns.timePatterns]?.includes(genre)) {
      score += 0.2;
    }

    // Score por padrão de dia
    if (patterns.dayPatterns[dayOfWeek as keyof typeof patterns.dayPatterns]?.includes(genre)) {
      score += 0.15;
    }

    // Score por padrão de humor
    if (patterns.moodPatterns[mood as keyof typeof patterns.moodPatterns]?.includes(genre)) {
      score += 0.15;
    }

    return Math.min(score, 1);
  }, []);

  const calculateSocialScore = useCallback((friendCount: number, patterns: UserBehaviorPattern): number => {
    const baseScore = Math.min(friendCount / 10, 0.8); // Normalizar para 0-0.8
    
    // Ajustar baseado na confiança dos amigos
    const trustBonus = patterns.preferences.favoriteGenres.length > 0 ? 0.1 : 0;
    
    return Math.min(baseScore + trustBonus, 1);
  }, []);

  const getTimeOfDay = useCallback((date: Date): string => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }, []);

  const getDayOfWeek = useCallback((date: Date): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }, []);

  const predictMood = useCallback((date: Date, patterns: UserBehaviorPattern): string => {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Lógica simples de predição de humor
    if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Dias de semana
      if (hour >= 9 && hour <= 17) return 'focused'; // Trabalho
      if (hour >= 18 && hour <= 22) return 'relaxed'; // Pós-trabalho
      return 'tired'; // Noite
    } else { // Fim de semana
      if (hour >= 10 && hour <= 23) return 'happy'; // Lazer
      return 'relaxed';
    }
  }, []);

  const getWeatherContext = useCallback(async (): Promise<string | undefined> => {
    // Em produção, integraria com API de clima
    // Por enquanto, retorna undefined
    return undefined;
  }, []);

  const updateBehaviorPatterns = useCallback(async (feedback: string, rating?: number) => {
    // Implementar aprendizado baseado no feedback
    console.log('🧠 Atualizando padrões de comportamento:', { feedback, rating });
    // Em produção, atualizaria o banco com novos padrões
  }, []);

  // Função para obter padrões padrão
  const getDefaultBehaviorPatterns = useCallback((): UserBehaviorPattern => {
    return {
      timePatterns: {
        morning: ['comedy', 'news'],
        afternoon: ['drama', 'documentary'],
        evening: ['action', 'thriller'],
        night: ['drama', 'romance'],
      },
      dayPatterns: {
        monday: ['drama', 'thriller'],
        tuesday: ['comedy', 'action'],
        wednesday: ['documentary', 'sci-fi'],
        thursday: ['romance', 'comedy'],
        friday: ['action', 'thriller'],
        saturday: ['comedy', 'family'],
        sunday: ['drama', 'documentary'],
      },
      moodPatterns: {
        stressed: ['comedy', 'music'],
        relaxed: ['drama', 'nature'],
        happy: ['comedy', 'adventure'],
        focused: ['documentary', 'educational'],
        tired: ['drama', 'romance'],
      },
      preferences: {
        favoriteGenres: ['action', 'comedy', 'drama'],
        favoriteActors: ['Tom Hanks', 'Leonardo DiCaprio'],
        favoriteDirectors: ['Christopher Nolan', 'Steven Spielberg'],
        preferredDuration: { min: 90, max: 150, average: 120 },
        skipCredits: true,
        bingeWatching: true,
      },
    };
  }, []);

  // Estatísticas das recomendações
  const stats = useMemo(() => {
    if (!recommendations) return {
      total: 0,
      byCategory: {},
      avgScore: 0,
      confidence: 0,
    };

    const total = recommendations.length;
    const byCategory = recommendations.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgScore = recommendations.reduce((sum, rec) => sum + rec.personalizedScore, 0) / total;
    const avgConfidence = recommendations.reduce((sum, rec) => sum + (rec.metadata?.confidence || 0), 0) / total;

    return {
      total,
      byCategory,
      avgScore,
      confidence: avgConfidence,
    };
  }, [recommendations]);

  return {
    // Dados
    recommendations,
    behaviorPatterns,
    isLoading,
    error,
    stats,
    patternsLoading,
    
    // Ações
    provideFeedback,
    analyzeBehaviorPatterns,
    refetch,
    
    // Estados
    hasRecommendations: recommendations.length > 0,
    isEmpty: recommendations.length === 0,
    isLearning: enableLearning,
  };
}
