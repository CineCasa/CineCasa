import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  message: string;
  created_at: string;
  isCurrentUser?: boolean;
}

interface UseWatchPartyChatProps {
  roomId: string;
  userId?: string;
  username?: string;
  userAvatar?: string;
}

interface UseWatchPartyChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  isConnected: boolean;
  isConnecting: boolean;
  showOnlineStatus: boolean;
  reconnect: () => void;
}

export const useWatchPartyChat = ({
  roomId,
  userId,
  username = 'Anônimo',
  userAvatar
}: UseWatchPartyChatProps): UseWatchPartyChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);
  const subscriptionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Buscar mensagens históricas (primeiro, antes do realtime)
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('watch_party_messages' as any)
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (fetchError) {
        console.error('[useWatchPartyChat] Erro ao buscar mensagens:', fetchError);
        setError('Erro ao carregar mensagens');
        return;
      }

      const formattedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        ...msg,
        isCurrentUser: msg.user_id === userId
      }));

      if (isMountedRef.current) {
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('[useWatchPartyChat] Erro:', err);
      if (isMountedRef.current) {
        setError('Erro ao carregar mensagens');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [roomId, userId]);

  // Enviar mensagem
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;
    if (!userId) {
      setError('Você precisa estar logado para enviar mensagens');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('watch_party_messages' as any)
        .insert({
          room_id: roomId,
          user_id: userId,
          username: username,
          user_avatar: userAvatar,
          message: message.trim()
        });

      if (insertError) {
        console.error('[useWatchPartyChat] Erro ao enviar:', insertError);
        setError('Erro ao enviar mensagem');
        throw insertError;
      }
    } catch (err) {
      console.error('[useWatchPartyChat] Erro ao enviar:', err);
      setError('Erro ao enviar mensagem');
      throw err;
    }
  }, [roomId, userId, username, userAvatar]);

  // Deletar mensagem
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('watch_party_messages' as any)
        .delete()
        .eq('id', messageId)
        .eq('user_id', userId || '');

      if (deleteError) {
        console.error('[useWatchPartyChat] Erro ao deletar:', deleteError);
        setError('Erro ao deletar mensagem');
        throw deleteError;
      }
    } catch (err) {
      console.error('[useWatchPartyChat] Erro ao deletar:', err);
      setError('Erro ao deletar mensagem');
      throw err;
    }
  }, [userId]);

  // Setup realtime subscription com reconexão automática de 3 segundos
  const setupSubscription = useCallback(() => {
    if (!roomId || !isMountedRef.current) return;

    console.log('[useWatchPartyChat] Setting up subscription');

    // Limpar subscription anterior
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Configurar subscription realtime
    const channel = supabase
      .channel(`watch_party_chat:${roomId}`, {
        config: {
          broadcast: { self: true },
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watch_party_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[useWatchPartyChat] New message received:', payload);
          if (!isMountedRef.current) return;
          
          const newMessage: ChatMessage = {
            ...payload.new as ChatMessage,
            isCurrentUser: payload.new.user_id === userId
          };
          
          setMessages(prev => {
            // Evitar duplicatas
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'watch_party_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[useWatchPartyChat] Message deleted:', payload);
          if (!isMountedRef.current) return;
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('[useWatchPartyChat] Subscription status:', status);
        
        if (!isMountedRef.current) return;
        
        if (status === 'SUBSCRIBED') {
          console.log('Conectado ao Chat CineCasa!');
          setIsConnected(true);
          setIsConnecting(false);
          setShowOnlineStatus(true);
          setError(null);
          
          // Esconder "Online" após 2 segundos
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowOnlineStatus(false);
            }
          }, 2000);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setIsConnected(false);
          setIsConnecting(true);
          setError('Conexão perdida. Tentando reconectar...');
          
          // Reconectar após 3 segundos (fixo)
          console.log('[useWatchPartyChat] Reconnecting in 3000ms...');
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setupSubscription();
            }
          }, 3000);
        }
      });

    subscriptionRef.current = channel;
  }, [roomId, userId]);

  // Reconexão manual
  const reconnect = useCallback(() => {
    console.log('[useWatchPartyChat] Manual reconnect triggered');
    setIsConnecting(true);
    setupSubscription();
  }, [setupSubscription]);

  // Setup subscription quando roomId muda
  useEffect(() => {
    if (!roomId) return;
    
    isMountedRef.current = true;
    setIsConnecting(true);
    
    // Carregar histórico primeiro, depois iniciar realtime
    fetchMessages().then(() => {
      if (isMountedRef.current) {
        setupSubscription();
      }
    });

    // Heartbeat para manter conexão viva
    heartbeatRef.current = setInterval(() => {
      if (subscriptionRef.current && isConnected && isMountedRef.current) {
        console.log('[useWatchPartyChat] Heartbeat check');
      }
    }, 30000);

    // Cleanup ao desmontar
    return () => {
      isMountedRef.current = false;
      
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [roomId, setupSubscription, fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    isConnected,
    isConnecting,
    showOnlineStatus,
    reconnect
  };
};

export default useWatchPartyChat;
