import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

/**
 * Colunas reais da tabela watchlist:
 * id (TEXT), conteudo_id (text), created_at, user_id (uuid),
 * content_id (integer), content_type (text), titulo (text),
 * poster, banner, rating, year, genero
 *
 * CORREÇÕES:
 * - id é TEXT (não UUID gerado automaticamente) — precisamos gerar na inserção
 * - content_id é INTEGER (não number string)
 * - Removidos todos os console.log de debug
 * - conteudo_id é coluna legacy, não usamos
 */

interface WatchlistItem {
  id: string;
  content_id: number;
  content_type: string;
  user_id: string;
  titulo: string;
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
        console.error('Erro ao buscar watchlist:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const addToWatchlist = useMutation({
    mutationFn: async (item: Omit<WatchlistItem, 'id' | 'created_at'>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const isAlready = watchlist.some(
        w => w.content_id === item.content_id && w.content_type === item.content_type
      );
      if (isAlready) throw new Error('Item já está na watchlist');

      // id é TEXT — gerar UUID como string
      const newId = uuidv4();

      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          id: newId,
          user_id: userId,
          content_id: item.content_id,    // INTEGER
          content_type: item.content_type,
          titulo: item.titulo,
          poster: item.poster ?? null,
          banner: item.banner ?? null,
          rating: item.rating ?? null,
          year: item.year ?? null,
          genero: item.genero ?? null,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar à watchlist:', error);
        throw error;
      }

      return data;
    },
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist', userId] });
      const previousWatchlist = queryClient.getQueryData(['watchlist', userId]);

      const optimistic: WatchlistItem = {
        id: `temp-${Date.now()}`,
        content_id: item.content_id,
        content_type: item.content_type,
        user_id: userId || '',
        titulo: item.titulo,
        poster: item.poster ?? null,
        banner: item.banner ?? null,
        rating: item.rating ?? null,
        year: item.year ?? null,
        genero: item.genero ?? null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['watchlist', userId], (old: WatchlistItem[] = []) => [
        optimistic,
        ...old,
      ]);

      return { previousWatchlist };
    },
    onSuccess: (newItem, _vars, context) => {
      toast.success('Adicionado à lista "Ver depois" ✅');
      queryClient.setQueryData(['watchlist', userId], (old: WatchlistItem[] = []) => {
        const filtered = old.filter(w => !w.id.startsWith('temp-'));
        return [newItem, ...filtered];
      });
    },
    onError: (error, _vars, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist', userId], context.previousWatchlist);
      }
      if ((error as Error).message === 'Item já está na watchlist') {
        toast.error('Item já está na lista "Ver depois"');
      } else {
        toast.error('Erro ao adicionar à lista "Ver depois"');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async ({
      contentId,
      contentType,
    }: {
      contentId: number;
      contentType: string;
    }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao remover da watchlist:', error);
        throw error;
      }

      return { contentId, contentType };
    },
    onMutate: async ({ contentId, contentType }) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist', userId] });
      const previousWatchlist = queryClient.getQueryData(['watchlist', userId]);

      queryClient.setQueryData(['watchlist', userId], (old: WatchlistItem[] = []) =>
        old.filter(w => !(w.content_id === contentId && w.content_type === contentType))
      );

      return { previousWatchlist };
    },
    onSuccess: () => {
      toast.success('Removido da lista "Ver depois" 🗑️');
    },
    onError: (_error, _vars, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist', userId], context.previousWatchlist);
      }
      toast.error('Erro ao remover da lista "Ver depois"');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', userId] });
    },
  });

  const isInWatchlist = (contentId: number, contentType: string) =>
    watchlist.some(w => w.content_id === contentId && w.content_type === contentType);

  const toggleWatchlist = (item: Omit<WatchlistItem, 'id' | 'created_at' | 'user_id'>) => {
    if (!userId) {
      toast.error('Faça login para salvar na lista "Ver depois"');
      return;
    }
    if (isInWatchlist(item.content_id, item.content_type)) {
      removeFromWatchlist.mutate({ contentId: item.content_id, contentType: item.content_type });
    } else {
      addToWatchlist.mutate(item as Omit<WatchlistItem, 'id' | 'created_at'>);
    }
  };

  return {
    watchlist,
    isLoading,
    error,
    count: watchlist.length,
    addToWatchlist: addToWatchlist.mutate,
    removeFromWatchlist: removeFromWatchlist.mutate,
    toggleWatchlist,
    isInWatchlist,
    isAddingToWatchlist: addToWatchlist.isPending,
    isRemovingFromWatchlist: removeFromWatchlist.isPending,
  };
}
