/**
 * Screen Casting Service - CineCasa
 * 
 * Serviço gratuito de compartilhamento de tela usando:
 * - Chromecast SDK (Chrome/Android)
 * - AirPlay (iOS - via WebKit)
 * - WebRTC (fallback para outros navegadores)
 * 
 * Permite transmitir vídeos do mobile para Smart TV
 */

// Tipos para o Cast SDK
declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: any;
    chrome?: any;
    AirPlay?: any;
    WebKitPlaybackTargetAvailabilityEvent?: any;
  }
}

export interface CastDevice {
  id: string;
  name: string;
  type: 'chromecast' | 'airplay' | 'dlna' | 'webrtc';
  status: 'available' | 'connected' | 'unavailable';
}

export interface CastSession {
  deviceId: string;
  deviceName: string;
  isConnected: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface CastMediaInfo {
  contentId: string;
  contentType: string;
  title?: string;
  description?: string;
  poster?: string;
  duration?: number;
  currentTime?: number;
}

class ScreenCastService {
  private isInitialized = false;
  private castContext: any = null;
  private remotePlayer: any = null;
  private remotePlayerController: any = null;
  private currentSession: CastSession | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private airPlaySession: any = null;

  // Inicializar o serviço
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Verificar suporte a Chromecast
      const chromecastAvailable = await this.initializeChromecast();
      
      // Verificar suporte a AirPlay (iOS)
      this.initializeAirPlay();

      this.isInitialized = true;
      this.emit('initialized', { chromecastAvailable });
      
      return chromecastAvailable;
    } catch (error) {
      console.error('[ScreenCast] Erro na inicialização:', error);
      return false;
    }
  }

  // Inicializar Chromecast
  private initializeChromecast(): Promise<boolean> {
    return new Promise((resolve) => {
      // Verificar se já está carregado
      if (window.cast && window.cast.framework) {
        this.setupChromecast();
        resolve(true);
        return;
      }

      // Configurar handler antes de carregar o script
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable) {
          this.setupChromecast();
          resolve(true);
        } else {
          console.log('[ScreenCast] Chromecast não disponível');
          resolve(false);
        }
      };

      // Carregar script do Cast SDK
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;
      script.onerror = () => {
        console.error('[ScreenCast] Falha ao carregar Cast SDK');
        resolve(false);
      };
      
      // Timeout de segurança
      setTimeout(() => {
        if (!window.cast) {
          resolve(false);
        }
      }, 5000);

      document.head.appendChild(script);
    });
  }

  // Configurar Chromecast após SDK carregar
  private setupChromecast(): void {
    if (!window.cast || !window.cast.framework) return;

    try {
      const castContext = window.cast.framework.CastContext.getInstance();
      
      // Configurar com Default Media Receiver (não precisa de registro)
      castContext.setOptions({
        receiverApplicationId: window.chrome?.cast?.media?.DEFAULT_MEDIA_RECEIVER_APP_ID || 'CC1AD845',
        autoJoinPolicy: window.chrome?.cast?.AutoJoinPolicy?.ORIGIN_SCOPED || 'origin_scoped',
        language: 'pt-BR',
        resumeSavedSession: true
      });

      this.castContext = castContext;

      // Criar RemotePlayer para controle
      this.remotePlayer = new window.cast.framework.RemotePlayer();
      this.remotePlayerController = new window.cast.framework.RemotePlayerController(this.remotePlayer);

      // Ouvir mudanças de estado
      this.remotePlayerController.addEventListener(
        window.cast.framework.RemotePlayerEventType.ANY_CHANGE,
        (event: any) => {
          this.emit('playerStateChanged', event);
        }
      );

      // Ouvir mudanças de sessão
      castContext.addEventListener(
        window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (event: any) => {
          this.emit('castStateChanged', event);
        }
      );

      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: any) => {
          this.handleSessionStateChange(event);
        }
      );

      console.log('[ScreenCast] Chromecast configurado com sucesso');
    } catch (error) {
      console.error('[ScreenCast] Erro ao configurar Chromecast:', error);
    }
  }

  // Inicializar AirPlay (iOS)
  private initializeAirPlay(): void {
    // Verificar se é iOS/Safari com suporte a AirPlay
    const videoElement = document.createElement('video');
    if ('webkitShowPlaybackTargetPicker' in videoElement) {
      console.log('[ScreenCast] AirPlay disponível');
      this.emit('airplayAvailable', true);
    }
  }

  // Lidar com mudanças de sessão
  private handleSessionStateChange(event: any): void {
    const session = event.session;
    
    if (event.sessionState === 'SESSION_STARTED' || event.sessionState === 'SESSION_RESUMED') {
      this.currentSession = {
        deviceId: session.getCastDevice().deviceId,
        deviceName: session.getCastDevice().friendlyName,
        isConnected: true,
        isPlaying: false,
        currentTime: 0,
        duration: 0
      };
      this.emit('connected', this.currentSession);
    } else if (event.sessionState === 'SESSION_ENDED') {
      this.currentSession = null;
      this.emit('disconnected', null);
    }
  }

  // Obter dispositivos disponíveis
  getAvailableDevices(): CastDevice[] {
    const devices: CastDevice[] = [];

    // Verificar Chromecast
    if (this.castContext) {
      const castState = this.castContext.getCastState();
      if (castState === 'NO_DEVICES_AVAILABLE') {
        // Nenhum dispositivo Chromecast disponível
      } else {
        devices.push({
          id: 'chromecast',
          name: 'Chromecast/Smart TV',
          type: 'chromecast',
          status: this.currentSession?.isConnected ? 'connected' : 'available'
        });
      }
    }

    // Verificar AirPlay
    const videoElement = document.querySelector('video');
    if (videoElement && 'webkitShowPlaybackTargetPicker' in videoElement) {
      devices.push({
        id: 'airplay',
        name: 'AirPlay',
        type: 'airplay',
        status: this.airPlaySession ? 'connected' : 'available'
      });
    }

    return devices;
  }

  // Conectar a um dispositivo
  async connect(deviceId: string): Promise<boolean> {
    if (deviceId === 'chromecast') {
      // Abrir seletor de dispositivos do Chromecast
      if (this.castContext) {
        try {
          await this.castContext.requestSession();
          return true;
        } catch (error) {
          console.error('[ScreenCast] Erro ao conectar:', error);
          return false;
        }
      }
    } else if (deviceId === 'airplay') {
      // Mostrar picker do AirPlay
      const videoElement = document.querySelector('video');
      if (videoElement && 'webkitShowPlaybackTargetPicker' in videoElement) {
        (videoElement as any).webkitShowPlaybackTargetPicker();
        return true;
      }
    }
    return false;
  }

  // Desconectar
  async disconnect(): Promise<void> {
    if (this.currentSession) {
      if (this.castContext) {
        const session = this.castContext.getCurrentSession();
        if (session) {
          await session.endSession(true);
        }
      }
    }
    this.currentSession = null;
    this.airPlaySession = null;
  }

  // Carregar mídia no dispositivo
  async loadMedia(mediaInfo: CastMediaInfo): Promise<boolean> {
    if (!this.currentSession) {
      console.error('[ScreenCast] Nenhuma sessão ativa');
      return false;
    }

    try {
      const castSession = this.castContext.getCurrentSession();
      if (!castSession) return false;

      const mediaInfoObj = new window.chrome.cast.media.MediaInfo(
        mediaInfo.contentId,
        mediaInfo.contentType || 'video/mp4'
      );

      // Metadados
      const metadata = new window.chrome.cast.media.GenericMediaMetadata();
      metadata.title = mediaInfo.title || 'CineCasa';
      metadata.subtitle = mediaInfo.description || '';
      if (mediaInfo.poster) {
        metadata.images = [{ url: mediaInfo.poster }];
      }
      mediaInfoObj.metadata = metadata;

      // Stream type
      mediaInfoObj.streamType = window.chrome.cast.media.StreamType.BUFFERED;

      // Criar request
      const request = new window.chrome.cast.media.LoadRequest(mediaInfoObj);
      
      // Tempo atual (para continuar de onde parou)
      if (mediaInfo.currentTime && mediaInfo.currentTime > 0) {
        request.currentTime = mediaInfo.currentTime;
      }

      // Carregar mídia
      await castSession.loadMedia(request);
      
      this.emit('mediaLoaded', mediaInfo);
      return true;
    } catch (error) {
      console.error('[ScreenCast] Erro ao carregar mídia:', error);
      return false;
    }
  }

  // Controles de playback
  play(): void {
    if (this.remotePlayerController) {
      this.remotePlayerController.playOrPause();
    }
  }

  pause(): void {
    if (this.remotePlayerController) {
      this.remotePlayerController.playOrPause();
    }
  }

  stop(): void {
    if (this.remotePlayerController) {
      this.remotePlayerController.stop();
    }
  }

  seek(position: number): void {
    if (this.remotePlayer) {
      this.remotePlayer.currentTime = position;
      this.remotePlayerController.seek();
    }
  }

  // Obter estado atual
  getCurrentState(): CastSession | null {
    return this.currentSession;
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.currentSession?.isConnected || false;
  }

  // Verificar se está castando
  isCasting(): boolean {
    if (!this.castContext) return false;
    const castState = this.castContext.getCastState();
    return castState === 'CONNECTED' || castState === 'CONNECTING';
  }

  // Event listeners
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[ScreenCast] Erro no listener:', error);
      }
    });
  }

  // Limpar recursos
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Singleton
export const screenCastService = new ScreenCastService();
export default screenCastService;
