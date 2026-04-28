import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { updateGenrePreferences, processGenres, GENRE_SCORE_CONFIG } from '@/services/genrePreferencesService';

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

  // Buscar favoritos do usuário - usar user?.id como dependência para evitar loop
  const userId = user?.id;
  
  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Adicionar favorito - usar userId estável
  const addFavorite = useCallback(async (item: Omit<FavoriteItem, 'id' | 'user_id' | 'created_at'>) => {
    if (!userId) {
      toast.error('Faça login para adicionar favoritos');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ ...item, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar preferências de gênero (não bloqueante)
      const genres = processGenres(item.genero);
      if (genres.length > 0) {
        updateGenrePreferences(userId, genres, 'FAVORITE_ADD').catch(err => {
          console.error('[useFavorites] Erro ao atualizar preferências de gênero:', err);
        });
      }
      
      setFavorites(prev => [data, ...prev]);
      toast.success('Adicionado aos favoritos!');
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      toast.error('Erro ao adicionar favorito');
    }
  }, [userId]);

  // Remover favorito - usar userId estável
  const removeFavorite = useCallback(async (contentId: number) => {
    if (!userId) return;

    try {
      // Buscar gêneros do favorito antes de remover
      const favoriteToRemove = favorites.find(f => f.content_id === contentId);
      
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId);

      if (error) throw error;
      
      // Atualizar preferências de gênero (diminuir score) - não bloqueante
      if (favoriteToRemove) {
        const genres = processGenres(favoriteToRemove.genero);
        if (genres.length > 0) {
          updateGenrePreferences(userId, genres, 'FAVORITE_REMOVE').catch(err => {
            console.error('[useFavorites] Erro ao atualizar preferências de gênero:', err);
          });
        }
      }
      
      setFavorites(prev => prev.filter(f => f.content_id !== contentId));
      toast.success('Removido dos favoritos');
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      toast.error('Erro ao remover favorito');
    }
  }, [userId, favorites]);

  // Verificar se é favorito
  const isFavorite = useCallback((contentId: number) => {
    return favorites.some(f => f.content_id === contentId);
  }, [favorites]);

  // Carregar favoritos ao montar
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refresh: fetchFavorites
  };
}
