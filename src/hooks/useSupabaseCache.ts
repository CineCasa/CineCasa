import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseCache } from '@/utils/cache';

interface UseSupabaseCacheOptions<T> {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  ttl?: number; // Time to live em ms
  enabled?: boolean;
}

export function useSupabaseCache<T>({
  table,
  select = '*',
  filters = {},
  orderBy,
  limit,
  ttl = 5 * 60 * 1000, // 5 minutos default
  enabled = true,
}: UseSupabaseCacheOptions<T>) {
  const queryClient = useQueryClient();

  // Gerar chave para o cache
  const queryKey = [
    'supabase',
    table,
    select,
    filters,
    orderBy,
    limit,
  ];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<T[]> => {
      // Tentar obter do cache primeiro
      const cachedData = await supabaseCache.getCachedData<T[]>(table, JSON.stringify({ select, filters, orderBy, limit }));
      if (cachedData) {
        console.log(`🎯 Cache HIT para tabela: ${table}`);
        return cachedData;
      }

      console.log(`🔍 Cache MISS para tabela: ${table}`);
      
      // Buscar do Supabase
      let query = supabase.from(table).select(select);

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

      // Aplicar limite
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ Erro ao buscar ${table}:`, error);
        throw error;
      }

      // Salvar no cache
      await supabaseCache.setCachedData(table, data, JSON.stringify({ select, filters, orderBy, limit }), ttl);

      return data || [];
    },
    staleTime: ttl,
    cacheTime: ttl * 2, // Manter no cache por 2x o TTL
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

// Hook para mutações com invalidação de cache
export function useSupabaseMutation<T, V>(
  table: string,
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: any) => void;
  }
) {
  const queryClient = useQueryClient();

  return useQueryClient().mutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidar cache da tabela
      supabaseCache.invalidateTable(table);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['supabase', table] });
      
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}

// Hook para preload de conteúdo
export function usePreloadContent(tables: string[], delay = 1000) {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      tables.forEach(table => {
        queryClient.prefetchQuery({
          queryKey: ['supabase', table],
          queryFn: async () => {
            const { data } = await supabase.from(table).select('*').limit(20);
            return data;
          },
          staleTime: 10 * 60 * 1000, // 10 minutos
        });
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [tables, delay, queryClient]);
}
