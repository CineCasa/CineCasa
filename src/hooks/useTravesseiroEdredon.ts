import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      
      console.log('[TravesseiroEdredon] Buscando conteúdo adulto...');
      
      // Buscar filmes da categoria adulto (case-insensitive) - buscar em 'genero' e 'category'
      const { data: cinemaData, error: cinemaError } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, description, category')
        .or('genero.ilike.%adulto%,category.ilike.%adulto%')
        .not('poster', 'is', null)
        .limit(10);
      
      if (cinemaError) {
        console.error('[TravesseiroEdredon] Erro cinema:', cinemaError);
      } else {
        console.log('[TravesseiroEdredon] Cinema raw:', cinemaData);
      }
      
      // Buscar séries da categoria adulto - usar apenas 'genero' pois 'category' não existe na tabela series
      const { data: seriesData, error: seriesError } = await supabase
        .from('series')
        .select('id_n, tmdb_id, titulo, banner, ano, genero, descricao')
        .ilike('genero', '%adulto%')
        .not('banner', 'is', null)
        .limit(10);
      
      if (seriesError) {
        console.error('[TravesseiroEdredon] Erro series:', seriesError);
      } else {
        console.log('[TravesseiroEdredon] Series raw:', seriesData);
      }

      console.log('[TravesseiroEdredon] Cinema count:', cinemaData?.length || 0, 'Séries count:', seriesData?.length || 0);

      const allContent: TravesseiroContent[] = [
        ...(cinemaData || []).map((item: any) => ({
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
          .not('poster', 'is', null)
          .limit(10);
          
        const { data: fallbackSeries } = await supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, banner, ano, genero, descricao')
          .not('banner', 'is', null)
          .limit(10);
        
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
        setContent(shuffledFallback.slice(0, 5));
      } else {
        // Embaralhar e limitar a 5 capas
        const shuffled = uniqueContent.sort(() => Math.random() - 0.5);
        setContent(shuffled.slice(0, 5));
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
