import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/hooks/useNotifications';

// Hook para verificar novos episódios
export function useNewEpisodeDetector() {
  const { notifyNewEpisode, isSubscribed } = useNotifications();

  // Verificar novos episódios periodicamente
  const checkNewEpisodes = useCallback(async () => {
    if (!isSubscribed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar séries que o usuário acompanha
      const { data: watchHistory } = await supabase
        .from('user_progress')
        .select('content_id, content_type')
        .eq('user_id', user.id)
        .eq('content_type', 'series')
        .gt('progress', 0); // Já assistiu algo

      if (!watchHistory || watchHistory.length === 0) return;

      const seriesIds = watchHistory.map(h => h.content_id);

      // Buscar últimos episódios adicionados nas últimas 24 horas
      const lastCheck = localStorage.getItem('last_episode_check');
      const checkTime = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: newEpisodes } = await supabase
        .from('episodios')
        .select(`
          id,
          titulo,
          numero,
          temporada_id,
          temporadas:temporada_id (
            id,
            numero,
            serie:serie_id (
              id,
              titulo,
              banner
            )
          )
        `)
        .gt('created_at', checkTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (newEpisodes && newEpisodes.length > 0) {
        for (const episode of newEpisodes) {
          const series = episode.temporadas?.serie;
          if (!series) continue;

          // Verificar se o usuário acompanha esta série
          if (seriesIds.includes(series.id.toString())) {
            await notifyNewEpisode(
              series.titulo,
              `T${episode.temporadas?.numero}E${episode.numero}: ${episode.titulo}`,
              series.id.toString(),
              episode.id.toString(),
              series.banner
            );

            // Salvar notificação no banco
            await supabase.from('notifications').insert({
              user_id: user.id,
              type: 'new_episode',
              title: `Novo episódio de ${series.titulo}`,
              body: `Temporada ${episode.temporadas?.numero} - Episódio ${episode.numero}: ${episode.titulo}`,
              image: series.banner,
              data: {
                seriesId: series.id,
                episodeId: episode.id,
                seasonNumber: episode.temporadas?.numero,
                episodeNumber: episode.numero,
              },
              read: false,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      // Atualizar timestamp da última verificação
      localStorage.setItem('last_episode_check', new Date().toISOString());
    } catch (error) {
      console.error('[NewEpisodeDetector] Erro ao verificar novos episódios:', error);
    }
  }, [isSubscribed, notifyNewEpisode]);

  // Verificar a cada 30 minutos
  useEffect(() => {
    if (!isSubscribed) return;

    // Verificar imediatamente
    checkNewEpisodes();

    // Configurar intervalo
    const interval = setInterval(checkNewEpisodes, 30 * 60 * 1000);

    // Verificar quando a aba ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNewEpisodes();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSubscribed, checkNewEpisodes]);

  return { checkNewEpisodes };
}

// Hook para gerar recomendações
export function useRecommendationEngine() {
  const { notifyRecommendation, isSubscribed } = useNotifications();

  // Gerar recomendações baseadas no histórico
  const generateRecommendations = useCallback(async () => {
    if (!isSubscribed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar última recomendação enviada
      const lastRec = localStorage.getItem('last_recommendation_date');
      const lastDate = lastRec ? new Date(lastRec) : new Date(0);
      const now = new Date();

      // Enviar no máximo 1 recomendação por dia
      if (now.getTime() - lastDate.getTime() < 24 * 60 * 60 * 1000) return;

      // Buscar histórico de visualização
      const { data: watchHistory } = await supabase
        .from('user_progress')
        .select('content_id, content_type')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (!watchHistory || watchHistory.length === 0) return;

      // Buscar conteúdos similares baseados em gêneros
      const watchedIds = watchHistory.map(h => h.content_id);

      // Buscar filmes/séries não assistidos
      const { data: recommendations } = await supabase
        .from('cinema')
        .select('id, titulo, poster, genero, rating, descricao')
        .not('id', 'in', `(${watchedIds.join(',')})`)
        .order('rating', { ascending: false })
        .limit(5);

      if (recommendations && recommendations.length > 0) {
        // Escolher aleatoriamente um para recomendar
        const randomIndex = Math.floor(Math.random() * recommendations.length);
        const content = recommendations[randomIndex];

        // Criar razão personalizada
        const reasons = [
          'Baseado no que você assistiu',
          'Popular entre espectadores similares',
          'Alta avaliação do público',
          'Novo na plataforma',
          'Recomendado para você'
        ];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];

        await notifyRecommendation(
          content.titulo,
          reason,
          content.id.toString(),
          content.poster
        );

        // Salvar notificação no banco
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'recommendation',
          title: 'Recomendamos para você',
          body: `${content.titulo} - ${reason}`,
          image: content.poster,
          data: {
            contentId: content.id,
            reason,
          },
          read: false,
          created_at: new Date().toISOString(),
        });

        // Atualizar timestamp
        localStorage.setItem('last_recommendation_date', now.toISOString());
      }
    } catch (error) {
      console.error('[RecommendationEngine] Erro ao gerar recomendações:', error);
    }
  }, [isSubscribed, notifyRecommendation]);

  // Gerar recomendações diariamente
  useEffect(() => {
    if (!isSubscribed) return;

    generateRecommendations();

    // Verificar a cada 6 horas se já passou 24h desde última recomendação
    const interval = setInterval(generateRecommendations, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isSubscribed, generateRecommendations]);

  return { generateRecommendations };
}

// Hook para lembrete de continuar assistindo
export function useContinueWatchingReminder() {
  const { notifyContinueWatching, isSubscribed } = useNotifications();

  const checkContinueWatching = useCallback(async () => {
    if (!isSubscribed) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar último lembrete enviado
      const lastReminder = localStorage.getItem('last_continue_watching_reminder');
      const lastDate = lastReminder ? new Date(lastReminder) : new Date(0);
      const now = new Date();

      // Enviar no máximo 1 lembrete a cada 3 dias
      if (now.getTime() - lastDate.getTime() < 3 * 24 * 60 * 60 * 1000) return;

      // Buscar conteúdo parado (progresso entre 10% e 90%)
      const { data: pausedContent } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .gt('progress', 10)
        .lt('progress', 90)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (pausedContent) {
        // Buscar dados do conteúdo em tabela separada
        const table = pausedContent.content_type === 'movie' ? 'cinema' : 'series';
        const idColumn = pausedContent.content_type === 'movie' ? 'id' : 'id_n';
        const contentId = pausedContent.cinema_id || pausedContent.serie_id;

        let title = '';
        let poster = '';

        if (contentId) {
          const { data: contentData } = await supabase
            .from(table)
            .select('titulo, poster')
            .eq(idColumn, contentId)
            .single();

          title = contentData?.titulo || '';
          poster = contentData?.poster || '';
        }

        if (title) {
          await notifyContinueWatching(
            title,
            pausedContent.progress,
            pausedContent.content_id,
            poster
          );

          // Salvar no banco
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'continue_watching',
            title: 'Continue assistindo',
            body: `Você parou em ${title} (${Math.round(pausedContent.progress)}% assistido)`,
            image: poster,
            data: {
              contentId: pausedContent.content_id,
              progress: pausedContent.progress,
            },
            read: false,
            created_at: new Date().toISOString(),
          });

          localStorage.setItem('last_continue_watching_reminder', now.toISOString());
        }
      }
    } catch (error) {
      console.error('[ContinueWatchingReminder] Erro:', error);
    }
  }, [isSubscribed, notifyContinueWatching]);

  useEffect(() => {
    if (!isSubscribed) return;

    // Verificar após 5 minutos do login
    const timeout = setTimeout(checkContinueWatching, 5 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [isSubscribed, checkContinueWatching]);

  return { checkContinueWatching };
}
