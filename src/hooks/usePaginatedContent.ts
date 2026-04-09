import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PaginationOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  initialPageSize?: number;
  enabled?: boolean;
}

interface PaginatedResult<T> {
  data: T[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  goToPage: (page: number) => void;
  resetPagination: () => void;
}

export function usePaginatedContent<T>({
  table,
  select = '*',
  filters = {},
  orderBy,
  initialPageSize = 20,
  enabled = true,
}: PaginationOptions): PaginatedResult<T> {
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const queryClient = useQueryClient();

  const queryKey = [
    'paginated',
    table,
    select,
    filters,
    orderBy,
    currentPage,
    pageSize,
  ];

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<{ data: T[]; count: number }> => {
      let query = supabase
        .from(table)
        .select(select, { count: 'exact' });

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Aplicar ordenação
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Aplicar paginação
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error(`❌ Erro na paginação da tabela ${table}:`, error);
        throw error;
      }

      return {
        data: data || [],
        count: count || 0,
      };
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPreviousPage = currentPage > 0;

  const fetchNextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const fetchPreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const resetPagination = useCallback(() => {
    setCurrentPage(0);
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0); // Voltar para primeira página
  }, []);

  // Preload próxima página
  useEffect(() => {
    if (hasNextPage && !isLoading) {
      const nextPageKey = [
        'paginated',
        table,
        select,
        filters,
        orderBy,
        currentPage + 1,
        pageSize,
      ];

      queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn: async () => {
          let query = supabase
            .from(table)
            .select(select, { count: 'exact' });

          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });

          if (orderBy) {
            query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
          }

          const from = (currentPage + 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);

          const { data, count } = await query;
          return { data: data || [], count: count || 0 };
        },
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [hasNextPage, isLoading, table, select, filters, orderBy, currentPage, pageSize, queryClient]);

  return {
    data: data?.data || [],
    isLoading,
    isError,
    error,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    pageSize,
    totalCount,
    fetchNextPage,
    fetchPreviousPage,
    goToPage,
    resetPagination,
  };
}

// Hook específico para scroll infinito
export function useInfiniteScroll<T>(options: PaginationOptions) {
  const [pages, setPages] = useState<T[][]>([]);
  const [hasMore, setHasMore] = useState(true);
  const queryClient = useQueryClient();

  const queryKey = ['infinite', options.table, options.filters, options.orderBy];

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<T[]> => {
      let query = supabase.from(options.table).select(options.select || '*');

      // Aplicar filtros
      Object.entries(options.filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
      }

      // Buscar todos os itens (sem limite para scroll infinito)
      const { data, error } = await query;

      if (error) {
        console.error(`❌ Erro no scroll infinito da tabela ${options.table}:`, error);
        throw error;
      }

      return data || [];
    },
    enabled: options.enabled,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    // Simular carregamento de mais itens
    const currentLength = pages.flat().length;
    const newItems = (data || []).slice(currentLength, currentLength + 20);
    
    if (newItems.length === 0) {
      setHasMore(false);
    } else {
      setPages(prev => [...prev, newItems]);
    }
  }, [hasMore, isLoading, data, pages]);

  const reset = useCallback(() => {
    setPages([]);
    setHasMore(true);
  }, []);

  return {
    data: pages.flat(),
    isLoading,
    isError,
    error,
    hasMore,
    loadMore,
    reset,
  };
}
