import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';
import { tmdbImageUrl } from '@/services/tmdb';

export interface TravesseiroContent {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseTravesseiroEdredonReturn {
  content: TravesseiroContent[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useTravesseiroEdredon = (userId?: string): UseTravesseiroEdredonReturn => {
  const [content, setContent] = useState<TravesseiroContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    // Carregar em background sem mostrar loading
    
    try {
      console.log('[TravesseiroEdredon] Buscando conteúdo relaxante...');
      
      // Buscar filmes relaxantes (limitado para performance)
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%drama%,genero.ilike.%romance%,genero.ilike.%família%,category.ilike.%drama%,category.ilike.%romance%,category.ilike.%família%')
        .not('poster', 'is', null)
        .limit(30);
      
      // Buscar séries relaxantes (limitado para performance)
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, ano, genero, capa, banner')
        .or('genero.ilike.%drama%,genero.ilike.%romance%,genero.ilike.%família%')
        .limit(20);
      
      if (seriesError) {
        console.error('[TravesseiroEdredon] Erro series:', seriesError);
      } else {
        console.log('[TravesseiroEdredon] Series raw:', seriesData);
      }

      console.log('[TravesseiroEdredon] Cinema count:', cinemaData?.length || 0, 'Séries count:', seriesData?.length || 0);

      // REMOVER COLEÇÕES dos filmes
      const filteredCinemaData = (cinemaData || []).filter(isNotCollection);
      
      const allContent: TravesseiroContent[] = [
        ...(filteredCinemaData).map((item: any) => ({
          id: item.id?.toString() || `cinema-${Math.random()}`,
          title: item.titulo || 'Sem título',
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          type: 'movie' as const,
          year: item.year,
          rating: item.rating,
        })),
        ...(seriesData || []).map((item: any) => ({
          id: item.id_n?.toString() || `series-${Math.random()}`,
          title: item.titulo || 'Sem título',
          poster: item.capa ? tmdbImageUrl(item.capa, 'w500') : (item.banner ? tmdbImageUrl(item.banner, 'w500') : ''),
          type: 'series' as const,
          year: String(item.ano || 'N/A'),
          rating: 'N/A',
        })),
      ];

      // Remove duplicados e itens sem poster
      const validContent = allContent.filter(item => item.poster && item.poster.trim() !== '');
      const uniqueContent = validContent.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      console.log('[TravesseiroEdredon] Conteúdo válido:', uniqueContent.length);

      // Não buscar fallback - buscar todos os filmes causa lentidão
      // Limitar a 20 itens para performance
      const shuffled = uniqueContent.sort(() => Math.random() - 0.5).slice(0, 20);
      setContent(shuffled);
    } catch (err) {
      console.error('[TravesseiroEdredon] Erro:', err);
      setContent([]);
    }
  }, [setIsLoading]);

  const refresh = useCallback(async () => {
    await fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useTravesseiroEdredon] Inicializando carregamento...');
      fetchContent();
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    refresh,
  };
};

export default useTravesseiroEdredon;
