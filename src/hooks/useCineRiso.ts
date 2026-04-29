import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export interface CineRisoContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseCineRisoReturn {
  content: CineRisoContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useCineRiso = () => {
  const [content, setContent] = useState<CineRisoContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    // Carregar em background sem mostrar loading
    
    
    try {
      console.log('[CineRiso] Buscando conteúdo de comédia...');
      
      // Buscar filmes e séries de comédia
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
          .or('genero.ilike.%comédia%,genero.ilike.%comedia%,category.ilike.%comédia%,category.ilike.%comedia%')
          .not('poster', 'is', null)
          .limit(20),
        supabase
          .from('series')
          .select('id, tmdb_id, titulo')
          .limit(10)
      ]);

      console.log('[CineRiso] Filmes encontrados:', cinemaData.data?.length || 0);
      console.log('[CineRiso] Séries encontradas:', seriesData.data?.length || 0);

      // Mapear filmes
      const movies: CineRisoContent[] = (cinemaData.data || []).map((item: any) => ({
        id: item.id.toString(),
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
      }));

      // Mapear séries
      const series: CineRisoContent[] = (seriesData.data || []).map((item: any) => ({
        id: item.id?.toString(),
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: item.capa ? tmdbImageUrl(item.capa, 'w500') : (item.banner ? tmdbImageUrl(item.banner, 'w500') : ''),
        type: 'series' as const,
        year: item.year || 'N/A',
        rating: 'N/A',
      }));

      // Embaralhar ambos
      const shuffledMovies = movies.sort(() => Math.random() - 0.5);
      const shuffledSeries = series.sort(() => Math.random() - 0.5);

      // Selecionar: 4 filmes e 1 série (ou completar com filmes se não houver séries)
      let selected: CineRisoContent[] = [];
      
      // Pegar 4 filmes (ou menos se não houver suficientes)
      selected = [...shuffledMovies.slice(0, 4)];
      
      // Pegar 1 série (se houver)
      if (shuffledSeries.length > 0 && shuffledSeries[0]) {
        selected.push(shuffledSeries[0]);
      } else if (shuffledMovies.length > 4 && shuffledMovies[4]) {
        // Se não houver série, completar com mais 1 filme (se houver)
        selected.push(shuffledMovies[4]);
      }
      
      // Garantir que sempre tenha 5 itens, completando com mais filmes se necessário
      let index = selected.length;
      while (selected.length < 5 && index < shuffledMovies.length) {
        const movie = shuffledMovies[index];
        if (movie) {
          selected.push(movie);
        }
        index++;
      }
      
      // Embaralhar resultado final
      const finalSelection = selected.slice(0, 5).sort(() => Math.random() - 0.5);

      console.log('[CineRiso] Selecionados:', finalSelection.length, 'itens');
      console.log('[CineRiso] Filmes:', finalSelection.filter(i => i.type === 'movie').length);
      console.log('[CineRiso] Séries:', finalSelection.filter(i => i.type === 'series').length);

      setContent(finalSelection);
    } catch (err) {
      console.error('[CineRiso] Erro:', err);
      setContent([]);
    }
  }, [setIsLoading]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useCineRiso] Inicializando carregamento...');
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    refresh,
  };
};

export default useCineRiso;
