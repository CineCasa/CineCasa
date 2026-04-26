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
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  const fetchFinancas = useCallback(async () => {
    const loadingTimeout = setTimeout(() => setIsLoading(true), 500);
    
    try {
      console.log('[useFinancas] Buscando filmes de finanças...');
      
      // Busca otimizada de filmes de finanças
      const cinemaResult = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, year, rating, genero, category')
        .or('genero.ilike.%finanças%,genero.ilike.%financas%,genero.ilike.%finance%,category.ilike.%finanças%,category.ilike.%financas%,category.ilike.%finance%')
        .limit(20);

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

      // Não buscar fallback - apenas usar o que tem
      // Buscar todos os filmes do banco causa lentidão

      const shuffled = shuffleArray(uniqueFinancas);
      console.log('[useFinancas] Total combinado:', allFinancas.length);
      console.log('[useFinancas] Únicos após filtro:', uniqueFinancas.length);
      console.log('[useFinancas] Total:', shuffled.length);

      setFinancas(shuffled);
      clearTimeout(loadingTimeout);
    } catch (err) {
      console.error('[useFinancas] Erro ao buscar finanças:', err);
      setFinancas([]);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchFinancas();
  }, [fetchFinancas]);

  useEffect(() => {
    // Carregar sem bloquear UI
    if (!isInitialized.current) {
      isInitialized.current = true;
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
