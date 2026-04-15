import { useState, useEffect, useCallback, useRef } from 'react';
import screenCastService, { CastDevice, CastSession, CastMediaInfo } from '@/services/screenCastService';

interface UseScreenCastReturn {
  isAvailable: boolean;
  isInitialized: boolean;
  devices: CastDevice[];
  currentSession: CastSession | null;
  isConnected: boolean;
  isCasting: boolean;
  connect: (deviceId: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  loadMedia: (mediaInfo: CastMediaInfo) => Promise<boolean>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  error: string | null;
}

export function useScreenCast(): UseScreenCastReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [devices, setDevices] = useState<CastDevice[]>([]);
  const [currentSession, setCurrentSession] = useState<CastSession | null>(null);
  const [isCasting, setIsCasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar serviço
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const available = await screenCastService.initialize();
        if (isMounted) {
          setIsAvailable(available);
          setIsInitialized(true);
          updateDevices();
        }
      } catch (err) {
        if (isMounted) {
          setError('Erro ao inicializar screen cast');
          setIsInitialized(true);
        }
      }
    };

    init();

    // Configurar listeners
    const handleConnected = (session: CastSession) => {
      if (isMounted) {
        setCurrentSession(session);
        setIsCasting(true);
        updateDevices();
      }
    };

    const handleDisconnected = () => {
      if (isMounted) {
        setCurrentSession(null);
        setIsCasting(false);
        updateDevices();
      }
    };

    const handleStateChange = () => {
      if (isMounted) {
        setIsCasting(screenCastService.isCasting());
        updateDevices();
      }
    };

    screenCastService.on('connected', handleConnected);
    screenCastService.on('disconnected', handleDisconnected);
    screenCastService.on('castStateChanged', handleStateChange);

    // Atualizar dispositivos periodicamente
    intervalRef.current = setInterval(() => {
      if (isMounted) {
        updateDevices();
      }
    }, 5000);

    return () => {
      isMounted = false;
      screenCastService.off('connected', handleConnected);
      screenCastService.off('disconnected', handleDisconnected);
      screenCastService.off('castStateChanged', handleStateChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Atualizar lista de dispositivos
  const updateDevices = useCallback(() => {
    const availableDevices = screenCastService.getAvailableDevices();
    setDevices(availableDevices);
  }, []);

  // Conectar a dispositivo
  const connect = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await screenCastService.connect(deviceId);
      if (!success) {
        setError('Não foi possível conectar ao dispositivo');
      }
      return success;
    } catch (err) {
      setError('Erro ao conectar ao dispositivo');
      return false;
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await screenCastService.disconnect();
      setCurrentSession(null);
      setIsCasting(false);
    } catch (err) {
      setError('Erro ao desconectar');
    }
  }, []);

  // Carregar mídia
  const loadMedia = useCallback(async (mediaInfo: CastMediaInfo): Promise<boolean> => {
    try {
      setError(null);
      return await screenCastService.loadMedia(mediaInfo);
    } catch (err) {
      setError('Erro ao carregar mídia');
      return false;
    }
  }, []);

  // Controles
  const play = useCallback(() => {
    screenCastService.play();
  }, []);

  const pause = useCallback(() => {
    screenCastService.pause();
  }, []);

  const stop = useCallback(() => {
    screenCastService.stop();
  }, []);

  const seek = useCallback((position: number) => {
    screenCastService.seek(position);
  }, []);

  return {
    isAvailable,
    isInitialized,
    devices,
    currentSession,
    isConnected: !!currentSession?.isConnected,
    isCasting,
    connect,
    disconnect,
    loadMedia,
    play,
    pause,
    stop,
    seek,
    error
  };
}

export default useScreenCast;
