import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WatchlistItem {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  createdAt: string;
}

interface UseWatchlistSectionReturn {
  watchlistItems: WatchlistItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  count: number;
}

export const useWatchlistSection = (userId?: string): UseWatchlistSectionReturn => {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const fetchWatchlist = useCallback(async () => {
    // Não buscar se não houver usuário logado
    if (!userId) {
      setWatchlistItems([]);
      setIsLoading(false);
      return;
    }

    // Não setar loading imediatamente - só mostrar se demorar mais de 300ms
    const loadingTimeout = setTimeout(() => setIsLoading(true), 300);
    
    try {
      console.log('[useWatchlistSection] Buscando watchlist para usuário:', userId);
      
      // Buscar apenas da tabela watchlist, filtrado por user_id
      // Ordenar por created_at DESC e limitar a 5 itens
      const { data, error: supabaseError } = await supabase
        .from('watchlist')
        .select('id, content_id, content_type, titulo, poster, banner, rating, year, genero, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (supabaseError) {
        console.error('[useWatchlistSection] Erro Supabase:', supabaseError);
        throw supabaseError;
      }

      console.log('[useWatchlistSection] Itens encontrados:', data?.length || 0);

      // Mapear para o formato WatchlistItem
      const mappedItems: WatchlistItem[] = (data || []).map((item: any) => ({
        id: item.content_id?.toString() || item.id,
        title: item.titulo || 'Sem título',
        poster: item.poster || item.banner || '/placeholder-poster.jpg',
        type: item.content_type as 'movie' | 'series',
        year: item.year || '',
        rating: item.rating || 'N/A',
        createdAt: item.created_at,
      }));

      setWatchlistItems(mappedItems);
      setError(null);
      clearTimeout(loadingTimeout);
    } catch (err: any) {
      console.error('[useWatchlistSection] Erro ao buscar watchlist:', err);
      setError('Erro ao carregar lista "Ver depois"');
      setWatchlistItems([]);
    } finally {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    await fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    // Carregar quando o componente montar ou userId mudar
    if (!isInitialized.current || userId) {
      isInitialized.current = true;
      fetchWatchlist();
    }
  }, [fetchWatchlist, userId]);

  return {
    watchlistItems,
    isLoading,
    error,
    refresh,
    count: watchlistItems.length,
  };
};

export default useWatchlistSection;
