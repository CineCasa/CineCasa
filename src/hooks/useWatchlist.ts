import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WatchlistItem {
  id: string;
  content_id: number;
  content_type: string;
  user_id: string;
  titulo: string | null;
  poster: string | null;
  banner: string | null;
  rating: string | null;
  year: string | null;
  genero: string | null;
  created_at: string;
}

interface WatchlistOptions {
  userId?: string;
  enabled?: boolean;
}

export function useWatchlist({ userId, enabled = true }: WatchlistOptions = {}) {
  const queryClient = useQueryClient();

  // Query para buscar watchlist
  const { data: watchlist = [], isLoading, error } = useQuery({
    queryKey: ['watchlist', userId],
    queryFn: async (): Promise<WatchlistItem[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar watchlist:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
  });

  // Mutation para adicionar à watchlist (optimistic)
  const addToWatchlist = useMutation({
    mutationFn: async (item: Omit<WatchlistItem, 'id' | 'created_at'>) => {
      console.log('🔍 addToWatchlist mutationFn called:', { userId, item });
      if (!userId) throw new Error('Usuário não autenticado');

      // Verificar se já não está na watchlist
      const isAlreadyInWatchlist = watchlist.some(w => 
        w.content_id === item.content_id && w.content_type === item.content_type
      );
      if (isAlreadyInWatchlist) {
        console.log('🔍 addToWatchlist - item already in watchlist');
        throw new Error('Item já está na watchlist');
      }

      console.log('🔍 addToWatchlist - inserting to Supabase:', {
        user_id: userId,
        content_id: item.content_id,
        content_type: item.content_type,
        titulo: item.titulo,
      });

      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: userId,
          content_id: item.content_id,
          content_type: item.content_type,
          titulo: item.titulo,
          poster: item.poster,
          banner: item.banner,
          rating: item.rating,
          year: item.year,
          genero: item.genero,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar à watchlist no Supabase:', error);
        throw error;
      }

      console.log('✅ addToWatchlist - success:', data);
      return data;
    },
    onMutate: async (item) => {
      // 1. Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['watchlist', userId] });

      // 2. Salvar snapshot anterior
      const previousWatchlist = queryClient.getQueryData(['watchlist', userId]);

      // 3. Atualizar otimistamente (IMEDIATAMENTE)
      const optimisticItem: WatchlistItem = {
        id: `temp-${Date.now()}`,
        content_id: item.content_id,
        content_type: item.content_type,
        user_id: userId || '',
        titulo: item.titulo,
        poster: item.poster,
        banner: item.banner,
        rating: item.rating,
        year: item.year,
        genero: item.genero,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['watchlist', userId], (old: WatchlistItem[] = []) => [
        optimisticItem,
        ...old,
      ]);

      // 4. Retornar contexto para rollback
      return { previousWatchlist, item };
    },
    onSuccess: (newItem, variables, context) => {
      // 1. Mostrar toast de sucesso
      toast.success('✅ Adicionado à lista "Ver depois"');

      // 2. Atualizar com dados reais do servidor
      queryClient.setQueryData(['watchlist', userId], (old: WatchlistItem[] = []) => {
        const filtered = old.filter(w => w.id !== `temp-${context.item.content_id}`);
        return [newItem, ...filtered];
      });
    },
    onError: (error, variables, context) => {
      // 1. Reverter para estado anterior
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist', userId], context.previousWatchlist);
      }

      // 2. Mostrar toast de erro
      if (error.message === 'Item já está na watchlist') {
        toast.error('⚠️ Item já está na lista "Ver depois"');
      } else {
        toast.error('❌ Erro ao adicionar à lista "Ver depois"');
      }

      console.error('❌ Erro na mutation de adicionar à watchlist:', error);
    },
    onSettled: () => {
      // Refetch para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
    },
  });

  // Mutation para remover da watchlist (optimistic)
  const removeFromWatchlist = useMutation({
    mutationFn: async ({ contentId, contentType }: { contentId: number; contentType: string }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao remover da watchlist:', error);
        throw error;
      }

      return { contentId, contentType };
    },
    onMutate: async ({ contentId, contentType }) => {
      // 1. Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['watchlist', userId] });

      // 2. Salvar snapshot anterior
      const previousWatchlist = queryClient.getQueryData(['watchlist', userId]);

      // 3. Remover otimistamente (IMEDIATAMENTE)
      queryClient.setQueryData(['watchlist', userId], (old: WatchlistItem[] = []) =>
        old.filter(w => !(w.content_id === contentId && w.content_type === contentType))
      );

      // 4. Retornar contexto para rollback
      return { previousWatchlist, contentId, contentType };
    },
    onSuccess: () => {
      // 1. Mostrar toast de sucesso
      toast.success('🗑️ Removido da lista "Ver depois"');
    },
    onError: (error, variables, context) => {
      // 1. Reverter para estado anterior
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist', userId], context.previousWatchlist);
      }

      // 2. Mostrar toast de erro
      toast.error('❌ Erro ao remover da lista "Ver depois"');

      console.error('❌ Erro na mutation de remover da watchlist:', error);
    },
    onSettled: () => {
      // Refetch para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
    },
  });

  // Função para verificar se está na watchlist
  const isInWatchlist = (contentId: number, contentType: string) => {
    return watchlist.some(w => w.content_id === contentId && w.content_type === contentType);
  };

  // Toggle da watchlist (adiciona/remove)
  const toggleWatchlist = (item: Omit<WatchlistItem, 'id' | 'created_at' | 'user_id'>) => {
    console.log('🔍 toggleWatchlist called:', { userId, item, isInWatchlist: isInWatchlist(item.content_id, item.content_type) });
    if (!userId) {
      console.error('❌ toggleWatchlist - userId is required');
      toast.error('Faça login para salvar na lista "Ver depois"');
      return;
    }
    if (isInWatchlist(item.content_id, item.content_type)) {
      console.log('🔍 toggleWatchlist - removing from watchlist');
      removeFromWatchlist.mutate({ contentId: item.content_id, contentType: item.content_type });
    } else {
      console.log('🔍 toggleWatchlist - adding to watchlist');
      addToWatchlist.mutate(item as Omit<WatchlistItem, 'id' | 'created_at'>);
    }
  };

  return {
    // Dados
    watchlist,
    isLoading,
    error,
    count: watchlist.length,

    // Ações
    addToWatchlist: addToWatchlist.mutate,
    removeFromWatchlist: removeFromWatchlist.mutate,
    toggleWatchlist,

    // Estados
    isInWatchlist,
    isAddingToWatchlist: addToWatchlist.isPending,
    isRemovingFromWatchlist: removeFromWatchlist.isPending,
  };
}
