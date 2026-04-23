import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNotCollection } from '@/lib/utils';

export interface Financa {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
}

interface UseFinancasReturn {
  financas: Financa[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useFinancas = (userId?: string): UseFinancasReturn => {
  const [financas, setFinancas] = useState<Financa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchFinancas = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('[useFinancas] Buscando filmes de finanças...');
      
      // Busca apenas filmes da categoria Finanças (tanto em genero quanto category)
      const cinemaResult = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%finanças%,genero.ilike.%financas%,genero.ilike.%finance%,category.ilike.%finanças%,category.ilike.%financas%,category.ilike.%finance%');

      console.log('[useFinancas] Cinema result:', cinemaResult.data?.length || 0, 'itens');
      console.log('[useFinancas] Erro:', cinemaResult.error);

      // REMOVER COLEÇÕES dos filmes de finanças
      const filteredCinemaData = (cinemaResult.data || []).filter(isNotCollection);
      
      const allFinancas: Financa[] = [
        ...(filteredCinemaData).map((item: any) => ({
          id: item.id.toString(),
          tmdbId: item.tmdb_id,
          title: item.titulo,
          poster: item.poster,
          type: 'movie' as const,
          year: item.year,
          rating: item.rating,
        })),
      ];

      // Remover duplicados (mesmo ID)
      const uniqueFinancas = allFinancas.filter((item, index, self) =>
        index === self.findIndex((f) => f.id === item.id)
      );

      // Fisher-Yates shuffle para randomização justa
      const shuffleArray = (array: Financa[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      // Se não temos finanças suficientes, buscar filmes de outros gêneros como fallback
      if (uniqueFinancas.length < 5) {
        console.log('[useFinancas] Poucos filmes de finanças encontrados, buscando fallback...');
        const { data: fallbackData } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, year, rating')
          .not('poster', 'is', null);
        
        const fallbackFinancas = (fallbackData || [])
          .filter(isNotCollection)
          .filter((item: any) => !uniqueFinancas.find(f => f.id === item.id.toString()))
          .map((item: any) => ({
            id: item.id.toString(),
            tmdbId: item.tmdb_id,
            title: item.titulo,
            poster: item.poster,
            type: 'movie' as const,
            year: item.year,
            rating: item.rating,
          }));
        
        uniqueFinancas.push(...fallbackFinancas);
      }

      const shuffled = shuffleArray(uniqueFinancas);
      console.log('[useFinancas] Total combinado:', allFinancas.length);
      console.log('[useFinancas] Únicos após filtro:', uniqueFinancas.length);
      console.log('[useFinancas] Total:', shuffled.length);

      setFinancas(shuffled);
    } catch (err) {
      console.error('[useFinancas] Erro ao buscar finanças:', err);
      setFinancas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchFinancas();
  }, [fetchFinancas]);

  useEffect(() => {
    // Sempre buscar na montagem (atualiza a cada navegação)
    if (!isInitialized.current) {
      isInitialized.current = true;
      console.log('[useFinancas] Inicializando carregamento...');
      fetchFinancas();
    }
  }, [fetchFinancas]);

  return {
    financas,
    isLoading,
    refresh,
  };
};

export default useFinancas;
