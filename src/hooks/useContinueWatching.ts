import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tmdbImageUrl } from '@/services/tmdb';

export interface ContinueWatchingItem {
  id: string;
  contentId: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  progress: number;
  duration: number;
  updatedAt: string;
}

interface UseContinueWatchingReturn {
  items: ContinueWatchingItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useContinueWatching = (): UseContinueWatchingReturn => {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContinueWatching = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar do localStorage primeiro (fallback)
      const localProgress = localStorage.getItem('watch_progress');
      let localItems: ContinueWatchingItem[] = [];

      if (localProgress) {
        try {
          const parsed = JSON.parse(localProgress);
          localItems = Object.entries(parsed)
            .filter(([_, data]: [string, any]) => data.progress > 0 && data.progress < 95)
            .map(([id, data]: [string, any]) => ({
              id: `local-${id}`,
              contentId: id,
              title: data.title || 'Conteúdo',
              poster: data.poster || '',
              type: data.type || 'movie',
              progress: data.progress || 0,
              duration: data.duration || 0,
              updatedAt: data.updatedAt || new Date().toISOString(),
            }))
            .slice(0, 10);
        } catch (e) {
          console.log('[useContinueWatching] Erro ao parse localStorage:', e);
        }
      }

      // Tentar buscar da RPC (pode falhar se não existir)
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_continue_watching', {
              p_user_id: userData.user.id,
              p_limit: 10
            });

          if (!rpcError && rpcData) {
            const rpcItems: ContinueWatchingItem[] = rpcData.map((item: any) => ({
              id: item.id?.toString() || `rpc-${item.content_id}`,
              contentId: item.content_id?.toString() || '',
              title: item.title || 'Sem título',
              poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
              type: item.content_type || 'movie',
              progress: item.progress_percent || 0,
              duration: item.duration || 0,
              updatedAt: item.updated_at || new Date().toISOString(),
            }));

            setItems(rpcItems.length > 0 ? rpcItems : localItems);
            setIsLoading(false);
            return;
          }
        }
      } catch (rpcErr) {
        console.log('[useContinueWatching] RPC não disponível, usando localStorage');
      }

      // Fallback para localStorage
      setItems(localItems);
    } catch (err: any) {
      console.error('[useContinueWatching] Erro:', err);
      setError('Erro ao carregar continue watching');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchContinueWatching();
  }, [fetchContinueWatching]);

  useEffect(() => {
    fetchContinueWatching();
  }, [fetchContinueWatching]);

  return {
    items,
    isLoading,
    error,
    refresh,
  };
};

export default useContinueWatching;
