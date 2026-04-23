import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PrepareParaMedoContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UsePrepareParaMedoReturn {
  content: PrepareParaMedoContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const usePrepareParaMedo = () => {
  const [content, setContent] = useState<PrepareParaMedoContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('[PrepareParaMedo] Buscando conteúdo da categoria terror...');
      
      // SEMPRE buscar novos filmes a cada reinício (sem cache persistente)
      const { data: cinemaData, error } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%terror%,genero.ilike.%horror%,genero.ilike.%medo%,category.ilike.%terror%,category.ilike.%horror%,category.ilike.%medo%')
        .not('poster', 'is', null);

      if (error) {
        console.error('[PrepareParaMedo] Erro:', error);
        setContent([]);
        return;
      }

      console.log('[PrepareParaMedo] Filmes encontrados:', cinemaData?.length || 0);

      // Mapear filmes
      const movies: PrepareParaMedoContent[] = (cinemaData || []).map((item: any) => ({
        id: item.id.toString(),
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: item.poster,
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
      }));

      // Remover duplicados
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

      console.log('[PrepareParaMedo] Filmes únicos:', uniqueMovies.length);

      // Embaralhar array (Fisher-Yates) para seleção aleatória
      const shuffled = [...uniqueMovies];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tempI = shuffled[i];
        const tempJ = shuffled[j];
        if (tempI !== undefined && tempJ !== undefined) {
          shuffled[i] = tempJ;
          shuffled[j] = tempI;
        }
      }

      console.log('[PrepareParaMedo] Total:', shuffled.length, 'filmes');
      console.log('[PrepareParaMedo] Títulos:', shuffled.map(m => m.title).join(', '));

      setContent(shuffled);
    } catch (err) {
      console.error('[PrepareParaMedo] Erro ao buscar conteúdo:', err);
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[usePrepareParaMedo] Inicializando carregamento...');
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    refresh,
  };
};

export default usePrepareParaMedo;
