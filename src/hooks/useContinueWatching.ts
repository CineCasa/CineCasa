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
        .select('*')
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
        .select('*')
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

      // Buscar dados completos dos filmes (incluindo poster)
      if (movieProgress && movieProgress.length > 0) {
        console.log('🎬 [useContinueWatching] Formatando', movieProgress.length, 'filmes');
        
        // Buscar dados de posters e títulos da tabela cinema
        const movieIds = movieProgress.map((p: any) => p.content_id).filter(Boolean);
        console.log('🎬 [useContinueWatching] Buscando dados dos filmes IDs:', movieIds);
        
        const { data: moviesData } = await supabase
          .from('cinema')
          .select('id, titulo, poster')
          .in('id', movieIds);
        
        const moviesMap = new Map(moviesData?.map(m => [m.id, m]) || []);
        
        movieProgress.forEach((progress: any, index: number) => {
          console.log(`🎬 [useContinueWatching] Filme ${index}:`, progress);
          if (progress.content_id) {
            const movieData = moviesMap.get(progress.content_id);
            const title = movieData?.titulo || progress.title || `Filme ${progress.content_id}`;
            const poster = movieData?.poster || '';
            const banner = movieData?.poster || '';
            
            console.log(`🎬 [useContinueWatching] Filme ${index} - Título: ${title}, Poster: ${poster ? 'OK' : 'MISSING'}`);
            
            formattedItems.push({
              id: progress.id,
              contentId: progress.content_id.toString(),
              contentType: 'movie',
              title: title,
              poster: poster,
              banner: banner,
              progress: Math.min(100, Math.round(((progress.progress || 0) / 100) * 100)),
              currentTime: progress.current_time || 0,
              duration: progress.duration || 0,
              updatedAt: progress.updated_at,
            });
          }
        });
      }

      // Buscar dados completos das séries (incluindo poster)
      if (seriesProgress && seriesProgress.length > 0) {
        console.log('📺 [useContinueWatching] Formatando', seriesProgress.length, 'séries');
        
        // Buscar dados de posters e títulos da tabela series
        const seriesIds = seriesProgress.map((p: any) => p.content_id).filter(Boolean);
        console.log('📺 [useContinueWatching] Buscando dados das séries IDs:', seriesIds);
        console.log('📺 [useContinueWatching] Tipos dos IDs:', seriesIds.map((id: any) => typeof id));
        
        // Converter IDs para string para compatibilidade com bigint do PostgreSQL
        const seriesIdsString = seriesIds.map((id: any) => String(id));
        console.log('📺 [useContinueWatching] IDs como string:', seriesIdsString);
        
        const { data: seriesData, error: seriesDataError } = await supabase
          .from('series')
          .select('id_n, titulo, capa, banner')
          .in('id_n', seriesIdsString);
        
        console.log('📺 [useContinueWatching] Dados retornados da tabela series:', seriesData);
        console.log('📺 [useContinueWatching] Quantidade retornada:', seriesData?.length || 0);
        console.log('📺 [useContinueWatching] Erro na query series:', seriesDataError);
        
        // Criar map com IDs como string para compatibilidade
        const seriesMap = new Map(seriesData?.map(s => [String(s.id_n), s]) || []);
        console.log('📺 [useContinueWatching] Map de séries criado:', Array.from(seriesMap.entries()));
        console.log('📺 [useContinueWatching] IDs buscados vs encontrados:', { 
          buscados: seriesIdsString, 
          encontrados: seriesData?.map(s => s.id_n) 
        });
        
        seriesProgress.forEach((progress: any, index: number) => {
          console.log(`📺 [useContinueWatching] Série ${index}:`, progress);
          if (progress.content_id) {
            // Buscar usando ID como string para compatibilidade com bigint
            const serieData = seriesMap.get(String(progress.content_id));
            const title = serieData?.titulo || progress.title || `Série ${progress.content_id}`;
            const poster = serieData?.capa || '';
            const banner = serieData?.banner || serieData?.capa || '';
            
            console.log(`📺 [useContinueWatching] Série ${index} - Título: ${title}, Poster: ${poster ? 'OK' : 'MISSING'}`);
            
            formattedItems.push({
              id: progress.id,
              contentId: progress.content_id.toString(),
              contentType: 'series',
              title: title,
              poster: poster,
              banner: banner,
              episodeId: progress.episode_id,
              episodeTitle: progress.episode_title,
              seasonNumber: progress.season_number,
              episodeNumber: progress.episode_number,
              progress: Math.min(100, Math.round(((progress.progress || 0) / 100) * 100)),
              currentTime: progress.current_time || 0,
              duration: progress.duration || 0,
              updatedAt: progress.updated_at,
            });
          }
        });
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
        content_id: parseInt(contentId),
        content_type: type === 'movie' ? 'movie' : 'series',
        current_time: Math.floor(currentTime),
        duration: Math.floor(totalDuration),
        progress: progress,
        updated_at: new Date().toISOString(),
      };

      if (type === 'series') {
        data.episode_id = episodeId ? parseInt(episodeId) : null;
        data.season_number = seasonNumber;
      }

      // Upsert - atualizar ou inserir na tabela user_progress
      await (supabase
        .from('user_progress') as any)
        .upsert(data, {
          onConflict: 'user_id,content_id,content_type,episode_id',
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
        .from('user_progress') as any)
        .delete()
        .eq('user_id', userId)
        .eq('content_id', parseInt(contentId))
        .eq('content_type', type);

      if (type === 'series' && episodeId) {
        query = query.eq('episode_id', parseInt(episodeId));
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
        .from('user_progress') as any)
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
