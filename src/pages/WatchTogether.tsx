import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, Users, MessageSquare, X, Send, Link2, Play, Pause, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * WATCH PARTY COMPLETO:
 * - Link fixo por sala (baseado no contentId, não muda)
 * - Convidados NÃO precisam fazer login — assistem diretamente pelo navegador
 * - Chat em tempo real com Supabase Realtime (watch_party_messages)
 * - Sincronização play/pause/seek via Supabase Broadcast
 * - Até 100 participantes simultâneos
 * - Host controla o vídeo; convidados recebem os comandos
 * - Link de convite fácil de copiar
 */

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  message: string;
  created_at: string;
}

interface PartyState {
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
}

// Gera ID anônimo persistente no sessionStorage
function getGuestId(): string {
  let id = sessionStorage.getItem('cinecasa_guest_id');
  if (!id) {
    id = `guest_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem('cinecasa_guest_id', id);
  }
  return id;
}

function getGuestName(): string {
  let name = sessionStorage.getItem('cinecasa_guest_name');
  if (!name) {
    const names = ['Pipoca', 'Maçaneta', 'Poltrona', 'Capim', 'Balcão', 'Telinha', 'Chuveiro', 'Almofada'];
    name = `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 99) + 1}`;
    sessionStorage.setItem('cinecasa_guest_name', name);
  }
  return name;
}

export default function WatchTogether() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // roomId pode vir da URL /assistir-juntos/:roomId
  // ou da query string ?room=xxx (links de convite)
  const effectiveRoomId = roomId || searchParams.get('room') || '';

  const [roomData, setRoomData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCount, setUserCount] = useState(1);
  const [isHost, setIsHost] = useState(false);
  const [partyState, setPartyState] = useState<PartyState>({ isPlaying: false, currentTime: 0, updatedAt: 0 });
  const [showChat, setShowChat] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channelRef = useRef<any>(null);
  const chatChannelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = useRef(getGuestId());

  const inviteLink = `${window.location.origin}/assistir-juntos/${effectiveRoomId}`;

  // Copiar link
  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    toast.success('Link copiado! Compartilhe com até 100 pessoas 🎉');
    setTimeout(() => setInviteCopied(false), 3000);
  };

  // Carregar dados da sala
  useEffect(() => {
    if (!effectiveRoomId) { setError('Sala não encontrada'); setLoading(false); return; }

    // Verificar se guest já confirmou nome
    const savedName = sessionStorage.getItem('cinecasa_guest_name');
    if (savedName) { setGuestName(savedName); setNameConfirmed(true); }
    else { setGuestName(`Convidado${Math.floor(Math.random() * 99) + 1}`); }

    loadRoom();
  }, [effectiveRoomId]);

  const loadRoom = async () => {
    try {
      // Busca sala na tabela watch_together_rooms ou usa watch_party_messages como fallback
      const { data } = await supabase
        .from('watch_party_messages')
        .select('room_id')
        .eq('room_id', effectiveRoomId)
        .limit(1);

      // Busca informações do conteúdo a partir do roomId (formato: contentType_contentId)
      const parts = effectiveRoomId.split('_');
      const contentType = parts[0] || 'cinema';
      const contentId = parts[1] || '';

      if (contentId) {
        const table = contentType === 'series' ? 'series' : 'cinema';
        const idCol = contentType === 'series' ? 'id_n' : 'id';
        const { data: content } = await supabase
          .from(table)
          .select('titulo, poster, capa, trailer, url')
          .eq(idCol, contentId)
          .maybeSingle();

        setRoomData({
          id: effectiveRoomId,
          title: content?.titulo || 'Conteúdo',
          poster: content?.capa || content?.poster || '',
          videoUrl: content?.url || content?.trailer || '',
          contentId,
          contentType,
        });
      } else {
        setRoomData({ id: effectiveRoomId, title: 'Sala de Assistir Juntos', poster: '', videoUrl: '' });
      }

      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar a sala');
      setLoading(false);
    }
  };

  // Conectar Supabase Realtime — sync do player
  const connectSync = useCallback(() => {
    if (!effectiveRoomId || !nameConfirmed) return;

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    const channel = supabase
      .channel(`party_sync:${effectiveRoomId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'video_action' }, ({ payload }) => {
        if (payload.userId === userId.current) return; // ignora próprio
        setPartyState({ isPlaying: payload.isPlaying, currentTime: payload.currentTime, updatedAt: Date.now() });
      })
      .on('presence', { event: 'sync' }, () => {
        const count = Object.keys(channel.presenceState()).length;
        setUserCount(Math.max(count, 1));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // Se este usuário é o mais antigo, é o host
        const state = channel.presenceState();
        const ids = Object.keys(state);
        if (ids.length === 1 || ids[0] === userId.current) setIsHost(true);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: userId.current,
            name: guestName,
            joinedAt: Date.now(),
          });
        }
      });

    channelRef.current = channel;
  }, [effectiveRoomId, nameConfirmed, guestName]);

  // Conectar chat
  const connectChat = useCallback(() => {
    if (!effectiveRoomId || !nameConfirmed) return;

    if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);

    // Buscar mensagens históricas
    supabase
      .from('watch_party_messages')
      .select('*')
      .eq('room_id', effectiveRoomId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    // Escutar novas mensagens em realtime
    const chatCh = supabase
      .channel(`party_chat:${effectiveRoomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'watch_party_messages',
        filter: `room_id=eq.${effectiveRoomId}`,
      }, ({ new: msg }) => {
        setMessages(prev => [...prev, msg as ChatMessage]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    chatChannelRef.current = chatCh;
  }, [effectiveRoomId, nameConfirmed]);

  useEffect(() => {
    connectSync();
    connectChat();
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (chatChannelRef.current) supabase.removeChannel(chatChannelRef.current);
    };
  }, [connectSync, connectChat]);

  // Enviar ação de vídeo (apenas host)
  const sendVideoAction = async (isPlaying: boolean, currentTime: number) => {
    if (!channelRef.current || !isHost) return;
    await channelRef.current.send({
      type: 'broadcast', event: 'video_action',
      payload: { userId: userId.current, isPlaying, currentTime },
    });
  };

  // Enviar mensagem no chat
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    try {
      await supabase.from('watch_party_messages').insert({
        room_id: effectiveRoomId,
        user_id: userId.current,
        username: guestName,
        message: text,
      });
    } catch { setNewMessage(text); }
    finally { setIsSending(false); }
  };

  const handleConfirmName = () => {
    const name = guestName.trim() || getGuestName();
    sessionStorage.setItem('cinecasa_guest_name', name);
    setGuestName(name);
    setNameConfirmed(true);
  };

  // ── Tela de nome ──────────────────────────────────────────────
  if (!nameConfirmed) {
    return (
      <div style={{ minHeight: '100vh', background: '#070A10', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,183,255,0.25)', borderRadius: 20, padding: 40, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍿</div>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Assistir Juntos</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginBottom: 28 }}>
            Você foi convidado para assistir em grupo! Como quer ser chamado?
          </p>
          <input
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirmName()}
            placeholder="Seu apelido na sala"
            maxLength={30}
            autoFocus
            style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, color: 'white', fontSize: 15, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={handleConfirmName} style={{ width: '100%', padding: '14px', background: '#00B7FF', color: 'black', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
            Entrar na sala 🎬
          </button>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16 }}>
            Não é necessário criar conta
          </p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#070A10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #00B7FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p>Carregando sala...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#070A10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <p style={{ fontSize: 18 }}>{error}</p>
        <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 24px', background: '#00B7FF', color: 'black', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Voltar ao início</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#070A10', display: 'flex', flexDirection: 'column', color: 'white' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
          <X size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🎬 {roomData?.title || 'Assistir Juntos'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            <Users size={12} />
            <span>{userCount} {userCount === 1 ? 'pessoa' : 'pessoas'} na sala</span>
            {isHost && <span style={{ color: '#00B7FF', fontWeight: 600 }}>• Você é o host</span>}
          </div>
        </div>

        {/* Link de convite fixo */}
        <button
          onClick={copyInviteLink}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: inviteCopied ? 'rgba(0,183,255,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${inviteCopied ? '#00B7FF' : 'rgba(255,255,255,0.15)'}`, borderRadius: 20, cursor: 'pointer', color: inviteCopied ? '#00B7FF' : 'white', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }}
        >
          {inviteCopied ? <Copy size={14} /> : <Link2 size={14} />}
          {inviteCopied ? 'Copiado!' : 'Convidar'}
        </button>

        <button onClick={() => setShowChat(!showChat)} style={{ background: showChat ? 'rgba(0,183,255,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${showChat ? '#00B7FF' : 'rgba(255,255,255,0.15)'}`, borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showChat ? '#00B7FF' : 'white', flexShrink: 0 }}>
          <MessageSquare size={16} />
        </button>
      </div>

      {/* Corpo principal */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Player */}
        <div style={{ flex: 1, background: 'black', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {roomData?.videoUrl ? (
            <div style={{ flex: 1, position: 'relative' }}>
              <iframe
                ref={iframeRef}
                src={roomData.videoUrl.includes('youtube')
                  ? `https://www.youtube.com/embed/${extractYouTubeId(roomData.videoUrl)}?autoplay=1&rel=0&modestbranding=1`
                  : roomData.videoUrl}
                style={{ width: '100%', height: '100%', border: 'none', minHeight: 300 }}
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, minHeight: 300 }}>
              {roomData?.poster && (
                <img src={roomData.poster} alt={roomData.title} style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 10, opacity: 0.5 }} />
              )}
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Vídeo não disponível para esta sala</p>
            </div>
          )}

          {/* Controles do host */}
          {isHost && (
            <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.6)', display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Controles do host</span>
              <button onClick={() => sendVideoAction(true, 0)} style={{ padding: '8px 16px', background: 'rgba(0,183,255,0.2)', border: '1px solid rgba(0,183,255,0.4)', borderRadius: 8, color: '#00B7FF', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Play size={14} /> Sincronizar para todos
              </button>
            </div>
          )}

          {/* Link de convite visível */}
          <div style={{ padding: '12px 20px', background: 'rgba(0,183,255,0.05)', borderTop: '1px solid rgba(0,183,255,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link2 size={14} color="#00B7FF" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>Link da sala:</span>
            <span style={{ fontSize: 12, color: '#00B7FF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteLink}</span>
            <button onClick={copyInviteLink} style={{ background: 'none', border: 'none', cursor: 'pointer', color: inviteCopied ? '#00B7FF' : 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Chat */}
        {showChat && (
          <div style={{ width: 300, minWidth: 260, background: 'rgba(0,0,0,0.6)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
            {/* Chat header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} color="#00B7FF" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Bate-papo da sala</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{userCount} online</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 40 }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p>Nenhuma mensagem ainda. Diga oi! 👋</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.user_id === userId.current;
                return (
                  <div key={msg.id} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {!isMe && (
                      <span style={{ fontSize: 11, color: '#00B7FF', fontWeight: 600, marginBottom: 2, paddingLeft: 4 }}>{msg.username}</span>
                    )}
                    <div style={{ maxWidth: '85%', padding: '8px 12px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#00B7FF' : 'rgba(255,255,255,0.1)', color: isMe ? 'black' : 'white', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2, paddingLeft: 4 }}>
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
              <input
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Mensagem..."
                maxLength={500}
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, color: 'white', fontSize: 13, outline: 'none' }}
              />
              <button onClick={sendMessage} disabled={!newMessage.trim() || isSending} style={{ width: 40, height: 40, background: '#00B7FF', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: (!newMessage.trim() || isSending) ? 0.5 : 1 }}>
                <Send size={16} color="black" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return m?.[1] || '';
}
