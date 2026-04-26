import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

export interface Romance {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseRomancesReturn {
  romances: Romance[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useRomances = (userId?: string): UseRomancesReturn => {
  const [romances, setRomances] = useState<Romance[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Não começar como loading
  const isInitialized = useRef(false);
  const hasCacheLoaded = useRef(false);

  const fetchRomances = useCallback(async () => {
    // Não setar loading imediatamente - só mostrar se demorar mais de 500ms
    const loadingTimeout = setTimeout(() => setIsLoading(true), 500);
    
    try {
      console.log('[useRomances] Buscando filmes/séries de romance...');
      
      // Busca otimizada de itens de romance
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
          .or('genero.ilike.%romance%,category.ilike.%romance%')
          .limit(30), // Reduzido para melhor performance
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, ano, genero')
          .or('genero.ilike.%romance%')
          .limit(20) // Reduzido para melhor performance
      ]);

      console.log('[useRomances] Cinema result:', cinemaData.data?.length || 0, 'itens');
      console.log('[useRomances] Series result:', seriesData.data?.length || 0, 'itens');
      console.log('[useRomances] Erros:', cinemaData.error, seriesData.error);

      // REMOVER COLEÇÕES dos filmes de romance
      const filteredCinemaData = (cinemaData.data || []).filter(isNotCollection);
      
      const allRomances: Romance[] = [
        ...(filteredCinemaData).map((item: any) => ({
          id: item.id.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: item.poster,
          type: 'movie' as const,
          year: item.year,
          rating: item.rating,
        })),
        ...(seriesData.data || []).map((item: any) => ({
          id: item.id_n?.toString() || item.id?.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: '/api/placeholder/300/450', // Fallback para poster (séries não têm poster)
          type: 'series' as const,
          year: item.ano,
          rating: 'N/A', // Séries não têm rating na tabela
        })),
      ];

      // Remover duplicados (mesmo ID)
      const uniqueRomances = allRomances.filter((item, index, self) =>
        index === self.findIndex((r) => r.id === item.id)
      );

      // Fisher-Yates shuffle para randomização justa
      const shuffleArray = (array: Romance[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = shuffled[i];
          if (temp && shuffled[j]) {
            shuffled[i] = shuffled[j]!;
            shuffled[j] = temp;
          }
        }
        return shuffled;
      };

      // Se não temos romances suficientes, buscar filmes de outros gêneros como fallback
      if (uniqueRomances.length < 5) {
        console.log('[useRomances] Poucos romances encontrados, buscando fallback...');
        const { data: fallbackData } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating')
          .not('poster', 'is', null)
          .limit(20);
        
        const fallbackRomances = (fallbackData || [])
          .filter(isNotCollection)
          .filter((item: any) => !uniqueRomances.find(r => r.id === item.id.toString()))
          .map((item: any) => ({
            id: item.id.toString(),
            tmdbId: item.tmdb_id,
            title: item.titulo,
            poster: item.poster,
            type: 'movie' as const,
            year: item.year,
            rating: item.rating,
          }));
        
        uniqueRomances.push(...fallbackRomances);
      }

      const shuffled = shuffleArray(uniqueRomances);
      console.log('[useRomances] Total combinado:', allRomances.length);
      console.log('[useRomances] Únicos após filtro:', uniqueRomances.length);
      console.log('[useRomances] Selecionados:', shuffled.length);

      setRomances(shuffled.slice(0, 10));
      clearTimeout(loadingTimeout);
    } catch (err) {
      console.error('[useRomances] Erro ao buscar romances:', err);
      setRomances([]);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchRomances();
  }, [fetchRomances]);

  useEffect(() => {
    // Carregar sem bloquear UI
    if (!isInitialized.current) {
      isInitialized.current = true;
      // Carregar dados em background
      fetchRomances();
    }
  }, [fetchRomances]);

  return {
    romances,
    isLoading,
    refresh,
  };
};

export default useRomances;
