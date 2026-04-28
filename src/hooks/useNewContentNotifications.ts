import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from './useNotifications';

interface NewContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster?: string;
  year?: string;
  created_at: string;
  tmdb_id?: number;
}

interface NewContentNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  data: {
    type: 'new_movie' | 'new_series';
    contentId: string;
    tmdbId?: number;
    contentType: 'movie' | 'series';
  };
  created_at: string;
  read: boolean;
}

export function useNewContentNotifications() {
  const [newContent, setNewContent] = useState<NewContentItem[]>([]);
  const [notifications, setNotifications] = useState<NewContentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { sendLocalNotification, permission } = useNotifications();

  // Buscar novos conteúdos das últimas 24 horas APENAS
  const fetchNewContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Buscar novos filmes das últimas 24h APENAS
      const { data: newMovies, error: moviesError } = await supabase
        .from('cinema')
        .select('id, titulo, poster, year, created_at, tmdb_id')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      // NÃO buscar séries - a tabela não tem created_at para filtrar corretamente
      // Séries só aparecerão quando a tabela tiver created_at
      const newSeries: any[] = [];

      if (moviesError) console.error('[NewContent] Erro ao buscar filmes:', moviesError);

      // Combinar e formatar resultados
      const combinedContent: NewContentItem[] = [
        ...(newMovies || []).map((movie: any) => ({
          id: movie.id.toString(),
          title: movie.titulo,
          type: 'movie' as const,
          poster: movie.poster,
          year: movie.year,
          created_at: movie.created_at,
          tmdb_id: movie.tmdb_id,
        })),
        ...(newSeries || []).map((series: any) => ({
          id: series.id_n?.toString(),
          title: series.titulo,
          type: 'series' as const,
          poster: '/api/placeholder/300/450', // Fallback para poster (séries não têm poster)
          year: series.ano,
          created_at: new Date().toISOString(), // Data atual como fallback
          tmdb_id: series.tmdb_id,
        })),
      ];

      setNewContent(combinedContent);

      // Gerar notificações para novos conteúdos
      await generateNotifications(combinedContent);

    } catch (error) {
      console.error('[NewContent] Erro ao buscar novos conteúdos:', error);
    }
  }, []);

  // Gerar notificações para novos conteúdos
  const generateNotifications = useCallback(async (content: NewContentItem[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar notificações existentes para evitar duplicatas
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('data->>contentId')
        .eq('user_id', user.id)
        .eq('type', 'new_content');

      const existingContentIds = new Set(
        (existingNotifications || []).map(n => n.data?.contentId).filter(Boolean)
      );

      const newNotifications = content
        .filter(item => !existingContentIds.has(item.id))
        .map(item => ({
          user_id: user.id,
          title: item.type === 'movie' ? 'Novo Filme Disponível' : 'Nova Série Disponível',
          body: `${item.title} ${item.year ? `(${item.year})` : ''} acabou de ser adicionado!`,
          icon: item.poster,
          type: 'new_content',
          data: {
            type: item.type === 'movie' ? 'new_movie' : 'new_series',
            contentId: item.id,
            tmdbId: item.tmdb_id,
            contentType: item.type,
          },
          read: false,
          created_at: new Date().toISOString(),
        }));

      if (newNotifications.length > 0) {
        // Salvar notificações no banco APENAS (não enviar push)
        await supabase
          .from('notifications')
          .insert(newNotifications);

        // REMOVIDO: Notificações push locais - agora só aparecem na página de notificações
        // for (const notification of newNotifications) {
        //   if (permission === 'granted') {
        //     await sendLocalNotification({...});
        //   }
        // }

        console.log(`[NewContent] ${newNotifications.length} novas notificações salvas (apenas página)`);
      }

    } catch (error) {
      console.error('[NewContent] Erro ao gerar notificações:', error);
    }
  }, [permission, sendLocalNotification]);

  // Buscar notificações do usuário das últimas 24h APENAS
  const fetchNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'new_content')
        .gte('created_at', twentyFourHoursAgo) // APENAS últimas 24h
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('[NewContent] Erro ao buscar notificações:', error);
    }
  }, []);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('[NewContent] Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Limpar todas as notificações
  const clearAllNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('type', 'new_content');

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('[NewContent] Erro ao limpar notificações:', error);
    }
  }, []);

  // Verificar novos conteúdos periodicamente
  useEffect(() => {
    fetchNewContent();
    fetchNotifications();

    // Verificar a cada 5 minutos
    const interval = setInterval(() => {
      fetchNewContent();
      fetchNotifications();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchNewContent, fetchNotifications]);

  // Supabase Realtime - detectar novos conteúdos em tempo real
  useEffect(() => {
    // Canal para novos filmes (cinema) - verificar se é dentro das últimas 24h
    const cinemaChannel = supabase
      .channel('new-movies-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cinema',
        },
        async (payload) => {
          console.log('[Realtime] Novo filme detectado:', payload.new);
          const movie = payload.new as any;
          
          // Verificar se o filme foi criado nas últimas 24h
          const movieCreatedAt = new Date(movie.created_at);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          if (movieCreatedAt >= twentyFourHoursAgo) {
            const newItem: NewContentItem = {
              id: movie.id.toString(),
              title: movie.titulo,
              type: 'movie',
              poster: movie.poster,
              year: movie.year,
              created_at: movie.created_at || new Date().toISOString(),
              tmdb_id: movie.tmdb_id,
            };

            // Gerar notificação APENAS se for das últimas 24h
            await generateNotifications([newItem]);
            await fetchNotifications();
          } else {
            console.log('[Realtime] Filme ignorado - mais antigo que 24h');
          }
        }
      )
      .subscribe();

    // REMOVIDO: Canal para novas séries - não tem created_at para filtrar
    // const seriesChannel = supabase...;

    return () => {
      supabase.removeChannel(cinemaChannel);
    };
  }, [fetchNewContent, fetchNotifications, generateNotifications]);

  // Contador de notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    newContent,
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    clearAllNotifications,
    refetch: () => {
      fetchNewContent();
      fetchNotifications();
    },
  };
}

export default useNewContentNotifications;
