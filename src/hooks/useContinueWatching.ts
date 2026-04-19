import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

const MAX_ITEMS = 12;

export const useContinueWatching = () => {
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  // Obter usuário atual
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setIsLoading(false);
    };
    getUser();

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Buscar progresso do usuário do Supabase
  const fetchProgress = useCallback(async () => {
    console.log('🔍 [useContinueWatching] fetchProgress chamado, userId:', userId);
    
    if (!userId) {
      console.log('⚠️ [useContinueWatching] Sem userId, retornando array vazio');
      setItems([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 [useContinueWatching] Iniciando busca no Supabase...');
      
      // Buscar progresso dos filmes (usando user_progress - mesma tabela do player)
      console.log('🎬 [useContinueWatching] Buscando filmes para user:', userId);
      const { data: movieProgress, error: movieError } = await (supabase
        .from('user_progress') as any)
        .select(`
          *,
          cinema:content_id (*)
        `)
        .eq('user_id', userId)
        .eq('content_type', 'movie')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (movieError) {
        console.error('❌ [useContinueWatching] Erro ao buscar filmes:', movieError);
      } else {
        console.log('✅ [useContinueWatching] Filmes encontrados:', movieProgress?.length || 0);
        console.log('📊 [useContinueWatching] Dados dos filmes:', movieProgress);
      }

      // Buscar progresso das séries (usando user_progress - mesma tabela do player)
      console.log('📺 [useContinueWatching] Buscando séries para user:', userId);
      const { data: seriesProgress, error: seriesError } = await (supabase
        .from('user_progress') as any)
        .select(`
          *,
          series:content_id (*)
        `)
        .eq('user_id', userId)
        .eq('content_type', 'series')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (seriesError) {
        console.error('❌ [useContinueWatching] Erro ao buscar séries:', seriesError);
      } else {
        console.log('✅ [useContinueWatching] Séries encontradas:', seriesProgress?.length || 0);
        console.log('📊 [useContinueWatching] Dados das séries:', seriesProgress);
      }

      const formattedItems: ContinueWatchingItem[] = [];

      // Formatar filmes (estrutura user_progress)
      if (movieProgress && movieProgress.length > 0) {
        console.log('🎬 [useContinueWatching] Formatando', movieProgress.length, 'filmes');
        movieProgress.forEach((progress: any, index: number) => {
          console.log(`🎬 [useContinueWatching] Filme ${index}:`, progress);
          // Usar dados da tabela user_progress diretamente
          if (progress.content_id) {
            formattedItems.push({
              id: progress.id,
              contentId: progress.content_id,
              contentType: 'movie',
              title: progress.title || progress.content_id,
              poster: progress.poster || '',
              banner: progress.banner || progress.poster || '',
              progress: Math.min(100, Math.round(((progress.progress || 0) / 100) * 100)),
              currentTime: progress.current_time || 0,
              duration: progress.duration || 0,
              updatedAt: progress.updated_at,
            });
          } else {
            console.log(`⚠️ [useContinueWatching] Filme ${index} não tem content_id`);
          }
        });
      } else {
        console.log('⚠️ [useContinueWatching] Nenhum filme encontrado');
      }

      // Formatar séries (estrutura user_progress)
      if (seriesProgress && seriesProgress.length > 0) {
        console.log('📺 [useContinueWatching] Formatando', seriesProgress.length, 'séries');
        seriesProgress.forEach((progress: any, index: number) => {
          console.log(`📺 [useContinueWatching] Série ${index}:`, progress);
          // Usar dados da tabela user_progress diretamente
          if (progress.content_id) {
            formattedItems.push({
              id: progress.id,
              contentId: progress.content_id,
              contentType: 'series',
              title: progress.title || progress.content_id,
              poster: progress.poster || progress.banner || '',
              banner: progress.banner || progress.poster || '',
              episodeId: progress.episode_id,
              episodeTitle: progress.episode_title,
              seasonNumber: progress.season_number,
              episodeNumber: progress.episode_number,
              progress: Math.min(100, Math.round(((progress.progress || 0) / 100) * 100)),
              currentTime: progress.current_time || 0,
              duration: progress.duration || 0,
              updatedAt: progress.updated_at,
            });
          } else {
            console.log(`⚠️ [useContinueWatching] Série ${index} não tem content_id`);
          }
        });
      } else {
        console.log('⚠️ [useContinueWatching] Nenhuma série encontrada');
      }

      console.log('📊 [useContinueWatching] Total de itens formatados:', formattedItems.length);

      // Ordenar por data de atualização e limitar
      formattedItems.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const finalItems = formattedItems.slice(0, MAX_ITEMS);
      console.log('✅ [useContinueWatching] Definindo', finalItems.length, 'itens finais');
      setItems(finalItems);
    } catch (error) {
      console.error('❌ [useContinueWatching] Erro ao buscar progresso:', error);
    } finally {
      setIsLoading(false);
      console.log('🏁 [useContinueWatching] Busca finalizada');
    }
  }, [userId]);

  // Carregar progresso quando userId mudar ou componente montar
  useEffect(() => {
    if (!isInitialized.current && userId) {
      isInitialized.current = true;
      console.log('[useContinueWatching] Inicializando carregamento...');
      fetchProgress();
    }
  }, [fetchProgress, userId]);

  // Salvar progresso em tempo real no Supabase
  const updateProgress = useCallback(async (
    contentId: string,
    title: string,
    poster: string,
    type: 'movie' | 'series',
    currentTime: number,
    totalDuration: number,
    episodeId?: string,
    seasonNumber?: number
  ) => {
    if (!userId) return;

    const progress = Math.min(100, Math.round((currentTime / (totalDuration || 1)) * 100));

    // Se progresso >= 95%, marcar como concluído e remover
    if (progress >= 95) {
      await removeItem(contentId, type, episodeId);
      return;
    }

    try {
      const data: any = {
        user_id: userId,
        current_time: Math.floor(currentTime),
        duration: Math.floor(totalDuration),
        progress: progress,
        updated_at: new Date().toISOString(),
        content_type: type,
      };

      if (type === 'movie') {
        data.cinema_id = contentId;
      } else {
        data.serie_id = contentId;
        data.episodio_id = episodeId;
        data.season_number = seasonNumber;
      }

      // Upsert - atualizar ou inserir
      await (supabase
        .from('watch_progress') as any)
        .upsert(data, {
          onConflict: type === 'movie' 
            ? 'user_id,cinema_id' 
            : 'user_id,serie_id,episodio_id',
        });

      // Atualizar estado local
      const newItem: ContinueWatchingItem = {
        id: `${userId}-${contentId}${episodeId ? '-' + episodeId : ''}`,
        contentId,
        contentType: type,
        title,
        poster,
        episodeId,
        seasonNumber,
        episodeNumber: undefined,
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
        const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
        return updated;
      });
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }, [userId]);

  // Remover item específico
  const removeItem = useCallback(async (contentId: string, type: 'movie' | 'series', episodeId?: string) => {
    if (!userId) return;

    try {
      let query = (supabase
        .from('watch_progress') as any)
        .delete()
        .eq('user_id', userId);

      if (type === 'movie') {
        query = query.eq('cinema_id', contentId);
      } else {
        query = query.eq('serie_id', contentId);
        if (episodeId) {
          query = query.eq('episodio_id', episodeId);
        }
      }

      await query;

      setItems(prev => prev.filter(item => 
        !(item.contentId === contentId && item.contentType === type &&
          (type === 'movie' || item.episodeId === episodeId))
      ));
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  }, [userId]);

  // Limpar todos os itens
  const clearAll = useCallback(async () => {
    if (!userId) return;

    try {
      await (supabase
        .from('watch_progress') as any)
        .delete()
        .eq('user_id', userId);

      setItems([]);
    } catch (error) {
      console.error('Erro ao limpar progresso:', error);
    }
  }, [userId]);

  // Buscar próximo episódio
  const getNextEpisode = useCallback(async (seriesId: string, currentEpisodeId: string) => {
    try {
      // Buscar episódio atual
      const { data: currentEpisode } = await (supabase
        .from('episodios') as any)
        .select('*, temporada:temporada_id (*)')
        .eq('id_n', currentEpisodeId)
        .single();

      if (!currentEpisode) return null;

      const currentSeason = currentEpisode.temporada?.numero_temporada || currentEpisode.numero_temporada || 1;
      const currentNumber = currentEpisode.numero_episodio || currentEpisode.numero;

      // Buscar próximo episódio na mesma temporada
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

      // Se não há próximo, buscar primeira temporada seguinte
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
    title: item.contentType === 'series' && item.episodeTitle 
      ? `${item.title} - E${item.episodeNumber}` 
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
