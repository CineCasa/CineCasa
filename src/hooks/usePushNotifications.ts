import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PushNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  data?: any;
  category: 'content' | 'social' | 'system' | 'achievement' | 'reminder';
  priority: 'low' | 'normal' | 'high' | 'critical';
  action?: {
    type: 'open_content' | 'open_profile' | 'open_settings' | 'custom_url';
    url?: string;
    data?: any;
  };
  scheduled_at?: string;
  expires_at?: string;
  created_at: string;
  read_at?: string;
  clicked_at?: string;
}

interface UsePushNotificationsOptions {
  userId?: string;
  enableServiceWorker?: boolean;
  enableVibration?: boolean;
  enableSound?: boolean;
  autoRequest?: boolean;
}

export function usePushNotifications({
  userId,
  enableServiceWorker = true,
  enableVibration = true,
  enableSound = true,
  autoRequest = true,
}: UsePushNotificationsOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const queryClient = useQueryClient();

  // Verificar suporte a notificações
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Registrar service worker
  useEffect(() => {
    if (!enableServiceWorker || !isSupported) return;

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        setRegistration(reg);
        
        console.log('✅ Service Worker registrado:', reg);
        
        // Verificar subscription existente
        const existingSubscription = await reg.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          await saveSubscription(existingSubscription);
        }
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
      }
    };

    registerServiceWorker();
  }, [enableServiceWorker, isSupported]);

  // Query para notificações pendentes
  const { data: notifications, isLoading, error, refetch } = useQuery({
    queryKey: ['push-notifications', userId],
    queryFn: async (): Promise<PushNotification[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .eq('user_id', userId)
        .is('read_at', 'null')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao buscar notificações:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para solicitar permissão
  const requestPermission = useMutation({
    mutationFn: async (): Promise<NotificationPermission> => {
      if (!isSupported) {
        throw new Error('Notificações não suportadas');
      }

      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await subscribeToPush();
      }

      return permission;
    },
    onSuccess: (permission) => {
      console.log('📱 Permissão concedida:', permission);
      
      // Salvar preferência no banco
      if (userId) {
        supabase
          .from('user_notification_preferences')
          .upsert({
            user_id: userId,
            push_enabled: permission === 'granted',
            updated_at: new Date().toISOString(),
          });
      }
    },
    onError: (error) => {
      console.error('❌ Erro ao solicitar permissão:', error);
    },
  });

  // Mutation para inscrever em push
  const subscribeToPush = useCallback(async () => {
    if (!registration || !isSupported) return;

    try {
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY', // Em produção, usar chave real
      });

      setSubscription(pushSubscription);
      await saveSubscription(pushSubscription);
      
      console.log('✅ Inscrito em push notifications');
    } catch (error) {
      console.error('❌ Erro ao inscrever em push:', error);
    }
  }, [registration, isSupported]);

  // Salvar subscription no banco
  const saveSubscription = useCallback(async (sub: PushSubscription) => {
    if (!userId) return;

    const subscriptionData = {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: btoa(String.fromCharCode.apply(null, 
        new Uint8Array(sub.getKey('p256dh') as ArrayBuffer))),
      auth: btoa(String.fromCharCode.apply(null, 
        new Uint8Array(sub.getKey('auth') as ArrayBuffer))),
      created_at: new Date().toISOString(),
    };

    await supabase
      .from('push_subscriptions')
      .upsert(subscriptionData);
  }, [userId]);

  // Mutation para enviar notificação
  const sendNotification = useMutation({
    mutationFn: async (notification: Partial<PushNotification>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const notificationData = {
        user_id: userId,
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        image: notification.image,
        data: notification.data,
        category: notification.category || 'system',
        priority: notification.priority || 'normal',
        action: notification.action,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('push_notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao enviar notificação:', error);
        throw error;
      }

      // Enviar push via service worker
      if (subscription) {
        await sendPushNotification(data);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-notifications', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de notificação:', error);
    },
  });

  // Enviar notificação via service worker
  const sendPushNotification = useCallback(async (notification: PushNotification) => {
    if (!registration) return;

    try {
      await registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        image: notification.image,
        data: notification.data,
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
        actions: notification.action ? [
          {
            action: notification.action.type,
            title: 'Ver',
            icon: '/icons/play.png'
          }
        ] : [],
        vibrate: enableVibration ? [200, 100, 200] : undefined,
        sound: enableSound ? 'default' : undefined,
      });
    } catch (error) {
      console.error('❌ Erro ao mostrar notificação:', error);
    }
  }, [registration, enableVibration, enableSound]);

  // Mutation para marcar como lida
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('push_notifications')
        .update({
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-notifications', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de marcar como lida:', error);
    },
  });

  // Mutation para marcar como clicada
  const markAsClicked = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await supabase
        .from('push_notifications')
        .update({
          clicked_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao marcar como clicada:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-notifications', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de marcar como clicada:', error);
    },
  });

  // Auto-request permissão
  useEffect(() => {
    if (autoRequest && isSupported && permission === 'default' && userId) {
      // Aguardar um pouco antes de solicitar
      const timer = setTimeout(() => {
        requestPermission.mutate();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [autoRequest, isSupported, permission, userId, requestPermission.mutate]);

  // Listener para cliques em notificações
  useEffect(() => {
    if (!registration) return;

    const handleClick = (event: any) => {
      const notification = event.notification;
      const action = event.action;

      if (action) {
        // Usuário clicou em uma ação
        handleNotificationAction(notification.data, action);
      } else {
        // Usuário clicou na notificação
        handleNotificationClick(notification.data);
      }

      // Marcar como clicada
      if (notification.data?.id) {
        markAsClicked.mutate(notification.data.id);
      }

      notification.close();
    };

    registration.addEventListener('notificationclick', handleClick);
    
    return () => {
      registration.removeEventListener('notificationclick', handleClick);
    };
  }, [registration, markAsClicked.mutate]);

  // Handlers para ações
  const handleNotificationAction = useCallback((data: any, action: string) => {
    console.log('🔔 Ação clicada:', action, data);

    switch (action) {
      case 'open_content':
        if (data.content_id) {
          window.location.href = `/content/${data.content_id}`;
        }
        break;
      case 'open_profile':
        if (data.user_id) {
          window.location.href = `/profile/${data.user_id}`;
        }
        break;
      case 'open_settings':
        window.location.href = '/settings/notifications';
        break;
      case 'custom_url':
        if (data.url) {
          window.open(data.url, '_blank');
        }
        break;
    }
  }, []);

  const handleNotificationClick = useCallback((data: any) => {
    console.log('🔔 Notificação clicada:', data);
    
    // Ação padrão: abrir conteúdo
    if (data.content_id) {
      window.location.href = `/content/${data.content_id}`;
    }
  }, []);

  // Funções utilitárias
  const sendContentNotification = useCallback((
    title: string,
    body: string,
    contentId: string,
    contentType: 'movie' | 'series',
    priority: PushNotification['priority'] = 'normal'
  ) => {
    sendNotification.mutate({
      title,
      body,
      category: 'content',
      priority,
      data: {
        content_id: contentId,
        content_type: contentType,
      },
      action: {
        type: 'open_content',
        data: { content_id: contentId },
      },
    });
  }, [sendNotification.mutate]);

  const sendSocialNotification = useCallback((
    title: string,
    body: string,
    userId: string,
    type: 'friend_request' | 'new_follower' | 'friend_activity'
  ) => {
    sendNotification.mutate({
      title,
      body,
      category: 'social',
      priority: 'normal',
      data: {
        user_id: userId,
        type,
      },
      action: {
        type: 'open_profile',
        data: { user_id: userId },
      },
    });
  }, [sendNotification.mutate]);

  const sendAchievementNotification = useCallback((
    title: string,
    body: string,
    achievementId: string,
    badge?: string
  ) => {
    sendNotification.mutate({
      title,
      body,
      category: 'achievement',
      priority: 'high',
      data: {
        achievement_id: achievementId,
        badge,
      },
      action: {
        type: 'open_settings',
      },
    });
  }, [sendNotification.mutate]);

  return {
    // Estado
    isSupported,
    permission,
    subscription,
    registration,
    
    // Dados
    notifications: notifications || [],
    isLoading,
    error,
    
    // Ações
    requestPermission: requestPermission.mutate,
    subscribeToPush,
    sendNotification: sendNotification.mutate,
    markAsRead: markAsRead.mutate,
    markAsClicked: markAsClicked.mutate,
    
    // Utilitários
    sendContentNotification,
    sendSocialNotification,
    sendAchievementNotification,
    
    // Estados
    isSubscribed: !!subscription,
    hasPermission: permission === 'granted',
    hasNotifications: notifications.length > 0,
    isRequesting: requestPermission.isPending,
  };
}
