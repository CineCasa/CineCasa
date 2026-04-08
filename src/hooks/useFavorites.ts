import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export interface FavoriteItem {
  id: string;
  user_id: string;
  content_id: number;
  content_type: 'movie' | 'series';
  titulo: string | null;
  poster: string | null;
  banner: string | null;
  rating: string | null;
  year: string | null;
  genero: string | null;
  created_at: string | null;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar favoritos do usuário
  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Verificar se item está nos favoritos
  const isFavorite = useCallback((contentId: number, contentType: string) => {
    return favorites.some(
      f => f.content_id === contentId && f.content_type === contentType
    );
  }, [favorites]);

  // Adicionar aos favoritos
  const addToFavorites = async (item: Omit<FavoriteItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) {
      toast.error('Faça login para adicionar à sua lista');
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          content_id: item.content_id,
          content_type: item.content_type,
          titulo: item.titulo,
          poster: item.poster,
          banner: item.banner,
          rating: item.rating,
          year: item.year,
          genero: item.genero,
        });

      if (error) throw error;
      
      toast.success('Adicionado à sua lista');
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      toast.error('Erro ao adicionar à lista');
      return false;
    }
  };

  // Remover dos favoritos
  const removeFromFavorites = async (contentId: number, contentType: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      if (error) throw error;
      
      toast.success('Removido da sua lista');
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover da lista');
      return false;
    }
  };

  // Toggle favorito (adicionar/remover)
  const toggleFavorite = async (item: Omit<FavoriteItem, 'id' | 'user_id' | 'created_at'>) => {
    const isFav = isFavorite(item.content_id, item.content_type);
    
    if (isFav) {
      return await removeFromFavorites(item.content_id, item.content_type);
    } else {
      return await addToFavorites(item);
    }
  };

  // Carregar favoritos ao montar o componente
  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  return {
    favorites,
    loading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    fetchFavorites,
  };
}
