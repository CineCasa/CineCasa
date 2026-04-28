import { useState, useEffect, useCallback, useMemo } from 'react';
import { genresService, type Genre } from '@/services/GenresService';

interface UseGenresReturn {
  genres: Genre[];
  trendingGenres: Genre[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  getGenreBySlug: (slug: string) => Promise<Genre | null>;
}

export function useGenres(limit: number = 100): UseGenresReturn {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [trendingGenres, setTrendingGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGenres = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [all, trending] = await Promise.all([
        genresService.getAllGenres(limit),
        genresService.getTrendingGenres(10)
      ]);
      setGenres(all);
      setTrendingGenres(trending);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar gêneros'));
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const refresh = useCallback(async () => {
    genresService.clearCache();
    await fetchGenres();
  }, [fetchGenres]);

  const getGenreBySlug = useCallback(async (slug: string) => {
    return genresService.getGenreBySlug(slug);
  }, []);

  return {
    genres,
    trendingGenres,
    isLoading,
    error,
    refresh,
    getGenreBySlug
  };
}

export function useContentGenres(contentId: number, contentType: 'movie' | 'series') {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const data = contentType === 'movie' 
        ? await genresService.getGenresForCinema(contentId)
        : await genresService.getGenresForSeries(contentId);
      setGenres(data);
      setIsLoading(false);
    };
    fetch();
  }, [contentId, contentType]);

  return { genres, isLoading };
}

export default useGenres;
