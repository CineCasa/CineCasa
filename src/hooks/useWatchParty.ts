import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WatchPartyState {
  roomId: string | null;
  userId: string;
  userCount: number;
  isHost: boolean;
  videoState: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  };
}

interface WatchPartyMessage {
  type: 'play' | 'pause' | 'seek' | 'sync' | 'join' | 'leave';
  userId: string;
  roomId: string;
  timestamp: number;
  data?: any;
}

export function useWatchParty() {
  const [state, setState] = useState<WatchPartyState>({
    roomId: null,
    userId: '',
    userCount: 1,
    isHost: false,
    videoState: {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    },
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  const userIdRef = useRef<string>(`user_${Math.random().toString(36).substring(2, 9)}`);

  // Criar ou entrar em uma sala
  const joinRoom = useCallback(async (roomId: string) => {
    try {
      // Sair da sala anterior se estiver em uma
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // Criar novo canal para a sala
      const channel = supabase
        .channel(`watch_party:${roomId}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on('broadcast', { event: 'party_message' }, (payload) => {
          handleMessage(payload.payload as WatchPartyMessage);
        })
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          const users = Object.keys(presenceState).length;
          setState(prev => ({ ...prev, userCount: users }));
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[WatchParty] Novo usuário entrou:', newPresences);
          setState(prev => ({ ...prev, userCount: prev.userCount + 1 }));
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('[WatchParty] Usuário saiu:', leftPresences);
          setState(prev => ({ ...prev, userCount: Math.max(1, prev.userCount - 1) }));
        });

      // Inscrever no canal
      const status = await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[WatchParty] Conectado à sala:', roomId);
          setIsConnected(true);
          setError(null);
          
          // Entrar com presence
          await channel.track({
            userId: userIdRef.current,
            joinedAt: new Date().toISOString(),
          });
          
          // Notificar outros usuários
          await channel.send({
            type: 'broadcast',
            event: 'party_message',
            payload: {
              type: 'join',
              userId: userIdRef.current,
              roomId,
              timestamp: Date.now(),
            } as WatchPartyMessage,
          });
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[WatchParty] Erro no canal');
          setError('Erro de conexão');
        }
      });

      channelRef.current = channel;
      
      setState({
        roomId,
        userId: userIdRef.current,
        userCount: 1,
        isHost: false,
        videoState: {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        },
      });

      return true;
    } catch (err) {
      console.error('[WatchParty] Erro ao entrar na sala:', err);
      setError('Falha ao conectar');
      return false;
    }
  }, []);

  // Sair da sala
  const leaveRoom = useCallback(async () => {
    if (channelRef.current && state.roomId) {
      // Notificar saída
      await channelRef.current.send({
        type: 'broadcast',
        event: 'party_message',
        payload: {
          type: 'leave',
          userId: userIdRef.current,
          roomId: state.roomId,
          timestamp: Date.now(),
        } as WatchPartyMessage,
      });

      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    setState({
      roomId: null,
      userId: '',
      userCount: 1,
      isHost: false,
      videoState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      },
    });
    setIsConnected(false);
  }, [state.roomId]);

  // Enviar mensagem de vídeo (play, pause, seek)
  const sendVideoAction = useCallback(async (action: 'play' | 'pause' | 'seek', data?: any) => {
    if (!channelRef.current || !state.roomId) return;

    const message: WatchPartyMessage = {
      type: action,
      userId: userIdRef.current,
      roomId: state.roomId,
      timestamp: Date.now(),
      data,
    };

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'party_message',
        payload: message,
      });
    } catch (err) {
      console.error('[WatchParty] Erro ao enviar ação:', err);
    }
  }, [state.roomId]);

  // Manipular mensagens recebidas
  const handleMessage = useCallback((message: WatchPartyMessage) => {
    // Ignorar mensagens do próprio usuário
    if (message.userId === userIdRef.current) return;

    console.log('[WatchParty] Mensagem recebida:', message.type);

    switch (message.type) {
      case 'play':
      case 'pause':
      case 'seek':
        setState(prev => ({
          ...prev,
          videoState: {
            ...prev.videoState,
            isPlaying: message.type === 'play',
            currentTime: message.data?.currentTime || prev.videoState.currentTime,
          },
        }));
        break;

      case 'sync':
        setState(prev => ({
          ...prev,
          videoState: {
            ...prev.videoState,
            currentTime: message.data?.currentTime || prev.videoState.currentTime,
            isPlaying: message.data?.isPlaying ?? prev.videoState.isPlaying,
          },
        }));
        break;
    }

    // Disparar evento global para o player
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('watchparty-action', {
        detail: message,
      }));
    }
  }, []);

  // Sincronização periódica (a cada 5 segundos)
  useEffect(() => {
    if (!isConnected || !state.roomId) return;

    const syncInterval = setInterval(() => {
      // Apenas host envia sincronização
      if (state.isHost) {
        sendVideoAction('sync', {
          currentTime: state.videoState.currentTime,
          isPlaying: state.videoState.isPlaying,
        });
      }
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [isConnected, state.roomId, state.isHost, state.videoState, sendVideoAction]);

  // Cleanup quando desmontar
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  // Gerar link de convite
  const getInviteLink = useCallback(() => {
    if (!state.roomId) return '';
    return `${window.location.origin}/watch.html?room=${state.roomId}`;
  }, [state.roomId]);

  // Criar nova sala
  const createRoom = useCallback(() => {
    const newRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    joinRoom(newRoomId);
    setState(prev => ({ ...prev, isHost: true }));
    return newRoomId;
  }, [joinRoom]);

  return {
    ...state,
    isConnected,
    error,
    userId: userIdRef.current,
    joinRoom,
    leaveRoom,
    createRoom,
    sendVideoAction,
    getInviteLink,
    setVideoState: (videoState: Partial<WatchPartyState['videoState']>) => {
      setState(prev => ({
        ...prev,
        videoState: { ...prev.videoState, ...videoState },
      }));
    },
  };
}
