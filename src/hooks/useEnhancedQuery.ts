import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

interface EnhancedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  // Opções de cache avançadas
  cacheTime?: number;
  staleTime?: number;
  // Prefetch
  prefetchOnMount?: boolean;
  prefetchDelay?: number;
  // Retry avançado
  retryDelay?: number;
  maxRetries?: number;
  // Background updates
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  // Cache invalidation
  invalidateOn?: string[];
  // Performance
  enableBackgroundUpdate?: boolean;
}

export function useEnhancedQuery<T>({
  queryKey,
  queryFn,
  cacheTime,
  staleTime = 2 * 60 * 1000, // 2 minutos default
  prefetchOnMount = false,
  prefetchDelay = 1000,
  retryDelay = 1000,
  maxRetries = 3,
  refetchInterval,
  refetchOnWindowFocus = true,
  refetchOnReconnect = true,
  invalidateOn = [],
  enableBackgroundUpdate = true,
  ...options
}: EnhancedQueryOptions<T>) {
  const [isPrefetching, setIsPrefetching] = useState(false);
  const queryClient = useQueryClient();

  // Query principal - gcTime substitui cacheTime no React Query v5
  const query = useQuery({
    queryKey,
    queryFn,
    gcTime: cacheTime,
    staleTime,
    retry: maxRetries,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnReconnect,
    ...options,
  });

  // Prefetch on mount
  useEffect(() => {
    if (prefetchOnMount && !query.isLoading) {
      const timer = setTimeout(() => {
        setIsPrefetching(true);
        queryClient.prefetchQuery({
          queryKey,
          queryFn,
          staleTime: cacheTime * 2, // Cache mais longo para prefetch
        }).finally(() => {
          setIsPrefetching(false);
        });
      }, prefetchDelay);

      return () => clearTimeout(timer);
    }
  }, [prefetchOnMount, query.isLoading, queryKey, queryFn, cacheTime, prefetchDelay, queryClient]);

  // Background update
  useEffect(() => {
    if (!enableBackgroundUpdate) return;

    const interval = setInterval(() => {
      // Verificar se dados estão stale
      const cachedData = queryClient.getQueryData(queryKey);
      if (cachedData) {
        // Buscar dados frescos em background
        queryFn()
          .then(freshData => {
            // Atualizar cache silenciosamente
            queryClient.setQueryData(queryKey, freshData);
            console.log(`🔄 Background update para ${queryKey.join(':')}`);
          })
          .catch(error => {
            console.error(`❌ Erro no background update:`, error);
          });
      }
    }, staleTime); // Atualizar a cada staleTime

    return () => clearInterval(interval);
  }, [enableBackgroundUpdate, queryKey, queryFn, staleTime, queryClient]);

  // Invalidação automática
  useEffect(() => {
    if (invalidateOn.length === 0) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (invalidateOn.includes(e.key)) {
        console.log(`🗑️ Invalidando query por mudança em ${e.key}:`, queryKey);
        queryClient.invalidateQueries({ queryKey });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [invalidateOn, queryKey, queryClient]);

  // Função para invalidar manualmente
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryKey, queryClient]);

  // Função para refetch manual
  const refetch = useCallback(() => {
    query.refetch();
  }, [query]);

  // Função para prefetch relacionado
  const prefetchRelated = useCallback((relatedQueryKey: string[], relatedQueryFn: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey: relatedQueryKey,
      queryFn: relatedQueryFn,
      staleTime: cacheTime,
    });
  }, [queryClient, cacheTime]);

  // Estatísticas do cache
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const relatedQueries = queries.filter(q => 
      q.queryKey.some(key => queryKey.includes(key))
    );

    return {
      totalQueries: relatedQueries.length,
      cachedQueries: relatedQueries.filter(q => q.state.data !== undefined).length,
      staleQueries: relatedQueries.filter(q => (q as any).state.isStale).length,
      fetchingQueries: relatedQueries.filter(q => q.state.fetchStatus === 'fetching').length,
    };
  }, [queryKey, queryClient]);

  return {
    ...query,
    // Estados adicionais
    isPrefetching,
    cacheStats: getCacheStats(),
    
    // Ações adicionais
    invalidate,
    refetch,
    prefetchRelated,
  };
}

// Hook para queries múltiplas (batch)
export function useBatchQueries<T>(queries: EnhancedQueryOptions<T>[]) {
  const queryClient = useQueryClient();
  
  const results = queries.map(options => 
    useEnhancedQuery(options)
  );

  // Função para refetch todas
  const refetchAll = useCallback(() => {
    results.forEach(result => result.refetch());
  }, [results]);

  // Função para invalidar todas
  const invalidateAll = useCallback(() => {
    results.forEach(result => result.invalidate());
  }, [results]);

  // Estatísticas combinadas
  const getCombinedStats = useCallback(() => {
    const stats = results.map(result => result.cacheStats);
    return {
      totalQueries: stats.reduce((sum, s) => sum + s.totalQueries, 0),
      cachedQueries: stats.reduce((sum, s) => sum + s.cachedQueries, 0),
      staleQueries: stats.reduce((sum, s) => sum + s.staleQueries, 0),
      fetchingQueries: stats.reduce((sum, s) => sum + s.fetchingQueries, 0),
    };
  }, [results]);

  return {
    results,
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    isSuccess: results.every(r => r.isSuccess),
    
    // Ações combinadas
    refetchAll,
    invalidateAll,
    
    // Estatísticas combinadas
    combinedStats: getCombinedStats(),
  };
}

// Hook para cache persistente
export function usePersistentQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: Omit<EnhancedQueryOptions<T>, 'queryKey' | 'queryFn'> = {}
) {
  const queryKey = ['persistent', key];
  const queryClient = useQueryClient();

  // Salvar no localStorage quando dados mudam
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(`query_${key}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          queryClient.setQueryData(queryKey, data);
        } catch (error) {
          console.error(`❌ Erro ao ler cache persistente ${key}:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    handleStorageChange(); // Executar uma vez no mount

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, queryKey, queryClient]);

  return useEnhancedQuery({
    ...options,
    queryKey,
    queryFn: async () => {
      try {
        const data = await queryFn();
        
        // Salvar no localStorage
        localStorage.setItem(`query_${key}`, JSON.stringify(data));
        
        return data;
      } catch (error) {
        // Tentar usar cache do localStorage em caso de erro
        const cached = localStorage.getItem(`query_${key}`);
        if (cached) {
          console.log(`📦 Usando cache persistente para ${key}`);
          return JSON.parse(cached);
        }
        
        throw error;
      }
    },
  });
}
