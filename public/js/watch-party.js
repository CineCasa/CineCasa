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
    
    // Conecta ao servidor Socket.IO
    this.connect();
  }
  
  /**
   * Conecta ao servidor Socket.IO
   */
  connect() {
    // URL do servidor (ajustar conforme necessário)
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : window.location.origin;
    
    console.log(`[WatchParty] Conectando ao servidor: ${serverUrl}`);
    
    // Inicializa Socket.IO
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    // Configura eventos do Socket.IO
    this.setupSocketEvents();
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
  setupVideoEvents() {
    // ----------------------------------------
    // EVENTO: Play local
    // ----------------------------------------
    this.videoElement.addEventListener('play', () => {
      // Ignora se for atualização remota ou se devemos ignorar este evento
      if (this.isRemoteUpdate || this.ignoreNextPlay) return;
      
      console.log('[WatchParty] Evento PLAY local - enviando para sala');
      
      this.socket.emit('video-play', {
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
      
      this.socket.emit('video-pause', {
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
      
      this.socket.emit('video-seek', {
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
    
    // Envia estado atual a cada 5 segundos
    this.syncInterval = setInterval(() => {
      if (!this.socket || !this.roomId) return;
      
      this.socket.emit('sync-broadcast', {
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
