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
      
      // Buscar TODOS os filmes e séries (sem limite)
      const [cinemaData, seriesData] = await Promise.all([
        supabase.from('cinema').select('id, tmdb_id, titulo, poster, year, rating, genero, description, category'),
        supabase.from('series').select('id_n, tmdb_id, titulo, capa, ano, genero, descricao')
      ]);

      const allContent: TravesseiroContent[] = [
        ...(cinemaData.data || []).map((item: any) => ({
          id: item.id?.toString() || `cinema-${Math.random()}`,
          title: item.titulo || 'Sem título',
          poster: item.poster || `https://picsum.photos/seed/${item.id || 'cinema'}/300/450.jpg`,
          type: 'movie' as const,
          year: item.year,
          rating: item.rating,
        })),
        ...(seriesData.data || []).map((item: any) => ({
          id: item.id_n?.toString() || `series-${Math.random()}`,
          title: item.titulo || 'Sem título',
          poster: item.capa || `https://picsum.photos/seed/${item.id_n || 'series'}/300/450.jpg`,
          type: 'series' as const,
          year: item.ano,
          rating: 'N/A', // Séries não têm rating na tabela
        })),
      ];

      // Remove duplicados
      const uniqueContent = allContent.filter((item, index, self) =>
        index === self.findIndex(t => t.id === item.id)
      );

      // Retornar TODOS (sem limite)
      const shuffled = uniqueContent.sort(() => Math.random() - 0.5);
      setContent(shuffled);
    } catch (err) {
      console.error('Erro ao buscar conteúdo:', err);
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
