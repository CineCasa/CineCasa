import { supabase } from '@/integrations/supabase/client';

export interface Genre {
  id: string; nome: string; slug: string;
  description?: string | null; image_url?: string | null;
  popularity_score: number; content_count: number;
}

const genresCache = new Map<string, { data: Genre; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export function generateSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
}

class GenresService {
  private static instance: GenresService;
  static getInstance(): GenresService {
    if (!GenresService.instance) GenresService.instance = new GenresService();
    return GenresService.instance;
  }

  async getAllGenres(limit: number = 100): Promise<Genre[]> {
    const { data, error } = await supabase.rpc('get_all_genres', { p_limit: limit });
    if (error) { console.error('[GenresService] Erro:', error); return []; }
    return (data || []) as Genre[];
  }

  async getGenreBySlug(slug: string): Promise<Genre | null> {
    const cached = genresCache.get(slug);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
    const { data, error } = await supabase.rpc('get_genre_by_slug', { p_slug: slug });
    if (error || !data?.length) return null;
    const genre = data[0] as Genre;
    genresCache.set(slug, { data: genre, timestamp: Date.now() });
    return genre;
  }

  async getTrendingGenres(limit: number = 10): Promise<Genre[]> {
    const { data, error } = await supabase.rpc('get_trending_generos', { p_limit: limit });
    if (error) return [];
    return (data || []) as Genre[];
  }

  async getGenresForCinema(cinemaId: number): Promise<Genre[]> {
    const { data, error } = await supabase.from('cinema_genres')
      .select('generos(*)').eq('cinema_id', cinemaId).order('is_primary', { ascending: false });
    if (error) return [];
    return (data || []).map((item: any) => item.generos).filter(Boolean) as Genre[];
  }

  async getGenresForSeries(seriesId: number): Promise<Genre[]> {
    const { data, error } = await supabase.from('series_genres')
      .select('generos(*)').eq('series_id', seriesId).order('is_primary', { ascending: false });
    if (error) return [];
    return (data || []).map((item: any) => item.generos).filter(Boolean) as Genre[];
  }

  async syncWithTmdb(tmdbGenres: Array<{ id: number; name: string }>): Promise<void> {
    for (const g of tmdbGenres) {
      await supabase.rpc('sync_genre', { p_id: generateSlug(g.name), p_nome: g.name, p_tmdb_id: g.id });
    }
  }

  clearCache(): void { genresCache.clear(); }
}

export const genresService = GenresService.getInstance();
export default genresService;
