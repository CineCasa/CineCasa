import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FavoriteItem {
  id: string;
  movie_id: string;
  user_id: string;
  created_at: string;
}

interface OptimisticFavoritesOptions {
  userId?: string;
  enabled?: boolean;
}

export function useOptimisticFavorites({ userId, enabled = true }: OptimisticFavoritesOptions = {}) {
  const queryClient = useQueryClient();

  // Query para buscar favoritos
  const { data: favorites = [], isLoading, error } = useQuery({
    queryKey: ['favorites', userId],
    queryFn: async (): Promise<FavoriteItem[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar favoritos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: enabled && !!userId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para adicionar favorito (optimistic)
  const addToFavorites = useMutation({
    mutationFn: async (movieId: string) => {
      if (!userId) throw new Error('Usuário não autenticado');

      // Verificar se já não é favorito
      const isAlreadyFavorite = favorites.some(fav => fav.movie_id === movieId);
      if (isAlreadyFavorite) {
        throw new Error('Item já está nos favoritos');
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({
          movie_id: movieId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar favorito:', error);
        throw error;
      }

      return data;
    },
    onMutate: async (movieId) => {
      // 1. Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] });

      // 2. Salvar snapshot anterior
      const previousFavorites = queryClient.getQueryData(['favorites', userId]);

      // 3. Atualizar otimistamente (IMEDIATAMENTE)
      const optimisticFavorite: FavoriteItem = {
        id: `temp-${Date.now()}`,
        movie_id: movieId,
        user_id: userId || '',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['favorites', userId], (old: FavoriteItem[] = []) => [
        optimisticFavorite,
        ...old,
      ]);

      // 4. Retornar contexto para rollback
      return { previousFavorites, movieId };
    },
    onSuccess: (newFavorite, variables, context) => {
      // 1. Mostrar toast de sucesso
      toast.success('✅ Adicionado aos favoritos!');

      // 2. Atualizar com dados reais do servidor
      queryClient.setQueryData(['favorites', userId], (old: FavoriteItem[] = []) => {
        const filtered = old.filter(fav => fav.id !== `temp-${context.movieId}`);
        return [newFavorite, ...filtered];
      });

      // 3. Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
    },
    onError: (error, variables, context) => {
      // 1. Reverter para estado anterior
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', userId], context.previousFavorites);
      }

      // 2. Mostrar toast de erro
      if (error.message === 'Item já está nos favoritos') {
        toast.error('⚠️ Item já está nos favoritos');
      } else {
        toast.error('❌ Erro ao adicionar aos favoritos');
      }

      console.error('❌ Erro na mutation de adicionar favorito:', error);
    },
    onSettled: () => {
      // Refetch para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  // Mutation para remover favorito (optimistic)
  const removeFromFavorites = useMutation({
    mutationFn: async (movieId: string) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('movie_id', movieId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao remover favorito:', error);
        throw error;
      }

      return movieId;
    },
    onMutate: async (movieId) => {
      // 1. Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] });

      // 2. Salvar snapshot anterior
      const previousFavorites = queryClient.getQueryData(['favorites', userId]);

      // 3. Remover otimistamente (IMEDIATAMENTE)
      queryClient.setQueryData(['favorites', userId'], (old: FavoriteItem[] = []) =>
        old.filter(fav => fav.movie_id !== movieId)
      );

      // 4. Retornar contexto para rollback
      return { previousFavorites, movieId };
    },
    onSuccess: (removedMovieId, variables, context) => {
      // 1. Mostrar toast de sucesso
      toast.success('🗑️ Removido dos favoritos');

      // 2. Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
    },
    onError: (error, variables, context) => {
      // 1. Reverter para estado anterior
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', userId], context.previousFavorites);
      }

      // 2. Mostrar toast de erro
      toast.error('❌ Erro ao remover dos favoritos');

      console.error('❌ Erro na mutation de remover favorito:', error);
    },
    onSettled: () => {
      // Refetch para garantir consistência
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  // Função para verificar se é favorito
  const isFavorite = (movieId: string) => {
    return favorites.some(fav => fav.movie_id === movieId);
  };

  // Toggle de favorito (adiciona/remove)
  const toggleFavorite = (movieId: string) => {
    if (isFavorite(movieId)) {
      removeFromFavorites.mutate(movieId);
    } else {
      addToFavorites.mutate(movieId);
    }
  };

  // Sincronizar favoritos (para quando há mudanças em outra aba)
  const syncFavorites = () => {
    queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
  };

  // Limpar todos os favoritos (optimistic)
  const clearAllFavorites = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao limpar favoritos:', error);
        throw error;
      }

      return true;
    },
    onMutate: async () => {
      // Limpar otimistamente
      queryClient.setQueryData(['favorites', userId], []);
      return { previousFavorites: favorites };
    },
    onSuccess: () => {
      toast.success('🗑️ Todos os favoritos removidos');
    },
    onError: (error, variables, context) => {
      // Reverter em caso de erro
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', userId], context.previousFavorites);
      }
      toast.error('❌ Erro ao limpar favoritos');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  return {
    // Dados
    favorites,
    isLoading,
    error,
    count: favorites.length,

    // Ações
    addToFavorites: addToFavorites.mutate,
    removeFromFavorites: removeFromFavorites.mutate,
    toggleFavorite,
    syncFavorites,
    clearAllFavorites: clearAllFavorites.mutate,

    // Estados
    isFavorite,
    isAddingFavorite: addToFavorites.isPending,
    isRemovingFavorite: removeFromFavorites.isPending,
    isClearingFavorites: clearAllFavorites.isPending,
  };
}

// Hook para favoritos offline-first
export function useOfflineFavorites() {
  const queryClient = useQueryClient();

  // Sincronizar quando online
  const syncWhenOnline = () => {
    if (navigator.onLine) {
      // Buscar favoritos offline
      const offlineFavorites = localStorage.getItem('offline_favorites');
      
      if (offlineFavorites) {
        try {
          const favorites = JSON.parse(offlineFavorites);
          
          // Enviar para servidor
          favorites.forEach(async (favorite: any) => {
            try {
              await supabase.from('favorites').insert(favorite);
            } catch (error) {
              console.error('❌ Erro ao sincronizar favorito:', error);
            }
          });

          // Limpar storage local
          localStorage.removeItem('offline_favorites');
          
          // Invalidar query
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
          
          toast.success('🔄 Favoritos sincronizados com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao processar favoritos offline:', error);
        }
      }
    }
  };

  // Salvar favorito offline
  const saveOfflineFavorite = (favorite: any) => {
    const offlineFavorites = JSON.parse(localStorage.getItem('offline_favorites') || '[]');
    offlineFavorites.push(favorite);
    localStorage.setItem('offline_favorites', JSON.stringify(offlineFavorites));
    toast.info('💾 Favorito salvo offline. Será sincronizado quando voltar online.');
  };

  return {
    syncWhenOnline,
    saveOfflineFavorite,
    isOnline: navigator.onLine,
  };
}
