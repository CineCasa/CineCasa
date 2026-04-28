/**
 * Serviço de Preferências de Gênero - CineCasa
 */

import { supabase, supabaseWithRetry } from '@/integrations/supabase/client';

// Tipos
export interface GenrePreference {
  id: number;
  user_id: string;
  genre: string;
  score: number;
  updated_at: string;
}

export interface UserFavoriteGenre {
  genre: string;
  score: number;
}

// Scores por ação
export const GENRE_SCORE_CONFIG = {
  WATCH_START: 2,
  WATCH_25_PERCENT: 3,
  WATCH_50_PERCENT: 5,
  WATCH_75_PERCENT: 7,
  WATCH_COMPLETE: 10,
  FAVORITE_ADD: 15,
  FAVORITE_REMOVE: -10,
  ABANDON_EARLY: -5,
  ABANDON_MID: -3,
  RATE_HIGH: 8,
  RATE_MEDIUM: 3,
  RATE_LOW: -5,
} as const;

export type GenreActionType = keyof typeof GENRE_SCORE_CONFIG;

// Extrai e normaliza gêneros
export function extractGenres(genreData: string | string[] | null): string[] {
  if (!genreData) return [];
  if (Array.isArray(genreData)) {
    return genreData.map(g => g?.trim()).filter(Boolean).map(g => g.toLowerCase());
  }
  return genreData.split(/[,\/]/).map(g => g?.trim()).filter(Boolean).map(g => g.toLowerCase());
}

export function normalizeGenre(genre: string): string {
  const map: Record<string, string> = {
    'sci-fi': 'ficção científica', 'scifi': 'ficção científica',
    'science fiction': 'ficção científica', 'ação': 'ação', 'action': 'ação',
    'drama': 'drama', 'comédia': 'comédia', 'comedy': 'comédia',
    'terror': 'terror', 'horror': 'terror', 'thriller': 'thriller',
    'suspense': 'thriller', 'romance': 'romance', 'aventura': 'aventura',
    'adventure': 'aventura', 'animação': 'animação', 'animation': 'animação',
    'anime': 'anime', 'documentário': 'documentário', 'documentary': 'documentário',
    'crime': 'crime', 'policial': 'policial', 'mistério': 'mistério',
    'mystery': 'mistério', 'fantasia': 'fantasia', 'fantasy': 'fantasia',
    'guerra': 'guerra', 'war': 'guerra', 'história': 'história', 'history': 'história',
    'família': 'família', 'family': 'família', 'musical': 'musical',
    'music': 'musical', 'western': 'faroeste', 'faroeste': 'faroeste',
  };
  const normalized = genre?.trim()?.toLowerCase() || '';
  return map[normalized] || normalized;
}

export function processGenres(genres: string | string[] | null): string[] {
  const extracted = extractGenres(genres);
  const normalized = extracted.map(normalizeGenre);
  return [...new Set(normalized)];
}

// Atualiza preferências de gênero
export async function updateGenrePreferences(
  userId: string,
  genres: string | string[] | null,
  action: GenreActionType | number,
  options?: { useRPC?: boolean }
): Promise<boolean> {
  try {
    const scoreDelta = typeof action === 'number' ? action : GENRE_SCORE_CONFIG[action];
    const processedGenres = processGenres(genres);
    
    if (processedGenres.length === 0 || scoreDelta === 0) {
      console.log('[GenrePreferences] Nada para atualizar - gêneros vazios ou score zero');
      return true;
    }

    console.log(`[GenrePreferences] Atualizando ${processedGenres.length} gêneros com score ${scoreDelta}:`, processedGenres);

    // Usar RPC se disponível
    if (options?.useRPC !== false) {
      const { error } = await supabase.rpc('update_genre_preferences', {
        p_user_id: userId,
        p_genres: processedGenres,
        p_score_delta: scoreDelta
      });

      if (error) {
        console.error('[GenrePreferences] Erro RPC:', error);
        // Fallback para método manual
        return await updateGenrePreferencesManual(userId, processedGenres, scoreDelta);
      }
      
      console.log('[GenrePreferences] Atualização RPC bem-sucedida');
      return true;
    }

    return await updateGenrePreferencesManual(userId, processedGenres, scoreDelta);
  } catch (error) {
    console.error('[GenrePreferences] Erro ao atualizar preferências:', error);
    return false;
  }
}

// Método manual de upsert (fallback)
async function updateGenrePreferencesManual(
  userId: string,
  genres: string[],
  scoreDelta: number
): Promise<boolean> {
  try {
    for (const genre of genres) {
      const { data: existing } = await supabase
        .from('user_genre_preferences')
        .select('score')
        .eq('user_id', userId)
        .eq('genre', genre)
        .maybeSingle();

      const newScore = existing 
        ? Math.max(-1000, Math.min(10000, existing.score + scoreDelta))
        : scoreDelta;

      const { error } = await supabase
        .from('user_genre_preferences')
        .upsert({
          user_id: userId,
          genre,
          score: newScore,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,genre',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`[GenrePreferences] Erro ao atualizar gênero ${genre}:`, error);
      }
    }
    return true;
  } catch (error) {
    console.error('[GenrePreferences] Erro no método manual:', error);
    return false;
  }
}

// Busca gêneros favoritos do usuário
export async function getUserFavoriteGenres(
  userId: string,
  limit: number = 10
): Promise<UserFavoriteGenre[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_favorite_genres', {
        p_user_id: userId,
        p_limit: limit
      });

    if (error) {
      console.error('[GenrePreferences] Erro ao buscar gêneros favoritos:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[GenrePreferences] Erro:', error);
    return [];
  }
}

// Busca conteúdo recomendado por gênero
export async function getContentByGenrePreferences(
  userId: string,
  contentType: 'movie' | 'series' = 'movie',
  limit: number = 20
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_content_by_genre_preferences', {
        p_user_id: userId,
        p_content_type: contentType,
        p_limit: limit,
        p_exclude_watched: true
      });

    if (error) {
      console.error('[GenrePreferences] Erro ao buscar conteúdo:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[GenrePreferences] Erro:', error);
    return [];
  }
}

// Reseta preferências do usuário
export async function resetGenrePreferences(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_genre_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[GenrePreferences] Erro ao resetar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[GenrePreferences] Erro:', error);
    return false;
  }
}
