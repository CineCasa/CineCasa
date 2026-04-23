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
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const subscriptionRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar mensagens históricas
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('watch_party_messages' as any)
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) {
        console.error('[useWatchPartyChat] Erro ao buscar mensagens:', fetchError);
        setError('Erro ao carregar mensagens');
        return;
      }

      const formattedMessages: ChatMessage[] = (data || []).map((msg: any) => ({
        ...msg,
        isCurrentUser: msg.user_id === userId
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('[useWatchPartyChat] Erro:', err);
      setError('Erro ao carregar mensagens');
    } finally {
      setIsLoading(false);
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

  // Setup realtime subscription com reconexão automática
  const setupSubscription = useCallback(() => {
    if (!roomId) return;

    console.log('[useWatchPartyChat] Setting up subscription, attempt:', reconnectAttempt);

    // Limpar subscription anterior
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
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
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('[useWatchPartyChat] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          setReconnectAttempt(0); // Reset retry counter on success
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setIsConnected(false);
          setError('Conexão perdida. Tentando reconectar...');
          
          // Tentar reconectar após delay exponencial
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          console.log(`[useWatchPartyChat] Reconnecting in ${delay}ms...`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
          }, delay);
        }
      });

    subscriptionRef.current = channel;
  }, [roomId, userId, reconnectAttempt]);

  // Reconexão manual
  const reconnect = useCallback(() => {
    console.log('[useWatchPartyChat] Manual reconnect triggered');
    setReconnectAttempt(prev => prev + 1);
  }, []);

  // Setup subscription quando roomId muda ou tentativa de reconexão
  useEffect(() => {
    if (!roomId) return;

    fetchMessages();
    setupSubscription();

    // Heartbeat para manter conexão viva
    heartbeatRef.current = setInterval(() => {
      if (subscriptionRef.current && isConnected) {
        console.log('[useWatchPartyChat] Heartbeat check');
      }
    }, 30000);

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [roomId, setupSubscription, fetchMessages, isConnected]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    isConnected,
    reconnect
  };
};

export default useWatchPartyChat;
