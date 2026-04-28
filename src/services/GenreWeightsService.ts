/**
 * GenreWeightsService - Sistema profissional de pesos de gênero
 * Núcleo do recommendation engine da CineCasa
 */

import { supabase } from '@/integrations/supabase/client';

export interface GenreWeight {
  id: number;
  genre: string;
  weight: number;
  retention_rate: number | null;
  abandonment_rate: number | null;
  avg_rating: number | null;
  total_interactions: number | null;
  completion_rate: number | null;
  trending_score: number | null;
  growth_rate: number | null;
  engagement_score: number | null;
  avg_watch_time: number | null;
  total_ratings: number | null;
  avg_user_rating: number | null;
  last_calculated_at: string | null;
  updated_at: string | null;
}

export interface TrendingGenre {
  genre: string;
  weight: number;
  trending_score: number | null;
  engagement_score: number | null;
}

export interface PersonalizedGenre {
  genre: string;
  user_score: number;
  global_weight: number;
  combined_score: number;
}

export interface GenreAnalytics {
  genre: string;
  weight: number;
  retention_rate: number;
  abandonment_rate: number;
  engagement_score: number;
  completion_rate: number;
  total_interactions: number;
}

// Cache em memória para otimização
const genreWeightsCache = new Map<string, { data: GenreWeight; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

class GenreWeightsService {
  private static instance: GenreWeightsService;

  static getInstance(): GenreWeightsService {
    if (!GenreWeightsService.instance) {
      GenreWeightsService.instance = new GenreWeightsService();
    }
    return GenreWeightsService.instance;
  }

  /**
   * Obter peso de um gênero específico
   * Usa cache para performance
   */
  async getGenreWeight(genre: string): Promise<number> {
    const normalizedGenre = genre.toLowerCase().trim();
    
    // Verificar cache
    const cached = genreWeightsCache.get(normalizedGenre);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data.weight;
    }

    try {
      const { data, error } = await supabase
        .from('genre_weights')
        .select('weight, updated_at')
        .eq('genre', normalizedGenre)
        .maybeSingle();

      if (error) {
        console.warn('[GenreWeights] Erro ao buscar peso:', error);
        return 1.0; // Default
      }

      if (data) {
        genreWeightsCache.set(normalizedGenre, {
          data: data as GenreWeight,
          timestamp: Date.now()
        });
        return data.weight;
      }

      return 1.0; // Default para gêneros não calculados
    } catch (err) {
      console.error('[GenreWeights] Exceção:', err);
      return 1.0;
    }
  }

  /**
   * Buscar todos os pesos de gênero
   */
  async getAllGenreWeights(): Promise<GenreWeight[]> {
    try {
      const { data, error } = await supabase
        .from('genre_weights')
        .select('*')
        .order('weight', { ascending: false });

      if (error) {
        console.error('[GenreWeights] Erro ao buscar todos:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('[GenreWeights] Exceção:', err);
      return [];
    }
  }

  /**
   * Obter gêneros em tendência
   */
  async getTrendingGenres(limit: number = 10): Promise<TrendingGenre[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_genres', { p_limit: limit });

      if (error) {
        console.error('[GenreWeights] Erro trending:', error);
        return [];
      }

      return (data || []) as TrendingGenre[];
    } catch (err) {
      console.error('[GenreWeights] Exceção trending:', err);
      return [];
    }
  }

  /**
   * Obter gêneros personalizados para usuário
   * Combina preferências do usuário com pesos globais
   */
  async getPersonalizedGenres(
    userId: string,
    limit: number = 10
  ): Promise<PersonalizedGenre[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_personalized_genres', {
          p_user_id: userId,
          p_limit: limit
        });

      if (error) {
        console.error('[GenreWeights] Erro personalized:', error);
        return [];
      }

      return (data || []) as PersonalizedGenre[];
    } catch (err) {
      console.error('[GenreWeights] Exceção personalized:', err);
      return [];
    }
  }

  /**
   * Calcular recommendation score para conteúdo
   * Combina preferências do usuário com pesos dos gêneros
   */
  async calculateRecommendationScore(
    contentId: string,
    contentGenres: string[],
    userId?: string
  ): Promise<number> {
    try {
      // Se não tem usuário, usar apenas pesos globais
      if (!userId) {
        let totalWeight = 0;
        for (const genre of contentGenres) {
          const weight = await this.getGenreWeight(genre);
          totalWeight += weight;
        }
        return contentGenres.length > 0 
          ? Math.min(5, Math.max(0.5, totalWeight / contentGenres.length))
          : 1.0;
      }

      // Usar função RPC para cálculo completo
      const { data, error } = await supabase
        .rpc('calculate_content_recommendation_score', {
          p_content_id: contentId,
          p_user_id: userId
        });

      if (error) {
        console.warn('[GenreWeights] Erro RPC score:', error);
        // Fallback: cálculo manual
        return this.calculateManualScore(contentGenres, userId);
      }

      return data || 1.0;
    } catch (err) {
      console.error('[GenreWeights] Exceção score:', err);
      return 1.0;
    }
  }

  /**
   * Cálculo manual de score (fallback)
   */
  private async calculateManualScore(
    genres: string[],
    userId: string
  ): Promise<number> {
    try {
      // Buscar preferências do usuário
      const { data: userPrefs } = await supabase
        .from('user_genre_preferences')
        .select('genre, score')
        .eq('user_id', userId)
        .in('genre', genres);

      const prefMap = new Map(
        (userPrefs || []).map(p => [p.genre, p.score])
      );

      let totalScore = 0;
      let count = 0;

      for (const genre of genres) {
        const userScore = prefMap.get(genre) || 50; // Score neutro
        const globalWeight = await this.getGenreWeight(genre);
        totalScore += userScore * globalWeight;
        count++;
      }

      if (count === 0) return 1.0;

      // Normalizar para escala 0.5-5
      const normalized = totalScore / count / 100;
      return Math.min(5, Math.max(0.5, normalized));
    } catch {
      return 1.0;
    }
  }

  /**
   * Recalcular pesos de todos os gêneros
   * Deve ser chamado via cron ou edge function
   */
  async recalculateAllWeights(): Promise<{ success: boolean; count: number }> {
    try {
      const { data, error } = await supabase
        .rpc('recalculate_all_genre_weights');

      if (error) {
        console.error('[GenreWeights] Erro recalcular:', error);
        return { success: false, count: 0 };
      }

      // Limpar cache
      genreWeightsCache.clear();

      return { 
        success: true, 
        count: data?.length || 0 
      };
    } catch (err) {
      console.error('[GenreWeights] Exceção recalcular:', err);
      return { success: false, count: 0 };
    }
  }

  /**
   * Atualizar métricas de um gênero específico
   */
  async updateGenreMetrics(genre: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('update_genre_metrics', { p_genre: genre });

      if (error) {
        console.error('[GenreWeights] Erro update metrics:', error);
        return false;
      }

      // Limpar cache deste gênero
      genreWeightsCache.delete(genre.toLowerCase());

      return true;
    } catch (err) {
      console.error('[GenreWeights] Exceção update:', err);
      return false;
    }
  }

  /**
   * Obter analytics completos de gênero
   */
  async getGenreAnalytics(genre: string): Promise<GenreAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('genre_weights')
        .select('*')
        .eq('genre', genre.toLowerCase())
        .maybeSingle();

      if (error || !data) return null;

      return {
        genre: data.genre,
        weight: data.weight,
        retention_rate: data.retention_rate || 0,
        abandonment_rate: data.abandonment_rate || 0,
        engagement_score: data.engagement_score || 0,
        completion_rate: data.completion_rate || 0,
        total_interactions: data.total_interactions || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Calcular score combinado híbrido
   * Usado para ranking final de recomendações
   */
  calculateHybridScore(params: {
    userPreference: number;
    globalWeight: number;
    popularity: number;
    quality: number;
    recency: number;
  }): number {
    const {
      userPreference = 50,
      globalWeight = 1,
      popularity = 0.5,
      quality = 0.5,
      recency = 0.5
    } = params;

    // Pesos para cada fator
    const weights = {
      user: 0.35,
      global: 0.25,
      popularity: 0.15,
      quality: 0.15,
      recency: 0.10
    };

    // Normalizar cada fator para 0-1
    const normalizedUser = userPreference / 100;
    const normalizedGlobal = globalWeight / 5;
    const normalizedPop = popularity;
    const normalizedQuality = quality;
    const normalizedRecency = recency;

    // Calcular score ponderado
    const score =
      normalizedUser * weights.user +
      normalizedGlobal * weights.global +
      normalizedPop * weights.popularity +
      normalizedQuality * weights.quality +
      normalizedRecency * weights.recency;

    // Retornar em escala 0-100
    return Math.round(score * 100);
  }

  /**
   * Sugerir gêneros para usuário novo (cold start)
   */
  async getColdStartGenres(): Promise<string[]> {
    try {
      // Retornar gêneros mais populares com alta retenção
      const { data } = await supabase
        .from('genre_weights')
        .select('genre')
        .gt('retention_rate', 70) // Boa retenção
        .gt('weight', 1.2) // Acima do peso base
        .order('weight', { ascending: false })
        .limit(5);

      return (data || []).map(g => g.genre);
    } catch {
      // Fallback: gêneros populares genéricos
      return ['drama', 'comédia', 'ação', 'aventura', 'thriller'];
    }
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    genreWeightsCache.clear();
  }
}

export const genreWeightsService = GenreWeightsService.getInstance();
export default genreWeightsService;
