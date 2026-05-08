import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RealtimeMessage {
  type: 'update' | 'notification' | 'maintenance' | 'critical';
  data: any;
  timestamp: string;
  version?: string;
}

export function useRealtimeUpdates() {
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const isConnectedRef = useRef<boolean>(false);

  const connect = useCallback(() => {
    if (isConnectedRef.current) return;

    try {
      channelRef.current = supabase
        .channel('app-updates')
        .on('broadcast', { event: 'app-update' }, (payload: any) => {
          handleRealtimeMessage(payload.payload as RealtimeMessage);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isConnectedRef.current = true;
            console.log('[Realtime] Conectado ao canal de atualizações');
          } else if (status === 'CHANNEL_ERROR') {
            isConnectedRef.current = false;
            console.warn('[Realtime] Erro no canal, tentando reconectar...');
            scheduleReconnect();
          }
        });
    } catch (error) {
      console.error('[Realtime] Erro ao conectar:', error);
      scheduleReconnect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    isConnectedRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return;
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('[Realtime] Tentando reconectar...');
      connect();
      reconnectTimeoutRef.current = undefined;
    }, 5000);
  }, [connect]);

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    console.log('[Realtime] Mensagem recebida:', message);
    
    switch (message.type) {
      case 'update':
        handleUpdateMessage(message);
        break;
      case 'notification':
        handleNotificationMessage(message);
        break;
      case 'maintenance':
        handleMaintenanceMessage(message);
        break;
      case 'critical':
        handleCriticalMessage(message);
        break;
    }
  }, []);

  const handleUpdateMessage = useCallback((message: RealtimeMessage) => {
    // Disparar evento global
    window.dispatchEvent(new CustomEvent('realtime-update', {
      detail: message.data
    }));
    
    // Se tiver versão, verificar se precisa atualizar
    if (message.version) {
      const currentVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
      if (currentVersion !== message.version) {
        console.log(`[Realtime] Nova versão disponível: ${message.version}`);
        
        // Notificar usuário
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('CineCasa - Atualização Disponível', {
            body: 'Uma nova versão está disponível. Clique para atualizar.',
            icon: '/icons/icon-192x192.png',
            tag: 'app-update'
          }).onclick = () => {
            window.location.reload();
          };
        }
        
        // Disparar evento para hot reload
        window.dispatchEvent(new CustomEvent('force-update-check', {
          detail: { version: message.version }
        }));
      }
    }
  }, []);

  const handleNotificationMessage = useCallback((message: RealtimeMessage) => {
    const { title, body, icon, actions } = message.data;
    
    // Notificação nativa
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: icon || '/icons/icon-192x192.png',
        tag: 'app-notification',
        requireInteraction: true
      });
      
      if (actions) {
        actions.forEach((action: any) => {
          notification.addEventListener('click', () => {
            if (action.url) {
              window.location.href = action.url;
            }
          });
        });
      }
    }
    
    // Toast notification
    toast.info(title, {
      description: body,
      duration: 5000
    });
  }, []);

  const handleMaintenanceMessage = useCallback((message: RealtimeMessage) => {
    const { title, message: maintenanceMessage, scheduledAt, duration } = message.data;
    
    console.warn('[Realtime] Manutenção agendada:', message.data);
    
    // Mostrar banner de manutenção
    window.dispatchEvent(new CustomEvent('maintenance-scheduled', {
      detail: {
        title,
        message: maintenanceMessage,
        scheduledAt,
        duration
      }
    }));
  }, []);

  const handleCriticalMessage = useCallback((message: RealtimeMessage) => {
    console.error('[Realtime] Mensagem crítica:', message.data);
    
    const { title, message: criticalMessage, action } = message.data;
    
    // Forçar atualização imediata
    if (action === 'force-reload') {
      if (confirm(`${title}\n\n${criticalMessage}\n\nO sistema será recarregado agora.`)) {
        window.location.reload();
      }
    }
  }, []);

  const sendPing = useCallback(() => {
    if (isConnectedRef.current && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'ping',
        payload: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
    }
  }, []);

  useEffect(() => {
    connect();
    
    // Ping periódico para manter conexão ativa
    const pingInterval = setInterval(sendPing, 30000);
    
    // Limpar conexão ao descarregar página
    const handleBeforeUnload = () => {
      disconnect();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      disconnect();
    };
  }, [connect, disconnect, sendPing]);

  return {
    isConnected: isConnectedRef.current,
    sendPing
  };
}
