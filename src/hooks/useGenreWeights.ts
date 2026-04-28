import { useState, useEffect, useCallback, useRef } from 'react';
import { genreWeightsService, type GenreWeight, type TrendingGenre, type PersonalizedGenre } from '@/services/GenreWeightsService';
import { useAuth } from '@/components/AuthProvider';

interface UseGenreWeightsReturn {
  // Dados
  allWeights: GenreWeight[];
  trendingGenres: TrendingGenre[];
  personalizedGenres: PersonalizedGenre[];
  
  // Estados de loading
  isLoadingAll: boolean;
  isLoadingTrending: boolean;
  isLoadingPersonalized: boolean;
  
  // Ações
  refresh: () => Promise<void>;
  getGenreWeight: (genre: string) => Promise<number>;
  
  // Helpers
  hasData: boolean;
  topGenres: GenreWeight[];
}

export function useGenreWeights(): UseGenreWeightsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  const [allWeights, setAllWeights] = useState<GenreWeight[]>([]);
  const [trendingGenres, setTrendingGenres] = useState<TrendingGenre[]>([]);
  const [personalizedGenres, setPersonalizedGenres] = useState<PersonalizedGenre[]>([]);
  
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);
  
  // Refs para evitar duplicatas
  const hasFetchedAll = useRef(false);
  const hasFetchedTrending = useRef(false);
  const hasFetchedPersonalized = useRef(false);

  // Buscar todos os pesos
  const fetchAllWeights = useCallback(async () => {
    setIsLoadingAll(true);
    try {
      const data = await genreWeightsService.getAllGenreWeights();
      setAllWeights(data);
    } catch (err) {
      console.error('[useGenreWeights] Erro ao buscar pesos:', err);
    } finally {
      setIsLoadingAll(false);
    }
  }, []);

  // Buscar trending
  const fetchTrending = useCallback(async () => {
    setIsLoadingTrending(true);
    try {
      const data = await genreWeightsService.getTrendingGenres(10);
      setTrendingGenres(data);
    } catch (err) {
      console.error('[useGenreWeights] Erro trending:', err);
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  // Buscar personalizados
  const fetchPersonalized = useCallback(async () => {
    if (!userId) {
      setPersonalizedGenres([]);
      return;
    }
    setIsLoadingPersonalized(true);
    try {
      const data = await genreWeightsService.getPersonalizedGenres(userId, 10);
      setPersonalizedGenres(data);
    } catch (err) {
      console.error('[useGenreWeights] Erro personalized:', err);
    } finally {
      setIsLoadingPersonalized(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (!hasFetchedAll.current) {
      hasFetchedAll.current = true;
      fetchAllWeights();
    }
  }, [fetchAllWeights]);

  useEffect(() => {
    if (!hasFetchedTrending.current) {
      hasFetchedTrending.current = true;
      fetchTrending();
    }
  }, [fetchTrending]);

  useEffect(() => {
    if (userId && !hasFetchedPersonalized.current) {
      hasFetchedPersonalized.current = true;
      fetchPersonalized();
    }
  }, [userId, fetchPersonalized]);

  // Refresh all
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchAllWeights(),
      fetchTrending(),
      fetchPersonalized()
    ]);
  }, [fetchAllWeights, fetchTrending, fetchPersonalized]);

  // Wrapper para getGenreWeight
  const getGenreWeight = useCallback(async (genre: string): Promise<number> => {
    return genreWeightsService.getGenreWeight(genre);
  }, []);

  const topGenres = allWeights.slice(0, 5);
  const hasData = allWeights.length > 0;

  return {
    allWeights,
    trendingGenres,
    personalizedGenres,
    isLoadingAll,
    isLoadingTrending,
    isLoadingPersonalized,
    refresh,
    getGenreWeight,
    hasData,
    topGenres
  };
}

export default useGenreWeights;
