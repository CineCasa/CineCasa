import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'content' | 'social' | 'achievement';
  category: 'content' | 'social' | 'system' | 'achievement' | 'reminder';
  priority: 'low' | 'normal' | 'high' | 'critical';
  icon?: string;
  image?: string;
  actions?: Array<{
    id: string;
    label: string;
    style: 'primary' | 'secondary' | 'outline';
    action: () => void;
    url?: string;
  }>;
  data?: any;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at?: string;
  dismissed_at?: string;
  expires_at?: string;
  auto_dismiss?: boolean;
  duration?: number; // milliseconds
}

interface NotificationPreferences {
  in_app_enabled: boolean;
  show_content: boolean;
  show_social: boolean;
  show_system: boolean;
  show_achievements: boolean;
  show_reminders: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  desktop_notifications: boolean;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  max_visible: number;
  auto_dismiss_time: number;
  group_similar: boolean;
}

interface UseInAppNotificationsOptions {
  userId?: string;
  enableRealTime?: boolean;
  maxVisible?: number;
  autoDismiss?: number;
  enableSound?: boolean;
  enableVibration?: boolean;
}

export function useInAppNotifications({
  userId,
  enableRealTime = true,
  maxVisible = 5,
  autoDismiss = 5000,
  enableSound = true,
  enableVibration = true,
}: UseInAppNotificationsOptions = {}) {
  const [visibleNotifications, setVisibleNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();

  // Query para notificações
  const { data: notifications, isLoading, error, refetch } = useQuery({
    queryKey: ['in-app-notifications', userId],
    queryFn: async (): Promise<InAppNotification[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('in_app_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Erro ao buscar notificações:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
  });

  // Query para preferências
  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!userId) return getDefaultPreferences();

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar preferências:', error);
        return getDefaultPreferences();
      }

      return data || getDefaultPreferences();
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minuto
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para adicionar notificação
  const addNotification = useMutation({
    mutationFn: async (notification: Partial<InAppNotification>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const notificationData = {
        user_id: userId,
        title: notification.title,
        message: notification.message,
        type: notification.type || 'info',
        category: notification.category || 'system',
        priority: notification.priority || 'normal',
        icon: notification.icon,
        image: notification.image,
        actions: notification.actions,
        data: notification.data,
        is_read: false,
        is_dismissed: false,
        auto_dismiss: notification.auto_dismiss !== false,
        duration: notification.duration || autoDismiss,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('in_app_notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar notificação:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (newNotification) => {
      queryClient.setQueryData(['in-app-notifications', userId], (old: InAppNotification[] = []) => 
        [newNotification, ...old]
      );
      
      // Mostrar notificação imediatamente
      if (shouldShowNotification(newNotification, preferences)) {
        showNotification(newNotification);
      }
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de notificação:', error);
    },
  });

  // Mutation para marcar como lida
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('in_app_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao marcar como lida:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(['in-app-notifications', userId], (old: InAppNotification[] = []) =>
        old.map(notification => 
          notification.id === updatedNotification.id 
            ? { ...notification, ...updatedNotification }
            : notification
        )
      );
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de marcar como lida:', error);
    },
  });

  // Mutation para descartar notificação
  const dismissNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('in_app_notifications')
        .update({
          is_dismissed: true,
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao descartar notificação:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedNotification) => {
      queryClient.setQueryData(['in-app-notifications', userId], (old: InAppNotification[] = []) =>
        old.map(notification => 
          notification.id === updatedNotification.id 
            ? { ...notification, ...updatedNotification }
            : notification
        )
      );
      
      // Remover das notificações visíveis
      setVisibleNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de descartar notificação:', error);
    },
  });

  // Mutation para limpar todas as notificações
  const clearAllNotifications = useMutation({
    mutationFn: async (options?: { read?: boolean; dismissed?: boolean }) => {
      let query = supabase
        .from('in_app_notifications')
        .update({
          is_read: options?.read !== false ? true : false,
          is_dismissed: options?.dismissed !== false ? true : false,
          read_at: options?.read !== false ? new Date().toISOString() : undefined,
          dismissed_at: options?.dismissed !== false ? new Date().toISOString() : undefined,
        })
        .eq('user_id', userId);

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      const { error } = await query;

      if (error) {
        console.error('❌ Erro ao limpar notificações:', error);
        throw error;
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
      setVisibleNotifications([]);
      setUnreadCount(0);
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de limpar notificações:', error);
    },
  });

  // Verificar se deve mostrar notificação
  const shouldShowNotification = useCallback((
    notification: InAppNotification,
    prefs?: NotificationPreferences
  ): boolean => {
    const pref = prefs || getDefaultPreferences();
    
    // Verificar se notificações estão habilitadas
    if (!pref.in_app_enabled) return false;
    
    // Verificar categoria
    switch (notification.category) {
      case 'content':
        return pref.show_content;
      case 'social':
        return pref.show_social;
      case 'system':
        return pref.show_system;
      case 'achievement':
        return pref.show_achievements;
      case 'reminder':
        return pref.show_reminders;
      default:
        return true;
    }
  }, []);

  // Mostrar notificação
  const showNotification = useCallback((notification: InAppNotification) => {
    // Verificar limite de notificações visíveis
    if (visibleNotifications.length >= maxVisible) {
      // Remover notificação mais antiga
      setVisibleNotifications(prev => prev.slice(1));
    }

    // Adicionar nova notificação
    setVisibleNotifications(prev => [...prev, notification]);

    // Auto-dismiss se configurado
    if (notification.auto_dismiss && notification.duration) {
      setTimeout(() => {
        dismissNotification.mutate(notification.id);
      }, notification.duration);
    }

    // Tocar som se habilitado
    if (enableSound) {
      playNotificationSound(notification.type);
    }

    // Vibrar se habilitado
    if (enableVibration && 'vibrate' in navigator) {
      vibrateForNotification(notification.priority);
    }
  }, [visibleNotifications.length, maxVisible, enableSound, enableVibration, dismissNotification.mutate]);

  // Tocar som de notificação
  const playNotificationSound = useCallback((type: InAppNotification['type']) => {
    try {
      const audio = new Audio();
      
      switch (type) {
        case 'success':
          audio.src = '/sounds/success.mp3';
          break;
        case 'warning':
          audio.src = '/sounds/warning.mp3';
          break;
        case 'error':
          audio.src = '/sounds/error.mp3';
          break;
        case 'achievement':
          audio.src = '/sounds/achievement.mp3';
          break;
        default:
          audio.src = '/sounds/notification.mp3';
      }
      
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silenciar erro se não puder tocar som
      });
    } catch (error) {
      console.error('❌ Erro ao tocar som:', error);
    }
  }, []);

  // Vibrar para notificação
  const vibrateForNotification = useCallback((priority: InAppNotification['priority']) => {
    if (!('vibrate' in navigator)) return;

    switch (priority) {
      case 'critical':
        navigator.vibrate([200, 100, 200, 100, 200]);
        break;
      case 'high':
        navigator.vibrate([200, 100, 200]);
        break;
      case 'normal':
        navigator.vibrate([200]);
        break;
      case 'low':
        navigator.vibrate([100]);
        break;
    }
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime || !userId) return;

    const channel = supabase
      .channel('in-app-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as InAppNotification;
          
          if (shouldShowNotification(newNotification, preferences)) {
            showNotification(newNotification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enableRealTime, userId, preferences, shouldShowNotification, showNotification]);

  // Calcular contador de não lidas
  useEffect(() => {
    if (!notifications) return;
    
    const unread = notifications.filter(n => !n.is_read && !n.is_dismissed).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Funções de conveniência
  const showContentNotification = useCallback((
    title: string,
    message: string,
    contentId: string,
    contentType: 'movie' | 'series',
    priority: InAppNotification['priority'] = 'normal'
  ) => {
    addNotification.mutate({
      title,
      message,
      type: 'content',
      category: 'content',
      priority,
      data: {
        content_id: contentId,
        content_type: contentType,
      },
      actions: [
        {
          id: 'watch',
          label: 'Assistir',
          style: 'primary',
          action: () => {
            window.location.href = `/content/${contentId}`;
          },
        },
        {
          id: 'details',
          label: 'Detalhes',
          style: 'outline',
          action: () => {
            window.location.href = `/content/${contentId}`;
          },
        },
      ],
    });
  }, [addNotification.mutate]);

  const showSocialNotification = useCallback((
    title: string,
    message: string,
    userId: string,
    type: 'friend_request' | 'new_follower' | 'friend_activity'
  ) => {
    addNotification.mutate({
      title,
      message,
      type: 'info',
      category: 'social',
      priority: 'normal',
      data: {
        user_id: userId,
        type,
      },
      actions: [
        {
          id: 'view-profile',
          label: 'Ver Perfil',
          style: 'primary',
          action: () => {
            window.location.href = `/profile/${userId}`;
          },
        },
      ],
    });
  }, [addNotification.mutate]);

  const showAchievementNotification = useCallback((
    title: string,
    message: string,
    achievementId: string,
    badge?: string
  ) => {
    addNotification.mutate({
      title,
      message,
      type: 'success',
      category: 'achievement',
      priority: 'high',
      auto_dismiss: false, // Não descartar automaticamente conquistas
      data: {
        achievement_id: achievementId,
        badge,
      },
      actions: [
        {
          id: 'view-achievements',
          label: 'Ver Conquistas',
          style: 'primary',
          action: () => {
            window.location.href = '/achievements';
          },
        },
      ],
    });
  }, [addNotification.mutate]);

  const showSystemNotification = useCallback((
    title: string,
    message: string,
    type: InAppNotification['type'] = 'info',
    priority: InAppNotification['priority'] = 'normal'
  ) => {
    addNotification.mutate({
      title,
      message,
      type,
      category: 'system',
      priority,
    });
  }, [addNotification.mutate]);

  // Obter preferências padrão
  const getDefaultPreferences = (): NotificationPreferences => ({
    in_app_enabled: true,
    show_content: true,
    show_social: true,
    show_system: true,
    show_achievements: true,
    show_reminders: true,
    sound_enabled: true,
    vibration_enabled: true,
    desktop_notifications: true,
    position: 'top-right',
    max_visible: 5,
    auto_dismiss_time: 5000,
    group_similar: true,
  });

  return {
    // Estado
    notifications: notifications || [],
    visibleNotifications,
    unreadCount,
    isLoading,
    error,
    preferences: preferences || getDefaultPreferences(),
    
    // Ações
    addNotification: addNotification.mutate,
    markAsRead: markAsRead.mutate,
    dismissNotification: dismissNotification.mutate,
    clearAllNotifications: clearAllNotifications.mutate,
    
    // Utilitários
    showContentNotification,
    showSocialNotification,
    showAchievementNotification,
    showSystemNotification,
    
    // Estados
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0,
    hasVisible: visibleNotifications.length > 0,
    isAdding: addNotification.isPending,
    isReading: markAsRead.isPending,
    isDismissing: dismissNotification.isPending,
  };
}
