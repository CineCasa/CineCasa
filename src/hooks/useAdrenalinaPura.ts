import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export interface AdrenalinaPuraContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseAdrenalinaPuraReturn {
  content: AdrenalinaPuraContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useAdrenalinaPura = (): UseAdrenalinaPuraReturn => {
  const [content, setContent] = useState<AdrenalinaPuraContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('[AdrenalinaPura] Buscando conteúdo de ação e aventura...');
      
      // Buscar filmes das categorias ação e aventura
      const { data: cinemaData, error } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, category, genero')
        .or('category.ilike.%Ação%,category.ilike.%Aventura%,genero.ilike.%Ação%,genero.ilike.%Aventura%')
        .not('poster', 'is', null)
        .limit(100);

      if (error) {
        console.error('[AdrenalinaPura] Erro:', error);
        setContent([]);
        return;
      }

      console.log('[AdrenalinaPura] Filmes encontrados:', cinemaData?.length || 0);

      // Mapear filmes
      const movies: AdrenalinaPuraContent[] = (cinemaData || []).map((item: any) => ({
        id: item.id.toString(),
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
      }));

      // Remover duplicados (mesmo tmdbId ou título similar)
      const uniqueMovies = movies.filter((item, index, self) => {
        // Verificar se já existe um filme com o mesmo tmdbId
        if (item.tmdbId) {
          const duplicateWithTmdbId = self.findIndex((m) => m.tmdbId === item.tmdbId);
          return duplicateWithTmdbId === index;
        }
        // Verificar por título similar (case insensitive)
        const duplicateWithTitle = self.findIndex((m) => 
          m.title.toLowerCase().trim() === item.title.toLowerCase().trim()
        );
        return duplicateWithTitle === index;
      });

      console.log('[AdrenalinaPura] Filmes únicos:', uniqueMovies.length);

      // Embaralhar array (Fisher-Yates)
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

      console.log('[AdrenalinaPura] Selecionados:', selected.length, 'filmes');
      console.log('[AdrenalinaPura] Títulos:', selected.map(m => m.title).join(', '));

      setContent(selected);
    } catch (err) {
      console.error('[AdrenalinaPura] Erro ao buscar conteúdo:', err);
      setContent([]);
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

export default useAdrenalinaPura;
