/**
 * Cliente Watch Party - Sincronização de Vídeo via Socket.IO
 * 
 * Funcionalidades:
 * - Conectar ao servidor Socket.IO
 * - Entrar em sala com ID único
 * - Sincronizar play/pause/seek com outros usuários
 * - Sincronização periódica a cada 5 segundos
 * - Mecanismo anti-loop de eventos
 */

class WatchPartyClient {
  constructor() {
    // Configuração do Socket.IO
    this.socket = null;
    this.roomId = null;
    this.videoUrl = null;
    this.userId = null;
    
    // Referência ao elemento de vídeo
    this.videoElement = null;
    
    // Flags para controle de eventos (anti-loop)
    this.isRemoteUpdate = false;  // true quando atualização vem de outro usuário
    this.ignoreNextPlay = false;
    this.ignoreNextPause = false;
    this.ignoreNextSeek = false;
    
    // Controle de sincronização
    this.lastSyncTime = 0;
    this.syncInterval = null;
    this.userCount = 0;
    
    // Callbacks para UI
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onSyncUpdate = null;
    
    // Inicializa quando DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  
  /**
   * Inicializa o cliente Watch Party
   */
  init() {
    console.log('[WatchParty] Inicializando cliente...');
    
    // Obtém referência ao elemento de vídeo
    this.videoElement = document.getElementById('watch-party-video');
    if (!this.videoElement) {
      console.error('[WatchParty] Elemento de vídeo não encontrado!');
      return;
    }
    
    // Obtém roomId da URL
    const urlParams = new URLSearchParams(window.location.search);
    this.roomId = urlParams.get('room');
    this.videoUrl = urlParams.get('video');
    
    if (!this.roomId) {
      console.error('[WatchParty] Room ID não fornecido na URL!');
      this.showError('ID da sala não fornecido. Crie uma sala primeiro.');
      return;
    }
    
    // Detecta ambiente
    const isProduction = window.location.hostname.includes('vercel.app') || 
                         window.location.hostname.includes('pages.dev') ||
                         window.location.hostname.includes('netlify.app');
    
    if (isProduction) {
      console.log('[WatchParty] Ambiente de produção detectado. Usando Supabase Realtime...');
      this.connectSupabase();
    } else {
      // Desenvolvimento: tenta Socket.IO primeiro, fallback para Supabase
      console.log('[WatchParty] Desenvolvimento. Tentando Socket.IO...');
      this.connect();
    }
  }
  
  /**
   * Conecta ao servidor Socket.IO
   */
  connect() {
    // Detecta a URL do servidor automaticamente
    // Prioridade: 1) Variável global, 2) Mesma origem, 3) localhost:3001
    const serverUrl = window.WATCH_PARTY_SERVER_URL || 
      (window.location.port === '3001' ? window.location.origin : null) ||
      (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);
    
    console.log(`[WatchParty] Conectando ao servidor: ${serverUrl}`);
    
    // Inicializa Socket.IO com configuração robusta
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: false
    });
    
    // Configura eventos do Socket.IO
    this.setupSocketEvents();
    
    // Timeout para ativar modo solo se não conectar
    setTimeout(() => {
      if (!this.socket.connected && !this.soloMode) {
        console.log('[WatchParty] Ativando modo solo para desenvolvimento local...');
        this.activateSoloMode();
      }
    }, 5000);
  }
  
  /**
   * Ativa modo solo para desenvolvimento sem servidor
   */
  activateSoloMode() {
    this.soloMode = true;
    this.userCount = 1;
    this.userId = 'solo-user-' + Math.random().toString(36).substring(2, 9);
    
    console.log('[WatchParty] Modo solo ativado. ID:', this.userId);
    
    // Configura vídeo se houver URL na query
    const urlParams = new URLSearchParams(window.location.search);
    const videoUrl = urlParams.get('video');
    if (videoUrl && this.videoElement) {
      this.videoElement.src = videoUrl;
    }
    
    // Configura eventos do player
    this.setupVideoEvents();
    
    // Atualiza UI
    this.updateUI(`Sala: ${this.roomId} | Modo Solo`);
    this.showToast('Assistir Juntos ativado em modo solo. Compartilhe o link para convidar amigos!');
    
    // Esconde erro de conexão se visível
    const errorEl = document.getElementById('wp-error');
    if (errorEl) errorEl.style.display = 'none';
  }
  
  /**
   * Conecta via Supabase Realtime (gratuito, funciona 24h)
   */
  async connectSupabase() {
    console.log('[WatchParty] Conectando via Supabase Realtime...');
    
    try {
      // Carrega o cliente Supabase (já deve estar no window do index.html)
      if (typeof window.supabase === 'undefined') {
        console.error('[WatchParty] Supabase não encontrado. Carregando script...');
        await this.loadSupabaseScript();
      }
      
      this.userId = 'user_' + Math.random().toString(36).substring(2, 9);
      
      // Criar canal para a sala
      const channel = window.supabase
        .channel('watch_party:' + this.roomId, {
          config: {
            broadcast: { self: false },
          },
        })
        .on('broadcast', { event: 'party_message' }, (payload) => {
          this.handleSupabaseMessage(payload.payload);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const count = Object.keys(state).length;
          this.userCount = count;
          this.updateUI(`Sala: ${this.roomId} | ${count} usuário(s)`);
        })
        .on('presence', { event: 'join' }, () => {
          this.showToast('Novo participante entrou!');
        })
        .on('presence', { event: 'leave' }, () => {
          this.showToast('Um participante saiu');
        });
      
      // Inscrever no canal
      const status = await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[WatchParty] Conectado ao Supabase!');
          this.supabaseChannel = channel;
          
          // Entrar com presence
          await channel.track({
            userId: this.userId,
            joinedAt: new Date().toISOString(),
          });
          
          // Enviar mensagem de entrada
          await channel.send({
            type: 'broadcast',
            event: 'party_message',
            payload: {
              type: 'join',
              userId: this.userId,
              roomId: this.roomId,
              timestamp: Date.now(),
            },
          });
          
          this.updateUI(`Sala: ${this.roomId} | Conectado`);
          this.showToast('Assistir Juntos ativo! Compartilhe o link.');
          
          // Esconde erro
          const errorEl = document.getElementById('wp-error');
          if (errorEl) errorEl.style.display = 'none';
          
          // Configura eventos do player
          this.setupVideoEvents();
        }
      });
      
    } catch (error) {
      console.error('[WatchParty] Erro Supabase:', error);
      // Fallback para modo solo
      this.activateSoloMode();
    }
  }
  
  /**
   * Carrega script do Supabase se necessário
   */
  loadSupabaseScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = () => {
        // Inicializa com as credenciais do projeto
        window.supabase = window.supabase.createClient(
          'https://eqhstnlsmfrwxhvcwoid.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaHN0bmxzbWZyd3hodmN3b2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg1NTcsImV4cCI6MjA4ODI5NDU1N30.6AmJi7zs-1QDnStIIN5bJGoFFhv4WveC1NUAHKI0Qlo'
        );
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  /**
   * Manipula mensagens do Supabase
   */
  handleSupabaseMessage(message) {
    if (message.userId === this.userId) return; // Ignorar próprias mensagens
    
    console.log('[WatchParty] Mensagem recebida:', message.type);
    
    switch (message.type) {
      case 'play':
        this.isRemoteUpdate = true;
        this.videoElement.play();
        break;
        
      case 'pause':
        this.isRemoteUpdate = true;
        this.videoElement.pause();
        break;
        
      case 'seek':
        this.isRemoteUpdate = true;
        this.ignoreNextSeek = true;
        this.videoElement.currentTime = message.data.currentTime;
        break;
        
      case 'sync':
        const timeDiff = Math.abs(this.videoElement.currentTime - message.data.currentTime);
        if (timeDiff > 2) { // Sincroniza se diferença > 2 segundos
          this.isRemoteUpdate = true;
          this.videoElement.currentTime = message.data.currentTime;
        }
        if (message.data.isPlaying && this.videoElement.paused) {
          this.videoElement.play();
        } else if (!message.data.isPlaying && !this.videoElement.paused) {
          this.videoElement.pause();
        }
        break;
    }
  }
  
  /**
   * Configura todos os eventos do Socket.IO
   */
  setupSocketEvents() {
    // ----------------------------------------
    // EVENTO: Conexão estabelecida
    // ----------------------------------------
    this.socket.on('connect', () => {
      console.log(`[WatchParty] Conectado! Socket ID: ${this.socket.id}`);
      this.userId = this.socket.id;
      
      // Entra na sala
      this.joinRoom();
    });
    
    // ----------------------------------------
    // EVENTO: Erro de conexão
    // ----------------------------------------
    this.socket.on('connect_error', (error) => {
      console.error('[WatchParty] Erro de conexão:', error);
      this.showError('Erro ao conectar ao servidor. Tentando reconectar...');
    });
    
    // ----------------------------------------
    // EVENTO: Entrou na sala com sucesso
    // ----------------------------------------
    this.socket.on('room-joined', (data) => {
      console.log('[WatchParty] Entrou na sala:', data);
      
      this.userCount = data.userCount;
      
      // Configura URL do vídeo
      const videoSource = this.videoUrl || data.videoUrl;
      if (videoSource && this.videoElement.src !== videoSource) {
        this.videoElement.src = videoSource;
      }
      
      // Configura estado inicial do vídeo
      if (data.currentTime > 0) {
        this.isRemoteUpdate = true;
        this.videoElement.currentTime = data.currentTime;
        this.isRemoteUpdate = false;
      }
      
      if (data.isPlaying) {
        this.isRemoteUpdate = true;
        this.videoElement.play().catch(e => console.log('Autoplay prevented:', e));
        this.isRemoteUpdate = false;
      }
      
      // Inicia sincronização periódica
      this.startPeriodicSync();
      
      // Configura eventos do player de vídeo
      this.setupVideoEvents();
      
      // Atualiza UI
      this.updateUI(`Sala: ${data.roomId} | Usuários: ${data.userCount}`);
      
      if (this.onUserJoined) {
        this.onUserJoined(data);
      }
    });
    
    // ----------------------------------------
    // EVENTO: Novo usuário entrou na sala
    // ----------------------------------------
    this.socket.on('user-joined', (data) => {
      console.log(`[WatchParty] Novo usuário entrou: ${data.userId}`);
      this.userCount = data.userCount;
      this.updateUI(`Usuários na sala: ${this.userCount}`);
      
      if (this.onUserJoined) {
        this.onUserJoined(data);
      }
    });
    
    // ----------------------------------------
    // EVENTO: Usuário saiu da sala
    // ----------------------------------------
    this.socket.on('user-left', (data) => {
      console.log(`[WatchParty] Usuário saiu: ${data.userId}`);
      this.userCount = data.userCount;
      this.updateUI(`Usuários na sala: ${this.userCount}`);
      
      if (this.onUserLeft) {
        this.onUserLeft(data);
      }
    });
    
    // ----------------------------------------
    // EVENTO: Recebeu comando de PLAY (de outro usuário)
    // ----------------------------------------
    this.socket.on('video-play', (data) => {
      console.log(`[WatchParty] Recebido PLAY - tempo: ${data.currentTime}s`);
      
      // Marca como atualização remota (evita loop)
      this.isRemoteUpdate = true;
      this.ignoreNextPlay = true;
      
      // Sincroniza tempo se diferença for maior que 2 segundos
      const timeDiff = Math.abs(this.videoElement.currentTime - data.currentTime);
      if (timeDiff > 2) {
        this.videoElement.currentTime = data.currentTime;
      }
      
      // Executa play
      this.videoElement.play().catch(e => {
        console.log('[WatchParty] Erro ao dar play:', e);
      });
      
      // Reseta flag após breve delay
      setTimeout(() => {
        this.isRemoteUpdate = false;
        this.ignoreNextPlay = false;
      }, 100);
    });
    
    // ----------------------------------------
    // EVENTO: Recebeu comando de PAUSE (de outro usuário)
    // ----------------------------------------
    this.socket.on('video-pause', (data) => {
      console.log(`[WatchParty] Recebido PAUSE - tempo: ${data.currentTime}s`);
      
      // Marca como atualização remota (evita loop)
      this.isRemoteUpdate = true;
      this.ignoreNextPause = true;
      
      // Sincroniza tempo se diferença for maior que 2 segundos
      const timeDiff = Math.abs(this.videoElement.currentTime - data.currentTime);
      if (timeDiff > 2) {
        this.videoElement.currentTime = data.currentTime;
      }
      
      // Executa pause
      this.videoElement.pause();
      
      // Reseta flag após breve delay
      setTimeout(() => {
        this.isRemoteUpdate = false;
        this.ignoreNextPause = false;
      }, 100);
    });
    
    // ----------------------------------------
    // EVENTO: Recebeu comando de SEEK (de outro usuário)
    // ----------------------------------------
    this.socket.on('video-seek', (data) => {
      console.log(`[WatchParty] Recebido SEEK - novo tempo: ${data.currentTime}s`);
      
      // Marca como atualização remota (evita loop)
      this.isRemoteUpdate = true;
      this.ignoreNextSeek = true;
      
      // Atualiza tempo do vídeo
      this.videoElement.currentTime = data.currentTime;
      
      // Reseta flag após breve delay
      setTimeout(() => {
        this.isRemoteUpdate = false;
        this.ignoreNextSeek = false;
      }, 100);
    });
    
    // ----------------------------------------
    // EVENTO: Atualização de sincronização (broadcast periódico)
    // ----------------------------------------
    this.socket.on('sync-update', (data) => {
      // Ignora se estivermos interagindo com o vídeo
      if (this.isRemoteUpdate) return;
      
      const timeDiff = Math.abs(this.videoElement.currentTime - data.currentTime);
      
      // Só sincroniza se diferença for maior que 3 segundos (evita travamentos)
      if (timeDiff > 3) {
        console.log(`[WatchParty] Sincronizando tempo: ${this.videoElement.currentTime}s → ${data.currentTime}s`);
        
        this.isRemoteUpdate = true;
        this.videoElement.currentTime = data.currentTime;
        
        if (data.isPlaying && this.videoElement.paused) {
          this.videoElement.play().catch(() => {});
        } else if (!data.isPlaying && !this.videoElement.paused) {
          this.videoElement.pause();
        }
        
        setTimeout(() => {
          this.isRemoteUpdate = false;
        }, 100);
      }
      
      if (this.onSyncUpdate) {
        this.onSyncUpdate(data);
      }
    });
    
    // ----------------------------------------
    // EVENTO: Sincronização do servidor
    // ----------------------------------------
    this.socket.on('server-sync', (data) => {
      if (this.isRemoteUpdate) return;
      
      const timeDiff = Math.abs(this.videoElement.currentTime - data.currentTime);
      
      // Sincroniza se diferença for maior que 5 segundos
      if (timeDiff > 5) {
        console.log(`[WatchParty] Sincronização servidor: ${this.videoElement.currentTime}s → ${data.currentTime}s`);
        
        this.isRemoteUpdate = true;
        this.videoElement.currentTime = data.currentTime;
        setTimeout(() => {
          this.isRemoteUpdate = false;
        }, 100);
      }
    });
    
    // ----------------------------------------
    // EVENTO: Desconectado do servidor
    // ----------------------------------------
    this.socket.on('disconnect', (reason) => {
      console.log(`[WatchParty] Desconectado: ${reason}`);
      this.updateUI('Desconectado - Tentando reconectar...');
      this.stopPeriodicSync();
    });
  }
  
  /**
   * Entra na sala com o roomId atual
   */
  joinRoom() {
    if (!this.socket || !this.roomId) return;
    
    console.log(`[WatchParty] Entrando na sala: ${this.roomId}`);
    
    this.socket.emit('join-room', {
      roomId: this.roomId,
      videoUrl: this.videoUrl
    });
  }
  
  /**
   * Configura eventos do player de vídeo
   */
  /**
   * Envia mensagem para a sala (Socket.IO ou Supabase)
   */
  sendMessage(event, data) {
    // Se tem canal Supabase, usa ele
    if (this.supabaseChannel) {
      this.supabaseChannel.send({
        type: 'broadcast',
        event: 'party_message',
        payload: {
          type: event,
          userId: this.userId,
          roomId: this.roomId,
          timestamp: Date.now(),
          data,
        },
      });
      return;
    }
    
    // Se tem socket, usa Socket.IO
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
  
  setupVideoEvents() {
    // ----------------------------------------
    // EVENTO: Play local
    // ----------------------------------------
    this.videoElement.addEventListener('play', () => {
      // Ignora se for atualização remota ou se devemos ignorar este evento
      if (this.isRemoteUpdate || this.ignoreNextPlay) return;
      
      console.log('[WatchParty] Evento PLAY local - enviando para sala');
      
      // Em modo solo, não tenta enviar para o servidor
      if (this.soloMode) return;
      
      this.sendMessage('play', {
        currentTime: this.videoElement.currentTime
      });
    });
    
    // ----------------------------------------
    // EVENTO: Pause local
    // ----------------------------------------
    this.videoElement.addEventListener('pause', () => {
      // Ignora se for atualização remota ou se devemos ignorar este evento
      if (this.isRemoteUpdate || this.ignoreNextPause) return;
      
      console.log('[WatchParty] Evento PAUSE local - enviando para sala');
      
      // Em modo solo, não tenta enviar para o servidor
      if (this.soloMode) return;
      
      this.sendMessage('pause', {
        currentTime: this.videoElement.currentTime
      });
    });
    
    // ----------------------------------------
    // EVENTO: Seek local (mudança de tempo)
    // ----------------------------------------
    this.videoElement.addEventListener('seeked', () => {
      // Ignora se for atualização remota ou se devemos ignorar este evento
      if (this.isRemoteUpdate || this.ignoreNextSeek) return;
      
      console.log('[WatchParty] Evento SEEK local - enviando para sala');
      
      // Em modo solo, não tenta enviar para o servidor
      if (this.soloMode) return;
      
      this.sendMessage('seek', {
        currentTime: this.videoElement.currentTime
      });
    });
    
    // ----------------------------------------
    // EVENTO: Time update (para sincronização contínua)
    // ----------------------------------------
    this.videoElement.addEventListener('timeupdate', () => {
      this.lastSyncTime = this.videoElement.currentTime;
    });
  }
  
  /**
   * Inicia sincronização periódica (a cada 5 segundos)
   */
  startPeriodicSync() {
    // Limpa interval anterior se existir
    this.stopPeriodicSync();
    
    // Em modo solo, não inicia sincronização periódica
    if (this.soloMode) {
      console.log('[WatchParty] Modo solo - sincronização periódica desabilitada');
      return;
    }
    
    // Envia estado atual a cada 5 segundos
    this.syncInterval = setInterval(() => {
      if (this.soloMode) return;
      if (!this.socket && !this.supabaseChannel) return;
      if (!this.roomId) return;
      
      this.sendMessage('sync', {
        currentTime: this.videoElement.currentTime,
        isPlaying: !this.videoElement.paused
      });
    }, 5000);
    
    console.log('[WatchParty] Sincronização periódica iniciada (5s)');
  }
  
  /**
   * Para sincronização periódica
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[WatchParty] Sincronização periódica parada');
    }
  }
  
  /**
   * Atualiza elemento de UI com informações
   */
  updateUI(text) {
    const statusElement = document.getElementById('watch-party-status');
    if (statusElement) {
      statusElement.textContent = text;
    }
  }
  
  /**
   * Mostra mensagem de erro
   */
  showError(message) {
    console.error('[WatchParty] Erro:', message);
    
    const errorElement = document.getElementById('watch-party-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    
    // Também mostra em alert se não houver elemento
    if (!errorElement) {
      alert(message);
    }
  }
  
  /**
   * Mostra toast/notification temporário
   */
  showToast(message) {
    console.log('[WatchParty] Toast:', message);
    
    // Cria elemento toast se não existir
    let toastEl = document.getElementById('wp-toast');
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'wp-toast';
      toastEl.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #22c55e; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; font-family: sans-serif; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: opacity 0.3s;';
      document.body.appendChild(toastEl);
    }
    
    toastEl.textContent = message;
    toastEl.style.opacity = '1';
    
    // Esconde após 3 segundos
    setTimeout(() => {
      toastEl.style.opacity = '0';
    }, 3000);
  }
  
  /**
   * Obtém link da sala atual para compartilhar
   */
  getShareLink() {
    if (!this.roomId) return null;
    
    const url = new URL(window.location.href);
    url.searchParams.set('room', this.roomId);
    if (this.videoUrl) {
      url.searchParams.set('video', this.videoUrl);
    }
    
    return url.toString();
  }
  
  /**
   * Copia link da sala para clipboard
   */
  async copyShareLink() {
    const link = this.getShareLink();
    if (!link) return false;
    
    try {
      await navigator.clipboard.writeText(link);
      console.log('[WatchParty] Link copiado:', link);
      return true;
    } catch (err) {
      console.error('[WatchParty] Erro ao copiar link:', err);
      return false;
    }
  }
  
  /**
   * Desconecta do servidor
   */
  disconnect() {
    this.stopPeriodicSync();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    console.log('[WatchParty] Cliente desconectado');
  }
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

// Cria instância global quando o script for carregado
let watchPartyClient = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    watchPartyClient = new WatchPartyClient();
  });
} else {
  watchPartyClient = new WatchPartyClient();
}

// Expõe instância globalmente para debug e acesso externo
window.watchParty = watchPartyClient;
window.WatchPartyClient = WatchPartyClient;

console.log('[WatchParty] Cliente carregado e pronto');
