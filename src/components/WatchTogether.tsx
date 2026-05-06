import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Copy, Check, X, Minimize2, Maximize2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
  is_host?: boolean;
}

interface WatchTogetherProps {
  roomId: string;
  currentUrl: string;
  isHost: boolean;
  username: string;
  onPlaybackCommand?: (command: 'play' | 'pause' | 'seek', data?: any) => void;
  currentTime?: number;
  isPlaying?: boolean;
}

export default function WatchTogether({
  roomId,
  currentUrl,
  isHost,
  username,
  onPlaybackCommand,
  currentTime = 0,
  isPlaying = false
}: WatchTogetherProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Detect mobile
    setIsMobile(window.innerWidth < 768);
    
    // Generate invite link
    const link = `${window.location.origin}/watch/${roomId}`;
    setInviteLink(link);

    // Join room
    joinRoom();

    // Listen for window resize
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const joinRoom = async () => {
    try {
      // Create or join room
      const { error: roomError } = await supabase
        .from('watch_together_rooms')
        .upsert({
          id: roomId,
          current_url: currentUrl,
          host_id: isHost ? username : null,
          current_time: currentTime,
          is_playing: isPlaying,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (roomError) console.error('Error joining room:', roomError);

      // Add participant
      await supabase.from('watch_together_participants').upsert({
        room_id: roomId,
        user_id: username,
        is_host: isHost,
        last_seen: new Date().toISOString()
      }, { onConflict: 'room_id,user_id' });

      // Setup realtime subscription
      setupRealtimeSubscription();
      setIsConnected(true);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to chat messages
    const chatChannel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watch_together_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Connected to chat room');
        }
      });

    channelRef.current = chatChannel;

    // Subscribe to playback commands
    const playbackChannel = supabase
      .channel(`playback:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watch_together_commands',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          const command = payload.new;
          if (command.sender_id !== username && onPlaybackCommand) {
            onPlaybackCommand(command.command, command.data);
          }
        }
      )
      .subscribe();

    // Load existing messages
    loadMessages();
    updateParticipantCount();
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_together_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (data && !error) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const updateParticipantCount = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_together_participants')
        .select('*')
        .eq('room_id', roomId);

      if (data && !error) {
        setParticipantCount(data.length);
      }
    } catch (error) {
      console.error('Error getting participants:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('watch_together_messages')
        .insert({
          room_id: roomId,
          user_id: username,
          username: username,
          message: inputMessage.trim(),
          is_host: isHost
        });

      if (error) {
        console.error('Error sending message:', error);
      } else {
        setInputMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendPlaybackCommand = async (command: 'play' | 'pause' | 'seek', data?: any) => {
    if (!isHost) return;

    try {
      await supabase
        .from('watch_together_commands')
        .insert({
          room_id: roomId,
          sender_id: username,
          command: command,
          data: data,
          created_at: new Date().toISOString()
        });

      // Update room state
      await supabase
        .from('watch_together_rooms')
        .update({
          current_time: data?.currentTime || currentTime,
          is_playing: command === 'play',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);
    } catch (error) {
      console.error('Error sending playback command:', error);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const leaveRoom = async () => {
    try {
      await supabase
        .from('watch_together_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', username);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [roomId, username]);

  return (
    <div 
      className={`
        fixed right-0 z-50 transition-all duration-300
        ${isMobile ? 'bottom-0 left-0 right-0' : 'top-0 bottom-0'}
        ${isMinimized ? 'w-auto' : isMobile ? 'h-80' : 'w-96'}
      `}
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="CineCasa" className="w-8 h-8 rounded-lg" />
          <div>
            <h3 className="text-white font-semibold text-sm">Assistir Juntos</h3>
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <Users size={12} />
              <span>{participantCount} online</span>
              {isConnected && <span className="text-green-400">•</span>}
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-white/60 hover:text-white transition-colors"
        >
          {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: isMobile ? 'calc(100% - 180px)' : 'calc(100% - 180px)' }}>
            {messages.length === 0 && (
              <div className="text-center text-white/40 text-sm py-8">
                <p>Nenhuma mensagem ainda</p>
                <p className="text-xs mt-1">Seja o primeiro a dizer oi! 👋</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.user_id === username ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${msg.is_host ? 'text-purple-400' : 'text-white/70'}`}>
                    {msg.username}
                    {msg.is_host && <span className="ml-1 text-xs">👑</span>}
                  </span>
                  <span className="text-white/40 text-xs">
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`
                    max-w-[80%] px-3 py-2 rounded-lg text-sm
                    ${msg.user_id === username 
                      ? 'bg-purple-600/30 text-white' 
                      : 'bg-white/10 text-white/90'
                    }
                  `}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Invite Link */}
          <div className="px-4 py-3 border-t border-white/10">
            <button
              onClick={copyInviteLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 text-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Link copiado!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copiar link de convite
                </>
              )}
            </button>
            <p className="text-white/40 text-xs text-center mt-2">
              Compartilhe para convidar amigos
            </p>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:text-white/40 rounded-lg text-white transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            {isHost && (
              <p className="text-purple-400 text-xs mt-2 text-center">
                👑 Você é o host - controla a reprodução
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
