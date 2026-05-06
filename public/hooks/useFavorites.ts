import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

/**
 * Colunas reais da tabela favorites:
 * id, profile_id, created_at, user_id, content_type, titulo, poster,
 * banner, rating, year, genero, content_id_int (number), content_id (text)
 *
 * CORREÇÕES:
 * - content_id é TEXT no banco (não number como o hook assumia)
 * - content_id_int é o campo numérico (para joins com cinema/series)
 * - Removida dependência de genrePreferencesService (import quebrado)
 * - Tipos corrigidos para refletir o banco real
 */

export interface FavoriteItem {
  id: string;
  user_id: string;
  profile_id?: string | null;
  content_id: string;          // TEXT no banco
  content_id_int?: number | null; // INT para joins com cinema/series
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
  const userId = user?.id;

  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data as FavoriteItem[]) || []);
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addFavorite = useCallback(
    async (item: {
      content_id: string;
      content_id_int?: number;
      content_type: 'movie' | 'series';
      titulo?: string;
      poster?: string;
      banner?: string;
      rating?: string;
      year?: string;
      genero?: string;
    }) => {
      if (!userId) {
        toast.error('Faça login para adicionar favoritos');
        return;
      }

      // Verificar duplicata
      const alreadyFav = favorites.some(
        f => f.content_id === item.content_id && f.content_type === item.content_type
      );
      if (alreadyFav) {
        toast.error('Já está nos favoritos');
        return;
      }

      try {
        const payload: any = {
          user_id: userId,
          content_id: item.content_id,       // TEXT
          content_type: item.content_type,
          titulo: item.titulo ?? null,
          poster: item.poster ?? null,
          banner: item.banner ?? null,
          rating: item.rating ?? null,
          year: item.year ?? null,
          genero: item.genero ?? null,
        };

        // Salvar content_id_int se fornecido (para joins com cinema/series)
        if (item.content_id_int !== undefined) {
          payload.content_id_int = item.content_id_int;
        } else if (!isNaN(Number(item.content_id))) {
          payload.content_id_int = Number(item.content_id);
        }

        const { data, error } = await supabase
          .from('favorites')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        setFavorites(prev => [data as FavoriteItem, ...prev]);
        toast.success('Adicionado aos favoritos! ❤️');

        // Registrar interação para recomendações
        await supabase.from('user_interactions').insert({
          user_id: userId,
          content_id: item.content_id,
          content_type: item.content_type,
          interaction_type: 'favorite',
          genre: item.genero ?? null,
        }).then(() => {}).catch(() => {}); // não bloqueia
      } catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        toast.error('Erro ao adicionar favorito');
      }
    },
    [userId, favorites]
  );

  const removeFavorite = useCallback(
    async (contentId: string) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId);

        if (error) throw error;

        setFavorites(prev => prev.filter(f => f.content_id !== contentId));
        toast.success('Removido dos favoritos');

        // Registrar interação de remoção
        await supabase.from('user_interactions').insert({
          user_id: userId,
          content_id: contentId,
          content_type: 'movie',
          interaction_type: 'unfavorite',
        }).then(() => {}).catch(() => {});
      } catch (error) {
        console.error('Erro ao remover favorito:', error);
        toast.error('Erro ao remover favorito');
      }
    },
    [userId]
  );

  const isFavorite = useCallback(
    (contentId: string) => {
      return favorites.some(f => f.content_id === contentId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (item: Parameters<typeof addFavorite>[0]) => {
      if (isFavorite(item.content_id)) {
        await removeFavorite(item.content_id);
      } else {
        await addFavorite(item);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refresh: fetchFavorites,
  };
}
