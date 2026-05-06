import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Colunas reais da tabela user_progress:
 * id, user_id, content_id, content_type, time_position, progress,
 * duration, updated_at, created_at, current_time, last_watched,
 * title, episode_id, season_number, episode_number
 *
 * CORREÇÕES:
 * - Remove chamada RPC 'get_continue_watching' (não existe no banco)
 * - Consulta user_progress diretamente com campos reais
 * - Busca poster/titulo das tabelas cinema/series via JOIN manual
 * - Filtra itens com progress entre 1% e 95%
 */

export interface ContinueWatchingItem {
  id: string;
  contentId: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  progress: number;
  duration: number;
  updatedAt: string;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  timePosition?: number;
}

interface UseContinueWatchingReturn {
  items: ContinueWatchingItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  removeItem: (contentId: string) => void;
}

export const useContinueWatching = (): UseContinueWatchingReturn => {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContinueWatching = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        return;
      }

      // Buscar progresso diretamente da tabela real
      const { data: progressRows, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          id,
          content_id,
          content_type,
          progress,
          duration,
          time_position,
          current_time,
          episode_id,
          season_number,
          episode_number,
          title,
          last_watched,
          updated_at
        `)
        .eq('user_id', user.id)
        .gt('progress', 1)
        .lt('progress', 95)
        .order('updated_at', { ascending: false })
        .limit(15);

      if (progressError) throw progressError;
      if (!progressRows || progressRows.length === 0) {
        setItems([]);
        return;
      }

      // Separar IDs por tipo para buscar poster/título
      const movieIds = progressRows
        .filter(r => r.content_type === 'movie')
        .map(r => Number(r.content_id))
        .filter(id => !isNaN(id));

      const seriesIds = progressRows
        .filter(r => r.content_type === 'series')
        .map(r => Number(r.content_id))
        .filter(id => !isNaN(id));

      // Buscar filmes
      const movieMap: Record<string, { titulo: string; poster: string }> = {};
      if (movieIds.length > 0) {
        const { data: movies } = await supabase
          .from('cinema')
          .select('id, titulo, poster')
          .in('id', movieIds);
        (movies || []).forEach((m: any) => {
          movieMap[m.id.toString()] = { titulo: m.titulo, poster: m.poster };
        });
      }

      // Buscar séries
      const seriesMap: Record<string, { titulo: string; capa: string }> = {};
      if (seriesIds.length > 0) {
        const { data: series } = await supabase
          .from('series')
          .select('id_n, titulo, capa')
          .in('id_n', seriesIds);
        (series || []).forEach((s: any) => {
          seriesMap[s.id_n.toString()] = { titulo: s.titulo, capa: s.capa };
        });
      }

      // Montar items finais
      const mapped: ContinueWatchingItem[] = progressRows.map((row: any) => {
        const cid = row.content_id?.toString() || '';
        const isMovie = row.content_type === 'movie';

        let title = row.title || 'Sem título';
        let poster = '';

        if (isMovie && movieMap[cid]) {
          title = movieMap[cid].titulo || title;
          poster = movieMap[cid].poster || '';
        } else if (!isMovie && seriesMap[cid]) {
          title = seriesMap[cid].titulo || title;
          poster = seriesMap[cid].capa || '';
        }

        // Normalizar URL do poster
        if (poster && !poster.startsWith('http')) {
          poster = `https://image.tmdb.org/t/p/w342${poster}`;
        }

        return {
          id: row.id,
          contentId: cid,
          title,
          poster,
          type: (row.content_type === 'movie' ? 'movie' : 'series') as 'movie' | 'series',
          progress: row.progress || 0,
          duration: row.duration || 0,
          updatedAt: row.updated_at || row.last_watched || new Date().toISOString(),
          episodeId: row.episode_id?.toString(),
          seasonNumber: row.season_number ?? undefined,
          episodeNumber: row.episode_number ?? undefined,
          timePosition: row.time_position || row.current_time || 0,
        };
      });

      setItems(mapped);
    } catch (err: any) {
      console.error('[useContinueWatching] Erro:', err);
      setError('Erro ao carregar continue watching');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Remover item localmente (sem deletar do banco — mantém histórico)
  const removeItem = useCallback((contentId: string) => {
    setItems(prev => prev.filter(i => i.contentId !== contentId));
  }, []);

  const refresh = useCallback(async () => {
    await fetchContinueWatching();
  }, [fetchContinueWatching]);

  useEffect(() => {
    fetchContinueWatching();
  }, [fetchContinueWatching]);

  return { items, isLoading, error, refresh, removeItem };
};

export default useContinueWatching;
