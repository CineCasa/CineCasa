import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

export interface HeroisDaVidaRealContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  voteAverage?: number;
}

interface UseHeroisDaVidaRealReturn {
  content: HeroisDaVidaRealContent[];
  isLoading: boolean;
  isVisible: boolean;
  refresh: () => Promise<void>;
}

// IDs de fallback do TMDB para filmes sobre pais/heróis (caso a busca automática falte)
const FALLBACK_TMDB_IDS = [
  278,    // The Shawshank Redemption (figura paterna)
  13,     // Forrest Gump (pai dedicado)
  857,    // Saving Private Ryan (missão para salvar filho)
  155,    // The Dark Knight (herói real)
  121,    // The Lord of the Rings (proteção da família)
  13,     // Forest Gump
  116745, // The Pursuit of Happyness (pai e filho)
  44896,  // The Tree of Life (família)
  106646, // The Wolf of Wall Street (família)
  1649,   // The Pursuit of Happyness
];

/**
 * Hook para a seção Heróis da Vida Real (Dia dos Pais)
 * Aparece durante todo o mês de agosto
 * Mostra 4 filmes + 1 série sobre paternidade/heróis
 */
export const useHeroisDaVidaReal = (): UseHeroisDaVidaRealReturn => {
  const [content, setContent] = useState<HeroisDaVidaRealContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isInitialized = useRef(false);

  /**
   * Verifica se está dentro do período de exibição (todo o mês de agosto)
   */
  const checkVisibility = useCallback((): boolean => {
    const now = new Date();
    const month = now.getMonth(); // 0-11 (7 = agosto)
    
    // Agosto é o mês 7 (Janeiro=0, Fevereiro=1, ..., Agosto=7)
    const isAugust = month === 7;
    
    console.log('[HeroisDaVidaReal] Mês atual:', month + 1, '| Visível:', isAugust);
    
    return isAugust;
  }, []);

  /**
   * Busca conteúdo usando fallback de IDs do TMDB
   */
  const fetchFallbackContent = useCallback(async (): Promise<HeroisDaVidaRealContent[]> => {
    console.log('[HeroisDaVidaReal] Usando fallback de IDs TMDB...');
    
    // Buscar filmes pelos IDs do TMDB
    const { data: fallbackMovies, error } = await supabase
      .from('cinema')
      .select('id, tmdb_id, titulo, poster, year, rating, vote_average')
      .in('tmdb_id', FALLBACK_TMDB_IDS)
      .not('poster', 'is', null)
      .order('vote_average', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[HeroisDaVidaReal] Erro fallback:', error);
      return [];
    }

    const movies: HeroisDaVidaRealContent[] = (fallbackMovies || [])
      .filter(isNotCollection)
      .map((item: any) => ({
        id: item.id?.toString() || `cinema-${Math.random()}`,
        tmdbId: item.tmdb_id,
        title: item.titulo || 'Sem título',
        poster: item.poster || '',
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
        voteAverage: item.vote_average || 0,
      }));

    return movies;
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Verificar se está no período de exibição
      const shouldShow = checkVisibility();
      setIsVisible(shouldShow);
      
      if (!shouldShow) {
        console.log('[HeroisDaVidaReal] Fora do período de exibição (mês de agosto)');
        setContent([]);
        setIsLoading(false);
        return;
      }
      
      console.log('[HeroisDaVidaReal] Buscando conteúdo sobre paternidade/heróis...');
      
      // Buscar filmes com termos sobre pais/paternidade na descrição ou título
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, description, genero, category, vote_average')
        .or('description.ilike.%pai%,description.ilike.%paternidade%,description.ilike.%paternal%,description.ilike.%filho%,description.ilike.%família%,description.ilike.%herói%,description.ilike.%heroi%,titulo.ilike.%pai%,titulo.ilike.%paterno%,titulo.ilike.%herói%')
        .or('genero.ilike.%Drama%,genero.ilike.%Ação%,genero.ilike.%Família%,category.ilike.%Drama%,category.ilike.%Ação%,category.ilike.%Família%')
        .not('poster', 'is', null)
        .order('vote_average', { ascending: false }) // Melhores notas primeiro
        .limit(20);

      if (cinemaError) {
        console.error('[HeroisDaVidaReal] Erro cinema:', cinemaError);
      }

      // Buscar séries com termos sobre pais/paternidade
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, banner, ano, descricao, genero, vote_average')
        .or('descricao.ilike.%pai%,descricao.ilike.%paternidade%,descricao.ilike.%paternal%,descricao.ilike.%filho%,descricao.ilike.%família%,descricao.ilike.%herói%,descricao.ilike.%heroi%,titulo.ilike.%pai%,titulo.ilike.%paterno%,titulo.ilike.%herói%')
        .or('genero.ilike.%Drama%,genero.ilike.%Ação%,genero.ilike.%Família%')
        .not('banner', 'is', null)
        .order('vote_average', { ascending: false })
        .limit(10);

      if (seriesError) {
        console.error('[HeroisDaVidaReal] Erro séries:', seriesError);
      }

      console.log('[HeroisDaVidaReal] Filmes encontrados:', cinemaData?.length || 0);
      console.log('[HeroisDaVidaReal] Séries encontradas:', seriesData?.length || 0);

      // Se não encontrou resultados suficientes, usar fallback
      let finalMovies: HeroisDaVidaRealContent[] = [];
      let finalSeries: HeroisDaVidaRealContent[] = [];

      if (!cinemaData || cinemaData.length < 4) {
        // Usar fallback para filmes
        const fallbackMovies = await fetchFallbackContent();
        
        // Combinar resultados da busca com fallback (removendo duplicados)
        const searchMovies = (cinemaData || [])
          .filter(isNotCollection)
          .map((item: any) => ({
            id: item.id?.toString() || `cinema-${Math.random()}`,
            tmdbId: item.tmdb_id,
            title: item.titulo || 'Sem título',
            poster: item.poster || '',
            type: 'movie' as const,
            year: item.year || 'N/A',
            rating: item.rating || 'N/A',
            voteAverage: item.vote_average || 0,
          }));

        // Merge e remover duplicados por tmdbId
        const tmdbIds = new Set(searchMovies.map(m => m.tmdbId).filter(Boolean));
        const uniqueFallback = fallbackMovies.filter(m => !tmdbIds.has(m.tmdbId));
        
        finalMovies = [...searchMovies, ...uniqueFallback];
      } else {
        // Usar apenas resultados da busca
        finalMovies = (cinemaData || [])
          .filter(isNotCollection)
          .map((item: any) => ({
            id: item.id?.toString() || `cinema-${Math.random()}`,
            tmdbId: item.tmdb_id,
            title: item.titulo || 'Sem título',
            poster: item.poster || '',
            type: 'movie' as const,
            year: item.year || 'N/A',
            rating: item.rating || 'N/A',
            voteAverage: item.vote_average || 0,
          }));
      }

      // Mapear séries
      finalSeries = (seriesData || []).map((item: any) => ({
        id: item.id_n?.toString() || `series-${Math.random()}`,
        tmdbId: item.tmdb_id,
        title: item.titulo || 'Sem título',
        poster: item.banner || '',
        type: 'series' as const,
        year: item.ano || 'N/A',
        rating: 'N/A',
        voteAverage: item.vote_average || 0,
      }));

      // Ordenar por vote_average (melhores notas primeiro)
      finalMovies.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
      finalSeries.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));

      // Selecionar 4 melhores filmes
      const selectedMovies = finalMovies.slice(0, 4);

      // Selecionar 1 melhor série (se houver)
      const selectedSeries = finalSeries.length > 0 
        ? [finalSeries[0]]
        : [];

      // Se não tiver série, pegar mais 1 filme (quinto melhor)
      let finalContent: HeroisDaVidaRealContent[];
      if (selectedSeries.length === 0 && finalMovies.length > 4) {
        selectedMovies.push(finalMovies[4]);
        finalContent = selectedMovies;
      } else {
        finalContent = [...selectedMovies, ...selectedSeries];
      }

      // Remover itens sem poster e duplicados
      const validContent = finalContent.filter(item => item.poster && item.poster.trim() !== '');
      const uniqueContent = validContent.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id || (t.tmdbId && t.tmdbId === item.tmdbId))
      );

      // Embaralhar para variedade a cada reinício (mas manter as melhores notas)
      const shuffled = [...uniqueContent].sort(() => Math.random() - 0.5);

      console.log('[HeroisDaVidaReal] Conteúdo final:', shuffled.length, 'itens');
      console.log('[HeroisDaVidaReal] Filmes:', selectedMovies.length, '| Séries:', selectedSeries.length);
      console.log('[HeroisDaVidaReal] Títulos:', shuffled.map(m => m.title).join(', '));

      setContent(shuffled);
    } catch (err) {
      console.error('[HeroisDaVidaReal] Erro ao buscar conteúdo:', err);
      setContent([]);
    }
  }, [checkVisibility, fetchFallbackContent]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useHeroisDaVidaReal] Inicializando...');
      fetchContent();
    }
  }, [fetchContent]);

  // Verificar visibilidade diariamente (a meia-noite pode mudar o mês)
  useEffect(() => {
    const checkDaily = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime();
      
      return setTimeout(() => {
        const shouldShow = checkVisibility();
        setIsVisible(prev => {
          if (prev !== shouldShow) {
            console.log('[HeroisDaVidaReal] Mudança de visibilidade:', shouldShow);
            if (shouldShow) {
              fetchContent();
            } else {
              setContent([]);
            }
          }
          return shouldShow;
        });
        // Reagendar para o próximo dia
        checkDaily();
      }, msUntilMidnight);
    };

    const timeoutId = checkDaily();
    return () => clearTimeout(timeoutId);
  }, [checkVisibility, fetchContent]);

  return {
    content,
    isLoading,
    isVisible,
    refresh,
  };
};

export default useHeroisDaVidaReal;
