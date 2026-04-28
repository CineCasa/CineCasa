import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeProgress } from './useRealtimeProgress';

export interface ContinueWatchingItem {
  id: string;
  contentId: string;
  contentType: 'movie' | 'series';
  title: string;
  poster: string;
  banner?: string;
  episodeId?: string;
  episodeTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  progress: number; // 0-100
  currentTime: number; // seconds
  duration: number; // seconds
  updatedAt: string;
}

// Usar RPC para buscar continue watching com ordenação inteligente
const fetchContinueWatchingRpc = async (userId: string, limit: number = 10) => {
  const { data, error } = await supabase.rpc('get_continue_watching', {
    p_user_id: userId,
    p_limit: limit
  });
  
  if (error) {
    console.error('[useContinueWatching] Erro RPC:', error);
    throw error;
  }
  
  return data || [];
};

// Usar RPC para upsert de progresso
const upsertProgressRpc = async (params: {
  userId: string;
  contentId: number;
  contentType: 'movie' | 'series';
  currentTime: number;
  duration: number;
  progress: number;
  episodeId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
}) => {
  const { data, error } = await supabase.rpc('upsert_user_progress', {
    p_user_id: params.userId,
    p_content_id: params.contentId,
    p_content_type: params.contentType,
    p_current_time: params.currentTime,
    p_duration: params.duration,
    p_progress: params.progress,
    p_episode_id: params.episodeId || null,
    p_season_number: params.seasonNumber || null,
    p_episode_number: params.episodeNumber || null
  });
  
  if (error) {
    console.error('[useContinueWatching] Erro upsert RPC:', error);
    throw error;
  }
  
  return data;
};

export const useContinueWatching = () => {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  // Obter usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Buscar dados completos de filmes/séries
  const fetchContentDetails = useCallback(async (progressData: any[]) => {
    if (!progressData.length) return [];
    
    const movieIds = progressData
      .filter(p => p.content_type === 'movie')
      .map(p => p.content_id);
    
    const seriesIds = progressData
      .filter(p => p.content_type === 'series')
      .map(p => p.content_id);

    // Buscar dados dos filmes
    const { data: moviesData } = await supabase
      .from('cinema')
      .select('id, titulo, poster')
      .in('id', movieIds);
    
    const moviesMap = new Map(moviesData?.map(m => [m.id, m]) || []);

    // Buscar dados das séries
    const seriesData: any[] = [];
    for (const id of seriesIds) {
      const { data: serie } = await supabase
        .from('series')
        .select('id_n, titulo, capa, banner, tmdb_id')
        .eq('id_n', id)
        .maybeSingle();
      
      if (serie) {
        seriesData.push(serie);
      } else {
        // Tentar por tmdb_id
        const { data: serieByTmdb } = await supabase
          .from('series')
          .select('id_n, titulo, capa, banner, tmdb_id')
          .eq('tmdb_id', id.toString())
          .maybeSingle();
        if (serieByTmdb) seriesData.push(serieByTmdb);
      }
    }
    
    const seriesMap = new Map<string, any>();
    seriesData.forEach(s => {
      seriesMap.set(String(s.id_n), s);
      if (s.tmdb_id) seriesMap.set(String(s.tmdb_id), s);
    });

    // Mapear para o formato ContinueWatchingItem
    return progressData.map((progress: any) => {
      const isMovie = progress.content_type === 'movie';
      const contentData = isMovie 
        ? moviesMap.get(progress.content_id)
        : seriesMap.get(String(progress.content_id));

      return {
        id: progress.id,
        contentId: progress.content_id.toString(),
        contentType: progress.content_type,
        title: contentData?.titulo || (isMovie ? 'Filme' : 'Série'),
        poster: isMovie ? (contentData?.poster || '') : (contentData?.capa || ''),
        banner: isMovie ? (contentData?.poster || '') : (contentData?.banner || contentData?.capa || ''),
        episodeId: progress.episode_id?.toString(),
        seasonNumber: progress.season_number,
        episodeNumber: progress.episode_number,
        progress: Math.min(100, Math.max(0, progress.progress || 0)),
        currentTime: progress.current_time || 0,
        duration: progress.duration || 0,
        updatedAt: progress.updated_at || progress.last_watched,
      };
    }).filter(item => item.title !== 'Filme' && item.title !== 'Série');
  }, []);

  // Buscar progresso usando RPC
  const fetchProgress = useCallback(async () => {
    if (!userId) {
      setItems([]);
      return;
    }

    // Carregar em background sem mostrar loading
    
    try {
      console.log('[useContinueWatching] Buscando via RPC...');
      
      const progressData = await fetchContinueWatchingRpc(userId, 10);
      const formattedItems = await fetchContentDetails(progressData);
      
      console.log('[useContinueWatching] Itens carregados:', formattedItems.length);
      setItems(formattedItems);
    } catch (err) {
      console.error('[useContinueWatching] Erro:', err);
      setItems([]);
    }
  }, [userId, fetchContentDetails]);

  // Realtime - atualizar quando houver mudanças
  const onRealtimeChange = useCallback(() => {
    console.log('[useContinueWatching] Realtime update, recarregando...');
    fetchProgress();
  }, [fetchProgress]);

  useRealtimeProgress(userId, onRealtimeChange);

  // Carregar na montagem
  useEffect(() => {
    if (userId && !isInitialized.current) {
      isInitialized.current = true;
      fetchProgress();
    }
  }, [fetchProgress, userId]);

  // Reset quando userId muda
  useEffect(() => {
    if (!userId) {
      isInitialized.current = false;
      setItems([]);
    }
  }, [userId]);

  // Salvar progresso com debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const updateProgress = useCallback(async (
    contentId: string,
    title: string,
    poster: string,
    type: 'movie' | 'series',
    currentTime: number,
    totalDuration: number,
    episodeId?: string,
    seasonNumber?: number,
    episodeNumber?: number
  ) => {
    if (!userId) return;

    const progress = Math.min(100, Math.round((currentTime / (totalDuration || 1)) * 100));

    // Não salvar se concluído (>= 95%)
    if (progress >= 95) {
      await removeItem(contentId, type, episodeId);
      return;
    }

    // Debounce de 500ms
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await upsertProgressRpc({
          userId,
          contentId: parseInt(contentId),
          contentType: type,
          currentTime: Math.floor(currentTime),
          duration: Math.floor(totalDuration),
          progress,
          episodeId: episodeId ? parseInt(episodeId) : undefined,
          seasonNumber,
          episodeNumber
        });

        // Atualizar estado local otimista
        const newItem: ContinueWatchingItem = {
          id: `${userId}-${contentId}${episodeId ? '-' + episodeId : ''}`,
          contentId,
          contentType: type,
          title,
          poster,
          episodeId,
          seasonNumber,
          episodeNumber,
          progress,
          currentTime,
          duration: totalDuration,
          updatedAt: new Date().toISOString(),
        };

        setItems(prev => {
          const filtered = prev.filter(item => 
            !(item.contentId === contentId && item.contentType === type && 
              (type === 'movie' || item.episodeId === episodeId))
          );
          return [newItem, ...filtered].slice(0, 10);
        });
      } catch (error) {
        console.error('[useContinueWatching] Erro ao salvar:', error);
      }
    }, 500);
  }, [userId]);

  // Remover item
  const removeItem = useCallback(async (contentId: string, type: 'movie' | 'series', episodeId?: string) => {
    if (!userId) return;

    try {
      await supabase.rpc('remove_user_progress', {
        p_user_id: userId,
        p_content_id: parseInt(contentId),
        p_content_type: type,
        p_episode_id: episodeId ? parseInt(episodeId) : null
      });

      setItems(prev => prev.filter(item => 
        !(item.contentId === contentId && item.contentType === type &&
          (type === 'movie' || item.episodeId === episodeId))
      ));
    } catch (error) {
      console.error('[useContinueWatching] Erro ao remover:', error);
    }
  }, [userId]);

  // Limpar todos
  const clearAll = useCallback(async () => {
    if (!userId) return;

    try {
      await supabase.rpc('clear_user_progress', { p_user_id: userId });
      setItems([]);
    } catch (error) {
      console.error('[useContinueWatching] Erro ao limpar:', error);
    }
  }, [userId]);

  // Buscar próximo episódio
  const getNextEpisode = useCallback(async (seriesId: string, currentEpisodeId: string) => {
    try {
      const { data: currentEpisode } = await (supabase
        .from('episodios') as any)
        .select('*, temporada:temporada_id (*)')
        .eq('id_n', currentEpisodeId)
        .single();

      if (!currentEpisode) return null;

      const currentSeason = currentEpisode.temporada?.numero_temporada || currentEpisode.numero_temporada || 1;
      const currentNumber = currentEpisode.numero_episodio || currentEpisode.numero;

      const { data: nextEpisode } = await (supabase
        .from('episodios') as any)
        .select('*, temporada:temporada_id (*)')
        .eq('temporada_id', currentEpisode.temporada_id)
        .eq('numero_episodio', currentNumber + 1)
        .or(`numero.eq.${currentNumber + 1}`)
        .single();

      if (nextEpisode) {
        return {
          id: nextEpisode.id_n,
          title: nextEpisode.titulo,
          number: nextEpisode.numero_episodio || nextEpisode.numero,
          season: nextEpisode.temporada?.numero_temporada || 1,
          thumbnail: nextEpisode.imagem_342 || nextEpisode.imagem_185 || nextEpisode.banner,
          duration: nextEpisode.duracao,
          videoUrl: nextEpisode.arquivo,
        };
      }

      const { data: nextSeason } = await (supabase
        .from('temporadas') as any)
        .select('*')
        .eq('serie_id', parseInt(seriesId))
        .eq('numero_temporada', currentSeason + 1)
        .single();

      if (nextSeason) {
        const { data: firstEpisode } = await (supabase
          .from('episodios') as any)
          .select('*')
          .eq('temporada_id', nextSeason.id_n)
          .eq('numero_episodio', 1)
          .or('numero.eq.1')
          .single();

        if (firstEpisode) {
          return {
            id: firstEpisode.id_n,
            title: firstEpisode.titulo,
            number: firstEpisode.numero_episodio || firstEpisode.numero,
            season: nextSeason.numero_temporada,
            thumbnail: firstEpisode.imagem_342 || firstEpisode.imagem_185 || firstEpisode.banner,
            duration: firstEpisode.duracao,
            videoUrl: firstEpisode.arquivo,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar próximo episódio:', error);
      return null;
    }
  }, []);

  // Converter para formato do ContentCarousel
  const carouselItems = items.map(item => ({
    id: item.contentId,
    title: item.contentType === 'series' && item.episodeNumber 
      ? `${item.title} - T${item.seasonNumber}E${item.episodeNumber}` 
      : item.title,
    poster: item.poster,
    banner: item.banner,
    type: item.contentType,
    progress: item.progress,
    year: new Date(item.updatedAt).getFullYear().toString(),
    rating: `${item.progress}%`,
    episodeId: item.episodeId,
    seasonNumber: item.seasonNumber,
    episodeNumber: item.episodeNumber,
  }));

  return {
    items: carouselItems,
    rawItems: items,
    updateProgress,
    removeItem,
    clearAll,
    getNextEpisode,
    isLoading,
    refresh: fetchProgress,
    userId
  };
};
