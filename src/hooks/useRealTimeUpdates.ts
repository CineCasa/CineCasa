import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeEvent {
  id: string;
  type: 'content_update' | 'friend_activity' | 'system_update' | 'content_progress' | 'notification' | 'chat_message' | 'watch_party';
  data: any;
  user_id?: string;
  room_id?: string;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface RealTimeSubscription {
  channel: string;
  filter?: string;
  onEvent?: (event: RealTimeEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

interface UseRealTimeUpdatesOptions {
  userId?: string;
  enableContentUpdates?: boolean;
  enableFriendActivity?: boolean;
  enableSystemUpdates?: boolean;
  enableWatchProgress?: boolean;
  enableNotifications?: boolean;
  enableChat?: boolean;
  enableWatchParty?: boolean;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useRealTimeUpdates({
  userId,
  enableContentUpdates = true,
  enableFriendActivity = true,
  enableSystemUpdates = true,
  enableWatchProgress = true,
  enableNotifications = true,
  enableChat = false,
  enableWatchParty = false,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10,
}: UseRealTimeUpdatesOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Map<string, RealTimeSubscription>>(new Map());
  const [lastEvent, setLastEvent] = useState<RealTimeEvent | null>(null);
  
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const channelsRef = useRef<Map<string, any>>(new Map());

  // Conectar ao Supabase Realtime
  const connect = useCallback(() => {
    if (!userId) return;

    setConnectionStatus('connecting');
    
    try {
      // Limpar canais existentes
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();

      // Criar canais baseados nas configurações
      const newChannels = new Map<string, any>();

      // Canal de notificações
      if (enableNotifications) {
        const notificationChannel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'in_app_notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const event: RealTimeEvent = {
                id: `notification_${Date.now()}`,
                type: 'notification',
                data: payload,
                user_id: userId,
                timestamp: new Date().toISOString(),
                priority: payload.new?.priority || 'normal',
              };
              
              handleRealTimeEvent(event);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao canal de notificações');
            }
          });

        newChannels.set('notifications', notificationChannel);
      }

      // Canal de progresso de visualização
      if (enableWatchProgress) {
        const progressChannel = supabase
          .channel('user_progress')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_progress',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('📊 Progresso atualizado:', payload);
              
              // Atualizar cache local
              if (payload.new && payload.eventType === 'UPDATE') {
                const updatedProgress = payload.new as WatchProgress;
                updateLocalProgress(updatedProgress);
                
                // Disparar evento customizado
                window.dispatchEvent(new CustomEvent('watch-progress-updated', {
                  detail: updatedProgress
                }));
              }
            }
          );

        newChannels.set('user_progress', progressChannel);
      }

      // Canal de atividade de amigos
      if (enableFriendActivity) {
        const friendsChannel = supabase
          .channel('friend_activity')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'friend_activities',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              const event: RealTimeEvent = {
                id: `friend_${Date.now()}`,
                type: 'friend_activity',
                data: payload,
                user_id: userId,
                timestamp: new Date().toISOString(),
                priority: 'normal',
              };
              
              handleRealTimeEvent(event);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao canal de amigos');
            }
          });

        newChannels.set('friend_activity', friendsChannel);
      }

      // Canal de atualizações de conteúdo
      if (enableContentUpdates) {
        const contentChannel = supabase
          .channel('content_updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'cinema',
              filter: 'is_new=true', // Apenas conteúdo novo
            },
            (payload) => {
              const event: RealTimeEvent = {
                id: `content_${Date.now()}`,
                type: 'content_update',
                data: payload,
                timestamp: new Date().toISOString(),
                priority: 'normal',
              };
              
              handleRealTimeEvent(event);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao canal de conteúdo');
            }
          });

        newChannels.set('content_updates', contentChannel);
      }

      // Canal de atualizações do sistema
      if (enableSystemUpdates) {
        const systemChannel = supabase
          .channel('system_updates')
          .on('broadcast', { event: 'system_update' }, (payload) => {
            const event: RealTimeEvent = {
              id: `system_${Date.now()}`,
              type: 'system_update',
              data: payload,
              timestamp: new Date().toISOString(),
              priority: payload.priority || 'normal',
            };
            
            handleRealTimeEvent(event);
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao canal do sistema');
            }
          });

        newChannels.set('system_updates', systemChannel);
      }

      // Canal de chat (se habilitado)
      if (enableChat) {
        const chatChannel = supabase
          .channel(`chat:${userId}`)
          .on('broadcast', { event: 'new_message' }, (payload) => {
            const event: RealTimeEvent = {
              id: `chat_${Date.now()}`,
              type: 'chat_message',
              data: payload,
              user_id: userId,
              room_id: payload.room_id,
              timestamp: new Date().toISOString(),
              priority: 'normal',
            };
            
            handleRealTimeEvent(event);
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao canal de chat');
            }
          });

        newChannels.set('chat', chatChannel);
      }

      // Canal de watch party (se habilitado)
      if (enableWatchParty) {
        const watchPartyChannel = supabase
          .channel('watch_party')
          .on('broadcast', { event: 'party_update' }, (payload) => {
            const event: RealTimeEvent = {
              id: `party_${Date.now()}`,
              type: 'watch_party',
              data: payload,
              timestamp: new Date().toISOString(),
              priority: 'normal',
            };
            
            handleRealTimeEvent(event);
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao canal de watch party');
            }
          });

        newChannels.set('watch_party', watchPartyChannel);
      }

      channelsRef.current = newChannels;
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);

      console.log('🔄 Real-time conectado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao conectar real-time:', error);
      setConnectionStatus('disconnected');
      
      if (autoReconnect) {
        handleReconnect();
      }
    }
  }, [userId, enableContentUpdates, enableFriendActivity, enableSystemUpdates, enableWatchProgress, enableNotifications, enableChat, enableWatchParty, autoReconnect]);

  // Desconectar
  const disconnect = useCallback(() => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current.clear();
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    console.log('🔌 Real-time desconectado');
  }, []);

  // Reconectar automaticamente
  const handleReconnect = useCallback(() => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      return;
    }

    setConnectionStatus('reconnecting');
    setReconnectAttempts(prev => prev + 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectAttempts, maxReconnectAttempts, reconnectInterval]);

  // Manipular eventos real-time
  const handleRealTimeEvent = useCallback((event: RealTimeEvent) => {
    setLastEvent(event);

    // Invalidar queries relevantes baseado no tipo de evento
    switch (event.type) {
      case 'content_progress':
        queryClient.invalidateQueries({ queryKey: ['watch-progress', userId] });
        queryClient.invalidateQueries({ queryKey: ['continue-watching', userId] });
        break;
        
      case 'notification':
        queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
        queryClient.invalidateQueries({ queryKey: ['push-notifications', userId] });
        break;
        
      case 'friend_activity':
        queryClient.invalidateQueries({ queryKey: ['friend-activities', userId] });
        queryClient.invalidateQueries({ queryKey: ['friends', userId] });
        break;
        
      case 'content_update':
        queryClient.invalidateQueries({ queryKey: ['content'] });
        queryClient.invalidateQueries({ queryKey: ['recommendations', userId] });
        break;
        
      case 'system_update':
        queryClient.invalidateQueries({ queryKey: ['system-updates'] });
        break;
        
      case 'chat_message':
        queryClient.invalidateQueries({ queryKey: ['chat', userId] });
        queryClient.invalidateQueries({ queryKey: ['unread-messages', userId] });
        break;
        
      case 'watch_party':
        queryClient.invalidateQueries({ queryKey: ['watch-party', userId] });
        break;
    }

    // Disparar callbacks registrados
    const subscription = subscriptions.get(event.type);
    if (subscription?.onEvent) {
      subscription.onEvent(event);
    }
  }, [userId, queryClient, subscriptions]);

  // Adicionar subscription
  const subscribe = useCallback((subscription: RealTimeSubscription) => {
    setSubscriptions(prev => new Map(prev).set(subscription.channel, subscription));
  }, []);

  // Remover subscription
  const unsubscribe = useCallback((channel: string) => {
    setSubscriptions(prev => {
      const newMap = new Map(prev);
      newMap.delete(channel);
      return newMap;
    });
  }, []);

  // Enviar mensagem para canal específico
  const sendMessage = useCallback((channel: string, event: string, data: any) => {
    const supabaseChannel = channelsRef.current.get(channel);
    if (supabaseChannel) {
      supabaseChannel.send({
        event,
        payload: data,
      });
    }
  }, []);

  // Enviar broadcast
  const sendBroadcast = useCallback((event: string, data: any) => {
    supabase.channel('global').send({
      event,
      payload: data,
    });
  }, []);

  // Conectar automaticamente quando userId mudar
  useEffect(() => {
    if (userId) {
      connect();
    } else {
      disconnect();
    }
  }, [userId, connect, disconnect]);

  // Limpar reconexão quando componente desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // Listener para status de conexão
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && userId) {
        console.log('🌐 Conexão restaurada, reconectando real-time...');
        connect();
      }
    };

    const handleOffline = () => {
      console.log('📵 Conexão perdida');
      setConnectionStatus('disconnected');
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, userId, connect]);

  // Funções de conveniência para eventos específicos
  const subscribeToContentProgress = useCallback((callback: (event: RealTimeEvent) => void) => {
    subscribe({
      channel: 'content_progress',
      onEvent: callback,
    });
  }, [subscribe]);

  const subscribeToNotifications = useCallback((callback: (event: RealTimeEvent) => void) => {
    subscribe({
      channel: 'notifications',
      onEvent: callback,
    });
  }, [subscribe]);

  const subscribeToFriendActivity = useCallback((callback: (event: RealTimeEvent) => void) => {
    subscribe({
      channel: 'friend_activity',
      onEvent: callback,
    });
  }, [subscribe]);

  const subscribeToContentUpdates = useCallback((callback: (event: RealTimeEvent) => void) => {
    subscribe({
      channel: 'content_updates',
      onEvent: callback,
    });
  }, [subscribe]);

  const subscribeToSystemUpdates = useCallback((callback: (event: RealTimeEvent) => void) => {
    subscribe({
      channel: 'system_updates',
      onEvent: callback,
    });
  }, [subscribe]);

  const subscribeToChat = useCallback((callback: (event: RealTimeEvent) => void) => {
    subscribe({
      channel: 'chat',
      onEvent: callback,
    });
  }, [subscribe]);

  const subscribeToWatchParty = useCallback((callback: (event: RealTimeEvent) => void) => {
    subscribe({
      channel: 'watch_party',
      onEvent: callback,
    });
  }, [subscribe]);

  return {
    // Estado da conexão
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastEvent,
    
    // Ações
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    sendBroadcast,
    
    // Subscriptions específicas
    subscribeToContentProgress,
    subscribeToNotifications,
    subscribeToFriendActivity,
    subscribeToContentUpdates,
    subscribeToSystemUpdates,
    subscribeToChat,
    subscribeToWatchParty,
    
    // Estados
    isConnecting: connectionStatus === 'connecting',
    isReconnecting: connectionStatus === 'reconnecting',
    isDisconnected: connectionStatus === 'disconnected',
    hasSubscriptions: subscriptions.size > 0,
  };
}
