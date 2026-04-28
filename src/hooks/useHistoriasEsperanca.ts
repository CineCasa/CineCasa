import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HistoriasEsperancaContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseHistoriasEsperancaReturn {
  content: HistoriasEsperancaContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useHistoriasEsperanca = () => {
  const [content, setContent] = useState<HistoriasEsperancaContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    // Carregar em background sem mostrar loading
    
    
    try {
      console.log('[HistoriasEsperanca] Buscando conteúdo da categoria religioso...');
      
      // SEMPRE buscar novos filmes a cada reinício (sem cache persistente)
      const { data: cinemaData, error } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%religioso%,genero.ilike.%religião%,genero.ilike.%religiao%,category.ilike.%religioso%,category.ilike.%religião%,category.ilike.%religiao%')
        .not('poster', 'is', null)
        .limit(100);

      if (error) {
        console.error('[HistoriasEsperanca] Erro:', error);
        setContent([]);
        return;
      }

      console.log('[HistoriasEsperanca] Filmes encontrados:', cinemaData?.length || 0);

      // Mapear filmes
      const movies: HistoriasEsperancaContent[] = (cinemaData || []).map((item: any) => ({
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

      console.log('[HistoriasEsperanca] Filmes únicos:', uniqueMovies.length);

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

      // Selecionar apenas 10 filmes aleatórios
      const selected = shuffled.slice(0, 10);

      console.log('[HistoriasEsperanca] Selecionados:', selected.length, 'filmes');
      console.log('[HistoriasEsperanca] Títulos:', selected.map(m => m.title).join(', '));

      setContent(selected);
    } catch (err) {
      console.error('[HistoriasEsperanca] Erro:', err);
      setContent([]);
    }
  }, [setIsLoading]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useHistoriasEsperanca] Inicializando carregamento...');
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    refresh,
  };
};

export default useHistoriasEsperanca;
