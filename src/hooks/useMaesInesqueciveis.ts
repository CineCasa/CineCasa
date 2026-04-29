import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

export interface MaesInesqueciveisContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  voteAverage?: number;
}

interface UseMaesInesqueciveisReturn {
  content: MaesInesqueciveisContent[];
  isLoading: boolean;
  isVisible: boolean;
  refresh: () => Promise<void>;
}

// IDs de fallback do TMDB para filmes sobre mães (caso a busca automática falte)
const FALLBACK_TMDB_IDS = [
  5156,   // Stepmom
  2165,   // Anywhere But Here
  281957, // Room
  77877,  // The Kids Are All Right
  181,    // The Sound of Music (Maria Von Trapp como figura maternal)
  122906, // Gravity (maternidade espacial)
  73,     // Titanic (Rose e sua mãe)
  585,    // Little Women (March sisters e Marmee)
  120467, // The Help (maternidade e cuidado)
  122,    // The Lord of the Rings (Galadriel figura maternal)
];

/**
 * Hook para a seção Mães Inesquecíveis
 * Aparece durante todo o mês de maio (Dia das Mães)
 * Mostra 4 filmes + 1 série sobre maternidade/família
 */
export const useMaesInesqueciveis = (): UseMaesInesqueciveisReturn => {
  const [content, setContent] = useState<MaesInesqueciveisContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isInitialized = useRef(false);

  /**
   * Verifica se está dentro do período de exibição (todo o mês de maio)
   */
  const checkVisibility = useCallback((): boolean => {
    const now = new Date();
    const month = now.getMonth(); // 0-11 (4 = maio)
    
    // Maio é o mês 4 (Janeiro=0, Fevereiro=1, ..., Maio=4)
    const isMay = month === 4;
    
    console.log('[MaesInesqueciveis] Mês atual:', month + 1, '| Visível:', isMay);
    
    return isMay;
  }, []);

  /**
   * Busca conteúdo usando fallback de IDs do TMDB
   */
  const fetchFallbackContent = useCallback(async (): Promise<MaesInesqueciveisContent[]> => {
    console.log('[MaesInesqueciveis] Usando fallback de IDs TMDB...');
    
    // Buscar filmes pelos IDs do TMDB
    const { data: fallbackMovies, error } = await supabase
      .from('cinema')
      .select('id, tmdb_id, titulo, poster, year, rating, vote_average')
      .in('tmdb_id', FALLBACK_TMDB_IDS)
      .not('poster', 'is', null)
      .order('vote_average', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[MaesInesqueciveis] Erro fallback:', error);
      return [];
    }

    const movies: MaesInesqueciveisContent[] = (fallbackMovies || [])
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
        console.log('[MaesInesqueciveis] Fora do período de exibição (mês de maio)');
        setContent([]);
        setIsLoading(false);
        return;
      }
      
      console.log('[MaesInesqueciveis] Buscando conteúdo sobre maternidade/família...');
      
      // Buscar filmes com termos sobre mães/maternidade na descrição ou título
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, description, genero, category, vote_average')
        .or('description.ilike.%mãe%,description.ilike.%materno%,description.ilike.%maternidade%,description.ilike.%filhos%,description.ilike.%família%,description.ilike.%maternal%,titulo.ilike.%mãe%,titulo.ilike.%materno%,titulo.ilike.%maternidade%')
        .or('genero.ilike.%Drama%,genero.ilike.%Família%,category.ilike.%Drama%,category.ilike.%Família%')
        .not('poster', 'is', null)
        .order('vote_average', { ascending: false }) // Melhores notas primeiro
        .limit(20);

      if (cinemaError) {
        console.error('[MaesInesqueciveis] Erro cinema:', cinemaError);
      }

      // Buscar séries com termos sobre mães/maternidade
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, banner, ano, descricao, genero, rating')
        .or('descricao.ilike.%mãe%,descricao.ilike.%materno%,descricao.ilike.%maternidade%,descricao.ilike.%filhos%,descricao.ilike.%família%,descricao.ilike.%maternal%,titulo.ilike.%mãe%,titulo.ilike.%materno%,titulo.ilike.%maternidade%')
        .or('genero.ilike.%Drama%,genero.ilike.%Família%')
        .not('banner', 'is', null)
        .order('rating', { ascending: false })
        .limit(10);

      if (seriesError) {
        console.error('[MaesInesqueciveis] Erro séries:', seriesError);
      }

      console.log('[MaesInesqueciveis] Filmes encontrados:', cinemaData?.length || 0);
      console.log('[MaesInesqueciveis] Séries encontradas:', seriesData?.length || 0);

      // Se não encontrou resultados suficientes, usar fallback
      let finalMovies: MaesInesqueciveisContent[] = [];
      let finalSeries: MaesInesqueciveisContent[] = [];

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
        id: item.id?.toString() || `series-${Math.random()}`,
        tmdbId: item.tmdb_id,
        title: item.titulo || 'Sem título',
        poster: item.banner || '',
        type: 'series' as const,
        year: item.year || 'N/A',
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
      let finalContent: MaesInesqueciveisContent[];
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

      console.log('[MaesInesqueciveis] Conteúdo final:', shuffled.length, 'itens');
      console.log('[MaesInesqueciveis] Filmes:', selectedMovies.length, '| Séries:', selectedSeries.length);
      console.log('[MaesInesqueciveis] Títulos:', shuffled.map(m => m.title).join(', '));

      setContent(shuffled);
    } catch (err) {
      console.error('[MaesInesqueciveis] Erro ao buscar conteúdo:', err);
      setContent([]);
    }
  }, [checkVisibility, fetchFallbackContent]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useMaesInesqueciveis] Inicializando...');
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
            console.log('[MaesInesqueciveis] Mudança de visibilidade:', shouldShow);
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

export default useMaesInesqueciveis;
