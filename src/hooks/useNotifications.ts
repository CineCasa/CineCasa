import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global flag to prevent duplicate service worker registrations
let swRegistrationAttempted = false;

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, any>;
  requireInteraction?: boolean;
}

interface NotificationPreferences {
  newEpisodes: boolean;
  recommendations: boolean;
  continueWatching: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  newEpisodes: true,
  recommendations: true,
  continueWatching: true,
  marketing: false,
};

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Verificar suporte a notificações - executa apenas uma vez
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // REMOVED: Service worker registration now handled by sw.js only
      // to prevent duplicate registrations and conflicts
    }
  }, []);

  // Carregar preferências do usuário
  useEffect(() => {
    loadPreferences();
  }, []);

  // Buscar notificações ao montar e periodicamente
  useEffect(() => {
    fetchNotifications();

    // Verificar a cada 30 segundos
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Supabase Realtime - detectar novas notificações em tempo real
  useEffect(() => {
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('[Notifications] Nova notificação recebida via Realtime');
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, []);

  // Registrar Service Worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[Notifications] Service Worker registrado:', registration);
      
      // Verificar se já existe inscrição
      const existingSubscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!existingSubscription);
      
      return registration;
    } catch (error) {
      console.error('[Notifications] Erro ao registrar Service Worker:', error);
      return null;
    }
  };

  // Solicitar permissão de notificação (apenas quando chamado explicitamente)
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('[Notifications] Erro ao solicitar permissão:', error);
      return false;
    }
  };

  // Inscrever em notificações push (apenas quando chamado explicitamente)
  const subscribe = async (): Promise<boolean> => {
    // Primeiro verificar se já temos permissão
    if (Notification.permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Criar ou recuperar subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // TODO: Substituir pela sua chave VAPID pública
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
        
        if (!vapidPublicKey) {
          console.warn('[Notifications] VAPID public key não configurada');
          // Criar subscription local apenas
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey || 'BEl62iSMg_Y8a6B2F8s5Vd2YwD8K9hZ4kLmN7pQrStUvWxYz1234567890abcdef'),
          });
        }
      }

      if (subscription) {
        // Salvar subscription no Supabase
        await saveSubscription(subscription);
        setIsSubscribed(true);
        return true;
      }
    } catch (error) {
      console.error('[Notifications] Erro ao inscrever:', error);
    }

    return false;
  };

  // Cancelar inscrição
  const unsubscribe = async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await removeSubscription();
        setIsSubscribed(false);
        return true;
      }
    } catch (error) {
      console.error('[Notifications] Erro ao cancelar inscrição:', error);
    }
    return false;
  };

  // Salvar subscription no Supabase
  const saveSubscription = async (subscription: PushSubscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        subscription: JSON.stringify(subscription),
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Notifications] Erro ao salvar subscription:', error);
    }
  };

  // Remover subscription do Supabase
  const removeSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);
    } catch (error) {
      console.error('[Notifications] Erro ao remover subscription:', error);
    }
  };

  // Enviar notificação local
  const sendLocalNotification = useCallback(async (payload: NotificationPayload) => {
    if (permission !== 'granted') {
      console.warn('[Notifications] Permissão não concedida');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: payload.tag || 'general',
        requireInteraction: payload.requireInteraction || false,
        data: payload.data || {},
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
        actions: payload.data?.actions || [],
      });

      return true;
    } catch (error) {
      console.error('[Notifications] Erro ao enviar notificação:', error);
      return false;
    }
  }, [permission]);

  // Notificar novo episódio
  const notifyNewEpisode = useCallback(async (
    seriesTitle: string,
    episodeTitle: string,
    seriesId: string,
    episodeId: string,
    posterUrl?: string
  ) => {
    if (!preferences.newEpisodes) return;

    return sendLocalNotification({
      title: `Novo episódio de ${seriesTitle}`,
      body: `${episodeTitle} já está disponível para assistir!`,
      icon: posterUrl,
      tag: `new-episode-${episodeId}`,
      data: {
        type: 'new_episode',
        seriesId,
        episodeId,
        actions: [
          { action: 'watch', title: 'Assistir Agora' },
          { action: 'dismiss', title: 'Mais Tarde' }
        ]
      },
      requireInteraction: false,
    });
  }, [preferences.newEpisodes, sendLocalNotification]);

  // Notificar recomendação
  const notifyRecommendation = useCallback(async (
    contentTitle: string,
    reason: string,
    contentId: string,
    posterUrl?: string
  ) => {
    if (!preferences.recommendations) return;

    return sendLocalNotification({
      title: 'Recomendamos para você',
      body: `${contentTitle} - ${reason}`,
      icon: posterUrl,
      tag: `recommendation-${contentId}`,
      data: {
        type: 'recommendation',
        contentId,
        actions: [
          { action: 'watch', title: 'Ver Detalhes' },
          { action: 'dismiss', title: 'Ignorar' }
        ]
      },
    });
  }, [preferences.recommendations, sendLocalNotification]);

  // Notificar continuar assistindo
  const notifyContinueWatching = useCallback(async (
    contentTitle: string,
    progress: number,
    contentId: string,
    posterUrl?: string
  ) => {
    if (!preferences.continueWatching) return;

    return sendLocalNotification({
      title: 'Continue assistindo',
      body: `Você parou em ${contentTitle} (${Math.round(progress)}% assistido)`,
      icon: posterUrl,
      tag: `continue-${contentId}`,
      data: {
        type: 'continue_watching',
        contentId,
        progress,
        actions: [
          { action: 'watch', title: 'Continuar' },
          { action: 'dismiss', title: 'Descartar' }
        ]
      },
    });
  }, [preferences.continueWatching, sendLocalNotification]);

  // Carregar preferências
  const loadPreferences = async () => {
    try {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('[Notifications] Erro ao carregar preferências:', error);
    }
  };

  // Salvar preferências
  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      setPreferences(newPreferences);
      localStorage.setItem('notification_preferences', JSON.stringify(newPreferences));
      
      // Salvar no Supabase também
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          notification_preferences: newPreferences,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[Notifications] Erro ao salvar preferências:', error);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Notifications] Erro ao marcar como lida:', error);
    }
  };

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('[Notifications] Erro ao buscar notificações:', error);
    }
  };

  // Limpar todas as notificações
  const clearAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id);

      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('[Notifications] Erro ao limpar notificações:', error);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    preferences,
    unreadCount,
    notifications,
    requestPermission,
    subscribe,
    unsubscribe,
    sendLocalNotification,
    notifyNewEpisode,
    notifyRecommendation,
    notifyContinueWatching,
    savePreferences,
    markAsRead,
    fetchNotifications,
    clearAllNotifications,
  };
}

// Utilitário para converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
