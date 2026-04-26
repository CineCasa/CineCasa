import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MentesCriminosasContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseMentesCriminosasReturn {
  content: MentesCriminosasContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useMentesCriminosas = () => {
  const [content, setContent] = useState<MentesCriminosasContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    const loadingTimeout = setTimeout(() => setIsLoading(true), 500);
    
    try {
      console.log('[MentesCriminosas] Buscando conteúdo de crime e policial...');
      
      // SEMPRE buscar novos filmes a cada reinício (sem cache persistente)
      const { data: cinemaData, error } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%crime%,genero.ilike.%policial%,category.ilike.%crime%,category.ilike.%policial%')
        .not('poster', 'is', null)
        .limit(100);

      if (error) {
        console.error('[MentesCriminosas] Erro:', error);
        setContent([]);
        return;
      }

      console.log('[MentesCriminosas] Filmes encontrados:', cinemaData?.length || 0);

      // Mapear filmes
      const movies: MentesCriminosasContent[] = (cinemaData || []).map((item: any) => ({
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

      console.log('[MentesCriminosas] Filmes únicos:', uniqueMovies.length);

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

      // Selecionar apenas 5 filmes aleatórios
      setContent(shuffled.slice(0, 10));
      console.log('[MentesCriminosas] Selecionados:', shuffled.slice(0, 10).length, 'filmes');
      clearTimeout(loadingTimeout);
    } catch (err) {
      console.error('[MentesCriminosas] Erro:', err);
      setContent([]);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, [setIsLoading]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useMentesCriminosas] Inicializando carregamento...');
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    refresh,
  };
};

export default useMentesCriminosas;
