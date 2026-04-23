import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

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
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('[TravesseiroEdredon] Buscando conteúdo relaxante (drama, romance, família)...');
      
      // Buscar filmes relaxantes (drama, romance, família, musical)
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%drama%,genero.ilike.%romance%,genero.ilike.%família%,category.ilike.%drama%,category.ilike.%romance%,category.ilike.%família%')
        .not('poster', 'is', null);
      
      if (cinemaError) {
        console.error('[TravesseiroEdredon] Erro cinema:', cinemaError);
      } else {
        console.log('[TravesseiroEdredon] Cinema raw:', cinemaData);
      }
      
      // Buscar séries relaxantes (drama, romance, família)
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, banner, ano, genero')
        .or('genero.ilike.%drama%,genero.ilike.%romance%,genero.ilike.%família%')
        .not('banner', 'is', null);
      
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
          poster: item.poster || '',
          type: 'movie' as const,
          year: item.year,
          rating: item.rating,
        })),
        ...(seriesData || []).map((item: any) => ({
          id: item.id_n?.toString() || `series-${Math.random()}`,
          title: item.titulo || 'Sem título',
          poster: item.banner || '',
          type: 'series' as const,
          year: item.ano,
          rating: 'N/A',
        })),
      ];

      // Remove duplicados e itens sem poster
      const validContent = allContent.filter(item => item.poster && item.poster.trim() !== '');
      const uniqueContent = validContent.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      console.log('[TravesseiroEdredon] Conteúdo válido:', uniqueContent.length);

      // Se não temos conteúdo adulto suficiente, buscar qualquer conteúdo como fallback
      if (uniqueContent.length < 5) {
        console.log('[TravesseiroEdredon] Buscando fallback...');
        
        const { data: fallbackCinema } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, description')
          .not('poster', 'is', null);
          
        const { data: fallbackSeries } = await supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, banner, ano, genero, descricao')
          .not('banner', 'is', null);
        
        const fallbackContent: TravesseiroContent[] = [
          ...(fallbackCinema || []).map((item: any) => ({
            id: item.id?.toString() || `cinema-${Math.random()}`,
            title: item.titulo || 'Sem título',
            poster: item.poster || '',
            type: 'movie' as const,
            year: item.year,
            rating: item.rating,
          })),
          ...(fallbackSeries || []).map((item: any) => ({
            id: item.id_n?.toString() || `series-${Math.random()}`,
            title: item.titulo || 'Sem título',
            poster: item.banner || '',
            type: 'series' as const,
            year: item.ano,
            rating: 'N/A',
          })),
        ].filter(item => item.poster && item.poster.trim() !== '');
        
        // Adicionar fallback ao conteúdo existente
        const combined = [...uniqueContent, ...fallbackContent];
        const uniqueCombined = combined.filter((item, index, self) =>
          index === self.findIndex(t => t.id === item.id)
        );
        
        const shuffledFallback = uniqueCombined.sort(() => Math.random() - 0.5);
        setContent(shuffledFallback);
      } else {
        // Embaralhar todos os conteúdos
        const shuffled = uniqueContent.sort(() => Math.random() - 0.5);
        setContent(shuffled);
      }
      
      console.log('[TravesseiroEdredon] Final:', uniqueContent.length, 'capas');
    } catch (err) {
      console.error('[TravesseiroEdredon] Erro ao buscar conteúdo adulto:', err);
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
