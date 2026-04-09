import { useState, useEffect, useCallback } from 'react';

interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface BeforeInstallPromptEvent extends InstallPromptEvent {
  readonly platforms: string[];
}

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

interface PWAInfo {
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  canShare: boolean;
  canInstall: boolean;
}

export function usePWA() {
  const [pwaInfo, setPwaInfo] = useState<PWAInfo>({
    isInstalled: false,
    isStandalone: false,
    isOnline: navigator.onLine,
    installPrompt: null,
    canShare: 'share' in navigator,
    canInstall: false,
  });

  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed' | 'dismissed'>('idle');

  // Verificar se está rodando como PWA instalada
  const checkIsInstalled = useCallback(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://');
    
    const isInstalled = isStandalone || 
                       window.matchMedia('(display-mode: minimal-ui)').matches;

    setPwaInfo(prev => ({
      ...prev,
      isInstalled,
      isStandalone,
    }));

    return isInstalled;
  }, []);

  // Verificar se pode instalar
  const checkCanInstall = useCallback(() => {
    const canInstall = !pwaInfo.isInstalled && 
                       !pwaInfo.isStandalone &&
                       'serviceWorker' in navigator &&
                       'PushManager' in window;

    setPwaInfo(prev => ({
      ...prev,
      canInstall,
    }));

    return canInstall;
  }, [pwaInfo.isInstalled, pwaInfo.isStandalone]);

  // Capturar evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      
      setPwaInfo(prev => ({
        ...prev,
        installPrompt: promptEvent,
        canInstall: true,
      }));

      // Mostrar prompt automaticamente após 3 segundos
      setTimeout(() => {
        if (!pwaInfo.isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    const handleAppInstalled = () => {
      setPwaInfo(prev => ({
        ...prev,
        isInstalled: true,
        isStandalone: true,
        installPrompt: null,
        canInstall: false,
      }));
      setInstallStatus('installed');
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [pwaInfo.isInstalled]);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setPwaInfo(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPwaInfo(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar status inicial
  useEffect(() => {
    checkIsInstalled();
    checkCanInstall();
  }, [checkIsInstalled, checkCanInstall]);

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (!pwaInfo.installPrompt || !pwaInfo.canInstall) {
      return false;
    }

    try {
      setInstallStatus('installing');
      await pwaInfo.installPrompt.prompt();
      
      const choiceResult = await pwaInfo.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setInstallStatus('installed');
        setPwaInfo(prev => ({
          ...prev,
          isInstalled: true,
          installPrompt: null,
          canInstall: false,
        }));
      } else {
        setInstallStatus('dismissed');
      }
      
      setShowInstallPrompt(false);
      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
      setInstallStatus('idle');
      return false;
    }
  }, [pwaInfo.installPrompt, pwaInfo.canInstall]);

  // Compartilhar conteúdo
  const shareContent = useCallback(async (data: ShareData) => {
    if (!pwaInfo.canShare) {
      // Fallback para navegadores sem suporte
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        return { success: true, method: 'clipboard' };
      }
      return { success: false, error: 'Share API not supported' };
    }

    try {
      await navigator.share(data);
      return { success: true, method: 'share-api' };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'User cancelled share' };
      }
      console.error('Erro ao compartilhar:', error);
      return { success: false, error: error.message };
    }
  }, [pwaInfo.canShare]);

  // Compartilhar filme/série
  const shareMovie = useCallback(async (movie: {
    title: string;
    description: string;
    url: string;
    poster?: string;
  }) => {
    const shareData: ShareData = {
      title: movie.title,
      text: `Estou assistindo "${movie.title}" no CineCasa! 🎬`,
      url: movie.url,
    };

    return await shareContent(shareData);
  }, [shareContent]);

  // Solicitar notificações
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Mostrar notificação
  const showNotification = useCallback((
    title: string,
    options?: NotificationOptions & {
      actions?: NotificationAction[];
      tag?: string;
      requireInteraction?: boolean;
    }
  ) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options,
      });

      // Auto-fechar após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
    return null;
  }, []);

  // Adicionar à tela inicial
  const addToHomeScreen = useCallback(() => {
    if (pwaInfo.installPrompt) {
      return installPWA();
    }
    return false;
  }, [pwaInfo.installPrompt, installPWA]);

  // Verificar suporte a funcionalidades
  const getCapabilities = useCallback(() => ({
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notifications: 'Notification' in window,
    shareAPI: 'share' in navigator,
    clipboardAPI: 'clipboard' in navigator,
    storageAPI: 'storage' in navigator,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator,
    microphone: 'mediaDevices' in navigator,
    fullscreen: 'fullscreen' in document,
    wakeLock: 'wakeLock' in navigator,
    screenOrientation: 'screen' in window && 'orientation' in window.screen,
    vibration: 'vibrate' in navigator,
    bluetooth: 'bluetooth' in navigator,
    wifi: 'connection' in navigator,
  }), []);

  // Obter informações do dispositivo
  const getDeviceInfo = useCallback(() => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints,
    vendor: navigator.vendor,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isTablet: /iPad|Android(?!.*Mobile)|Tablet/i.test(navigator.userAgent),
    isDesktop: !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
  }), []);

  // Limpar cache
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        return { success: true };
      } catch (error) {
        console.error('Erro ao limpar cache:', error);
        return { success: false, error };
      }
    }
    return { success: false, error: 'Cache API not supported' };
  }, []);

  // Forçar atualização
  const forceUpdate = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.update();
        });
      });
    }
    
    // Recarregar página
    window.location.reload();
  }, []);

  return {
    // Estado
    pwaInfo,
    showInstallPrompt,
    installStatus,
    
    // Ações
    installPWA,
    shareContent,
    shareMovie,
    requestNotificationPermission,
    showNotification,
    addToHomeScreen,
    clearCache,
    forceUpdate,
    
    // Utilitários
    checkIsInstalled,
    checkCanInstall,
    getCapabilities,
    getDeviceInfo,
    
    // Controle do prompt
    showInstallPrompt: () => setShowInstallPrompt(true),
    hideInstallPrompt: () => setShowInstallPrompt(false),
    
    // Estados derivados
    isInstallable: pwaInfo.canInstall && !pwaInfo.isInstalled,
    isShareable: pwaInfo.canShare,
    isOffline: !pwaInfo.isOnline,
    hasServiceWorker: getCapabilities().serviceWorker,
  };
}
