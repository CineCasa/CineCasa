import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BaseadoEmFatosReaisContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseBaseadoEmFatosReaisReturn {
  content: BaseadoEmFatosReaisContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useBaseadoEmFatosReais = () => {
  const [content, setContent] = useState<BaseadoEmFatosReaisContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    // Carregar em background sem mostrar loading
    
    
    try {
      console.log('[BaseadoEmFatosReais] Buscando conteúdo da categoria documentário...');
      
      // Buscar filmes documentários
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%documentario%,genero.ilike.%documentário%,genero.ilike.%documentary%,category.ilike.%documentario%,category.ilike.%documentário%,category.ilike.%documentary%')
        .not('poster', 'is', null)
        .limit(100);

      if (cinemaError) {
        console.error('[BaseadoEmFatosReais] Erro ao buscar filmes:', cinemaError);
      }

      // Buscar séries documentárias
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, banner, ano, genero')
        .ilike('genero', '%documentario%')
        .not('banner', 'is', null)
        .limit(50);

      if (seriesError) {
        console.error('[BaseadoEmFatosReais] Erro ao buscar séries:', seriesError);
      }

      console.log('[BaseadoEmFatosReais] Filmes encontrados:', cinemaData?.length || 0);
      console.log('[BaseadoEmFatosReais] Séries encontradas:', seriesData?.length || 0);

      // Mapear filmes
      const movies: BaseadoEmFatosReaisContent[] = (cinemaData || []).map((item: any) => ({
        id: item.id.toString(),
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: item.poster,
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
      }));

      // Mapear séries
      const series: BaseadoEmFatosReaisContent[] = (seriesData || []).map((item: any) => ({
        id: item.id_n?.toString() || '',
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: item.banner,
        type: 'series' as const,
        year: item.ano?.toString() || 'N/A',
        rating: 'N/A',
      }));

      // Remover duplicados de filmes
      const uniqueMovies = movies.filter((item, index, self) => {
        if (item.tmdbId) {
          const duplicateWithTmdbId = self.findIndex((m) => m.tmdbId === item.tmdbId);
          return duplicateWithTmdbId === index;
        }
        const duplicateWithTitle = self.findIndex((m) => 
          m.title.toLowerCase().trim() === item.title.toLowerCase().trim()
        );
        return duplicateWithTitle === index;
      });

      // Remover duplicados de séries
      const uniqueSeries = series.filter((item, index, self) => {
        if (item.tmdbId) {
          const duplicateWithTmdbId = self.findIndex((m) => m.tmdbId === item.tmdbId);
          return duplicateWithTmdbId === index;
        }
        const duplicateWithTitle = self.findIndex((m) => 
          m.title.toLowerCase().trim() === item.title.toLowerCase().trim()
        );
        return duplicateWithTitle === index;
      });

      console.log('[BaseadoEmFatosReais] Filmes únicos:', uniqueMovies.length);
      console.log('[BaseadoEmFatosReais] Séries únicas:', uniqueSeries.length);

      // Embaralhar filmes (Fisher-Yates)
      const shuffledMovies = [...uniqueMovies];
      for (let i = shuffledMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tempI = shuffledMovies[i];
        const tempJ = shuffledMovies[j];
        if (tempI !== undefined && tempJ !== undefined) {
          shuffledMovies[i] = tempJ;
          shuffledMovies[j] = tempI;
        }
      }

      // Embaralhar séries (Fisher-Yates)
      const shuffledSeries = [...uniqueSeries];
      for (let i = shuffledSeries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tempI = shuffledSeries[i];
        const tempJ = shuffledSeries[j];
        if (tempI !== undefined && tempJ !== undefined) {
          shuffledSeries[i] = tempJ;
          shuffledSeries[j] = tempI;
        }
      }

      // Selecionar 4 filmes e 1 série
      const selectedMovies = shuffledMovies.slice(0, 4);
      const selectedSeries = shuffledSeries.slice(0, 1);

      // Combinar: 4 filmes + 1 série = 5 itens
      const selected = [...selectedMovies, ...selectedSeries];

      console.log('[BaseadoEmFatosReais] Selecionados:', selected.length, 'itens');
      console.log('[BaseadoEmFatosReais] Filmes:', selected.filter(s => s.type === 'movie').length);
      console.log('[BaseadoEmFatosReais] Séries:', selected.filter(s => s.type === 'series').length);
      console.log('[BaseadoEmFatosReais] Títulos:', selected.map(m => m.title).join(', '));

      setContent([...movies, ...series].slice(0, 10));
    } catch (err) {
      console.error('[BaseadoEmFatosReais] Erro:', err);
      setContent([]);
    }
  }, [setIsLoading]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useBaseadoEmFatosReais] Inicializando carregamento...');
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    refresh,
  };
};

export default useBaseadoEmFatosReais;
