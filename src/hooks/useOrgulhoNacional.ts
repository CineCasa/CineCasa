import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export interface OrgulhoNacionalContent {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseOrgulhoNacionalReturn {
  content: OrgulhoNacionalContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useOrgulhoNacional = () => {
  const [content, setContent] = useState<OrgulhoNacionalContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    // Carregar em background sem mostrar loading
    
    try {
      console.log('[OrgulhoNacional] Buscando conteúdo da categoria nacional...');
      
      // SEMPRE buscar novos filmes a cada reinício (sem cache persistente)
      const { data: cinemaData, error } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genre, category')
        .or('genre.ilike.%nacional%,genre.ilike.%nacionais%,genre.ilike.%brasil%,genre.ilike.%brasileiro%,category.ilike.%nacional%,category.ilike.%nacionais%,category.ilike.%brasil%,category.ilike.%brasileiro%')
        .not('poster', 'is', null)
        .limit(100);

      if (error) {
        console.error('[OrgulhoNacional] Erro:', error);
        setContent([]);
        return;
      }

      console.log('[OrgulhoNacional] Filmes encontrados:', cinemaData?.length || 0);

      // Mapear filmes
      const movies: OrgulhoNacionalContent[] = (cinemaData || []).map((item: any) => ({
        id: item.id.toString(),
        tmdbId: item.tmdb_id,
        title: item.titulo,
        poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
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

      console.log('[OrgulhoNacional] Filmes únicos:', uniqueMovies.length);

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

      // Selecionar apenas 20 filmes aleatórios
      const selected = shuffled.slice(0, 20);

      console.log('[OrgulhoNacional] Selecionados:', selected.length, 'filmes');
      console.log('[OrgulhoNacional] Títulos:', selected.map(m => m.title).join(', '));

      setContent(selected);
    } catch (err) {
      console.error('[OrgulhoNacional] Erro:', err);
      setContent([]);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useOrgulhoNacional] Inicializando carregamento...');
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    refresh,
  };
};

export default useOrgulhoNacional;
