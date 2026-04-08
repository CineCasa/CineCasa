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
        supabase.from('cinema').select('*'),
        supabase.from('series').select('*')
      ]);

      const allContent: TravesseiroContent[] = [
        ...(cinemaData.data || []).map((item: any) => ({
          id: item.id_n?.toString() || item.id?.toString() || `cinema-${Math.random()}`,
          title: item.titulo || 'Sem título',
          poster: item.capa || item.poster || `https://picsum.photos/seed/${item.id_n || item.id || 'cinema'}/300/450.jpg`,
          type: 'movie' as const,
          year: item.ano,
          rating: item.rating,
        })),
        ...(seriesData.data || []).map((item: any) => ({
          id: item.id_n?.toString() || item.id?.toString() || `series-${Math.random()}`,
          title: item.titulo || 'Sem título',
          poster: item.capa || item.poster || `https://picsum.photos/seed/${item.id_n || item.id || 'series'}/300/450.jpg`,
          type: 'series' as const,
          year: item.ano,
          rating: item.rating,
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
