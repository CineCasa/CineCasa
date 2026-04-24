import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Users, MessageCircle, X } from 'lucide-react';
import { useWatchPartyChat, ChatMessage } from '@/hooks/useWatchPartyChat';
import { useAuth } from '@/components/AuthProvider';
// Simple time formatter - returns relative time
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes} min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days} dias atrás`;
  return date.toLocaleDateString();
};

interface WatchPartyChatProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WatchPartyChat: React.FC<WatchPartyChatProps> = ({
  roomId,
  isOpen,
  onClose
}) => {
  const { session, profile } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    deleteMessage,
    isConnected,
    isConnecting,
    showOnlineStatus,
    reconnect
  } = useWatchPartyChat({
    roomId,
    userId: session?.user?.id,
    username: profile?.username || session?.user?.email?.split('@')[0] || 'Anônimo',
    userAvatar: profile?.avatar_url
  });

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus no input quando abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err) {
      console.error('Erro ao enviar:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Deseja deletar esta mensagem?')) return;
    
    try {
      await deleteMessage(messageId);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date));
    } catch {
      return 'agora';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-16 sm:top-0 h-[calc(100vh-64px)] sm:h-full w-72 sm:w-80 bg-black/95 backdrop-blur-xl border-l border-white/10 flex flex-col z-50 shadow-2xl max-w-[calc(100vw-60px)] rounded-tl-xl sm:rounded-none">
      {/* Header com indicador de conexão premium */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#00E5FF]/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#00E5FF]/20">
            <MessageCircle className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Bate-papo</h3>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3" />
              <span>Sala: {roomId.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Indicador de conexão premium Ciano Neon */}
          {isConnecting && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="text-xs text-[#00E5FF] font-medium">Conectando...</span>
            </div>
          )}
          
          {showOnlineStatus && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.8)' }} />
              <span className="text-xs text-green-400 font-medium">Online</span>
            </motion.div>
          )}
          
          {/* Indicador discreto quando conectado */}
          {!isConnecting && !showOnlineStatus && isConnected && (
            <div 
              className="w-2 h-2 rounded-full bg-green-500"
              style={{ boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)' }}
              title="Conectado"
            />
          )}
          
          {/* Botão reconectar quando offline */}
          {!isConnected && !isConnecting && (
            <button
              onClick={reconnect}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/30"
              title="Tentar reconectar"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs text-red-400 font-medium">Offline</span>
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-gray-400 text-sm">Carregando...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-gray-600 mb-2" />
            <p className="text-gray-400 text-sm">
              Nenhuma mensagem ainda.<br />
              Seja o primeiro a conversar!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onDelete={handleDelete}
              formatTime={formatTime}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs text-center">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={session ? "Digite sua mensagem..." : "Faça login para participar"}
            disabled={!session}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]/50 disabled:opacity-50"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!session || !newMessage.trim()}
            className="p-2 rounded-lg bg-[#00E5FF] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00E5FF]/80 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {!session && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Faça login para enviar mensagens
          </p>
        )}
      </form>
    </div>
  );
};

// Componente de bolha de mensagem
interface MessageBubbleProps {
  message: ChatMessage;
  onDelete: (id: string) => void;
  formatTime: (date: string) => string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onDelete,
  formatTime
}) => {
  const isMe = message.isCurrentUser;

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 ${
          isMe
            ? 'bg-[#00E5FF] text-black rounded-br-md'
            : 'bg-white/10 text-white rounded-bl-md'
        }`}
      >
        {/* Nome do usuário */}
        {!isMe && (
          <p className={`text-xs font-medium mb-1 ${isMe ? 'text-black/70' : 'text-[#00E5FF]'}`}>
            {message.username}
          </p>
        )}
        
        {/* Conteúdo */}
        <p className={`text-sm break-words ${isMe ? 'text-black' : 'text-white'}`}>
          {message.message}
        </p>

        {/* Footer com hora e delete */}
        <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-start' : 'justify-end'}`}>
          <span className={`text-xs ${isMe ? 'text-black/60' : 'text-gray-500'}`}>
            {formatTime(message.created_at)}
          </span>
          
          {isMe && (
            <button
              onClick={() => onDelete(message.id)}
              className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                isMe ? 'text-black/50 hover:text-black' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchPartyChat;
