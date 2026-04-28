import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

export interface CineNoiteContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseCineNoiteReturn {
  content: CineNoiteContent[];
  isLoading: boolean;
  isVisible: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook para a seção Cine Noite
 * Aparece diariamente das 23:58 às 05:59
 * Mostra 4 filmes + 1 série da categoria adulto
 */
export const useCineNoite = (): UseCineNoiteReturn => {
  const [content, setContent] = useState<CineNoiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isInitialized = useRef(false);

  /**
   * Verifica se está dentro do horário de exibição (23:58 - 05:59)
   */
  const checkVisibility = useCallback((): boolean => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes; // minutos desde meia-noite

    // 23:58 = 23 * 60 + 58 = 1438 minutos
    // 05:59 = 5 * 60 + 59 = 359 minutos
    const startTime = 23 * 60 + 58; // 23:58
    const endTime = 5 * 60 + 59;    // 05:59

    // Se está entre 23:58 e 23:59, ou entre 00:00 e 05:59
    const isVisible = currentTime >= startTime || currentTime <= endTime;
    
    console.log('[CineNoite] Horário atual:', `${hours}:${minutes.toString().padStart(2, '0')}`, '| Visível:', isVisible);
    
    return isVisible;
  }, []);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Verificar se está no horário antes de buscar
      const shouldShow = checkVisibility();
      setIsVisible(shouldShow);
      
      if (!shouldShow) {
        console.log('[CineNoite] Fora do horário de exibição (23:58 - 05:59)');
        setContent([]);
        setIsLoading(false);
        return;
      }
      
      console.log('[CineNoite] Buscando conteúdo adulto (4 filmes + 1 série)...');
      
      // Buscar filmes da categoria adulto
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%adulto%,genero.ilike.%erotico%,genero.ilike.%sexo%,category.ilike.%adulto%,category.ilike.%erotico%')
        .not('poster', 'is', null)
        .limit(20);

      if (cinemaError) {
        console.error('[CineNoite] Erro cinema:', cinemaError);
      }

      // Buscar séries da categoria adulto
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, banner, ano, genero')
        .or('genero.ilike.%adulto%,genero.ilike.%erotico%,genero.ilike.%sexo%')
        .not('banner', 'is', null)
        .limit(10);

      if (seriesError) {
        console.error('[CineNoite] Erro séries:', seriesError);
      }

      console.log('[CineNoite] Filmes encontrados:', cinemaData?.length || 0);
      console.log('[CineNoite] Séries encontradas:', seriesData?.length || 0);

      // Remover coleções dos filmes
      const filteredCinemaData = (cinemaData || []).filter(isNotCollection);

      // Mapear filmes
      const movies: CineNoiteContent[] = filteredCinemaData.map((item: any) => ({
        id: item.id?.toString() || `cinema-${Math.random()}`,
        tmdbId: item.tmdb_id,
        title: item.titulo || 'Sem título',
        poster: item.poster || '',
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
      }));

      // Mapear séries
      const series: CineNoiteContent[] = (seriesData || []).map((item: any) => ({
        id: item.id_n?.toString() || `series-${Math.random()}`,
        tmdbId: item.tmdb_id,
        title: item.titulo || 'Sem título',
        poster: item.banner || '',
        type: 'series' as const,
        year: item.ano || 'N/A',
        rating: 'N/A',
      }));

      // Selecionar 4 filmes aleatórios
      const shuffledMovies = [...movies].sort(() => Math.random() - 0.5);
      const selectedMovies = shuffledMovies.slice(0, 4);

      // Selecionar 1 série aleatória (se houver)
      const selectedSeries = series.length > 0 
        ? [series[Math.floor(Math.random() * series.length)]]
        : [];

      // Se não tiver série, pegar mais 1 filme
      let finalContent: CineNoiteContent[];
      if (selectedSeries.length === 0 && shuffledMovies.length > 4) {
        selectedMovies.push(shuffledMovies[4]);
        finalContent = selectedMovies;
      } else {
        finalContent = [...selectedMovies, ...selectedSeries];
      }

      // Remover duplicados e itens sem poster
      const validContent = finalContent.filter(item => item.poster && item.poster.trim() !== '');
      const uniqueContent = validContent.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      console.log('[CineNoite] Conteúdo final:', uniqueContent.length, 'itens');
      console.log('[CineNoite] Filmes:', selectedMovies.length, '| Séries:', selectedSeries.length);

      setContent(uniqueContent);
    } catch (err) {
      console.error('[CineNoite] Erro ao buscar conteúdo:', err);
      setContent([]);
    }
  }, [checkVisibility]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useCineNoite] Inicializando...');
      fetchContent();
    }
  }, [fetchContent]);

  // Verificar visibilidade a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldShow = checkVisibility();
      setIsVisible(prev => {
        if (prev !== shouldShow) {
          console.log('[CineNoite] Mudança de visibilidade:', shouldShow);
          if (shouldShow) {
            fetchContent(); // Recarregar quando aparecer
          }
        }
        return shouldShow;
      });
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [checkVisibility, fetchContent]);

  return {
    content,
    isLoading,
    isVisible,
    refresh,
  };
};

export default useCineNoite;
