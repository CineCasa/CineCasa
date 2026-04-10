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

export const useMentesCriminosas = (): UseMentesCriminosasReturn => {
  const [content, setContent] = useState<MentesCriminosasContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
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
      const selected = shuffled.slice(0, 5);

      console.log('[MentesCriminosas] Selecionados:', selected.length, 'filmes');
      console.log('[MentesCriminosas] Títulos:', selected.map(m => m.title).join(', '));

      setContent(selected);
    } catch (err) {
      console.error('[MentesCriminosas] Erro ao buscar conteúdo:', err);
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
