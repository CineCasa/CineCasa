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
