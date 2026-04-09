import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerInfo {
  supported: boolean;
  enabled: boolean;
  controller: ServiceWorker | null;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  installing: boolean;
  lastUpdateCheck: number;
}

interface CacheInfo {
  name: string;
  url: string;
  size?: number;
  lastModified?: number;
}

export function useServiceWorker() {
  const [swInfo, setSwInfo] = useState<ServiceWorkerInfo>({
    supported: false,
    enabled: false,
    controller: null,
    registration: null,
    updateAvailable: false,
    installing: false,
    lastUpdateCheck: 0,
  });

  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);

  // Verificar suporte a Service Worker
  useEffect(() => {
    const supported = 'serviceWorker' in navigator;
    setSwInfo(prev => ({ ...prev, supported }));
  }, []);

  // Registrar Service Worker
  const registerSW = useCallback(async () => {
    if (!swInfo.supported) return false;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW] Service Worker registrado com sucesso:', registration);

      // Atualizar estado
      setSwInfo(prev => ({
        ...prev,
        enabled: true,
        registration,
        controller: registration.active,
      }));

      // Verificar atualizações
      registration.addEventListener('updatefound', handleUpdateFound);
      registration.addEventListener('controllerchange', handleControllerChange);

      // Verificar atualizações periodicamente
      checkForUpdates(registration);

      return true;
    } catch (error) {
      console.error('[SW] Erro ao registrar Service Worker:', error);
      return false;
    }
  }, [swInfo.supported]);

  // Lidar com atualização encontrada
  const handleUpdateFound = useCallback((registration: ServiceWorkerRegistration) => {
    console.log('[SW] Nova versão encontrada');
    
    const newWorker = registration.installing;
    if (newWorker) {
      setSwInfo(prev => ({ ...prev, installing: true }));

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          setSwInfo(prev => ({
            ...prev,
            updateAvailable: true,
            installing: false,
          }));
        }
      });
    }
  }, []);

  // Lidar com mudança de controller
  const handleControllerChange = useCallback(() => {
    setSwInfo(prev => ({
      ...prev,
      controller: navigator.serviceWorker.controller,
      updateAvailable: false,
    }));
  }, []);

  // Verificar atualizações
  const checkForUpdates = useCallback(async (registration?: ServiceWorkerRegistration) => {
    const reg = registration || swInfo.registration;
    if (!reg) return;

    try {
      await reg.update();
      setSwInfo(prev => ({
        ...prev,
        lastUpdateCheck: Date.now(),
      }));
    } catch (error) {
      console.error('[SW] Erro ao verificar atualizações:', error);
    }
  }, [swInfo.registration]);

  // Aplicar atualização
  const applyUpdate = useCallback(() => {
    if (!swInfo.updateAvailable) return;

    // Notificar Service Worker para pular espera
    if (swInfo.controller) {
      swInfo.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    // Recarregar página
    window.location.reload();
  }, [swInfo.updateAvailable, swInfo.controller]);

  // Obter informações do cache
  const getCacheInfo = useCallback(async () => {
    if (!('caches' in window)) return [];

    try {
      const cacheNames = await caches.keys();
      const cacheData: CacheInfo[] = [];

      for (const name of cacheNames) {
        try {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          let totalSize = 0;
          let lastModified = 0;

          for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
              // Estimar tamanho (aproximado)
              const clonedResponse = response.clone();
              const blob = await clonedResponse.blob();
              totalSize += blob.size;

              // Obter data de modificação
              const dateHeader = response.headers.get('date');
              if (dateHeader) {
                const modified = new Date(dateHeader).getTime();
                if (modified > lastModified) {
                  lastModified = modified;
                }
              }
            }
          }

          cacheData.push({
            name,
            url: name,
            size: totalSize,
            lastModified,
          });
        } catch (error) {
          console.error(`[SW] Erro ao obter info do cache ${name}:`, error);
        }
      }

      setCacheInfo(cacheData);
      return cacheData;
    } catch (error) {
      console.error('[SW] Erro ao obter informações do cache:', error);
      return [];
    }
  }, []);

  // Limpar cache específico
  const clearCache = useCallback(async (cacheName: string) => {
    if (!('caches' in window)) return false;

    try {
      await caches.delete(cacheName);
      console.log(`[SW] Cache ${cacheName} limpo com sucesso`);
      
      // Atualizar informações
      await getCacheInfo();
      return true;
    } catch (error) {
      console.error(`[SW] Erro ao limpar cache ${cacheName}:`, error);
      return false;
    }
  }, [getCacheInfo]);

  // Limpar todos os caches
  const clearAllCaches = useCallback(async () => {
    if (!('caches' in window)) return false;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      console.log('[SW] Todos os caches limpos com sucesso');
      setCacheInfo([]);
      return true;
    } catch (error) {
      console.error('[SW] Erro ao limpar todos os caches:', error);
      return false;
    }
  }, []);

  // Forçar sincronização
  const forceSync = useCallback(() => {
    if (!swInfo.controller) return;

    swInfo.controller.postMessage({ type: 'FORCE_SYNC' });
  }, [swInfo.controller]);

  // Enviar mensagem para Service Worker
  const sendMessage = useCallback((message: any) => {
    if (!swInfo.controller) return false;

    swInfo.controller.postMessage(message);
    return true;
  }, [swInfo.controller]);

  // Obter capacidade offline
  const getOfflineCapabilities = useCallback(() => {
    return {
      serviceWorker: swInfo.supported,
      cacheAPI: 'caches' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      sessionStorage: 'sessionStorage' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in ServiceWorker.prototype,
      pushNotifications: 'Notification' in window && 'PushManager' in window,
      shareAPI: 'share' in navigator,
      clipboardAPI: 'clipboard' in navigator,
      wakeLock: 'wakeLock' in navigator,
      screenOrientation: 'screen' in window && 'orientation' in window.screen,
      vibration: 'vibrate' in navigator,
      geolocation: 'geolocation' in navigator,
      camera: 'mediaDevices' in navigator,
      microphone: 'mediaDevices' in navigator,
      bluetooth: 'bluetooth' in navigator,
      wifi: 'connection' in navigator,
    };
  }, [swInfo.supported]);

  // Inicializar Service Worker
  useEffect(() => {
    if (swInfo.supported && !swInfo.enabled) {
      registerSW();
    }

    // Verificar status do controller
    const checkController = () => {
      setSwInfo(prev => ({
        ...prev,
        controller: navigator.serviceWorker.controller,
      }));
    };

    navigator.serviceWorker.addEventListener('controllerchange', checkController);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', checkController);
    };
  }, [swInfo.supported, swInfo.enabled, registerSW]);

  // Verificar atualizações periodicamente
  useEffect(() => {
    if (!swInfo.enabled) return;

    const interval = setInterval(() => {
      checkForUpdates();
    }, 60 * 60 * 1000); // Verificar a cada hora

    return () => clearInterval(interval);
  }, [swInfo.enabled, checkForUpdates]);

  // Obter informações do cache ao montar
  useEffect(() => {
    if (swInfo.enabled) {
      getCacheInfo();
    }
  }, [swInfo.enabled, getCacheInfo]);

  return {
    // Estado
    swInfo,
    cacheInfo,
    
    // Ações
    registerSW,
    applyUpdate,
    getCacheInfo,
    clearCache,
    clearAllCaches,
    forceSync,
    sendMessage,
    
    // Utilitários
    getOfflineCapabilities,
    
    // Estados derivados
    isOfflineCapable: swInfo.supported,
    hasUpdate: swInfo.updateAvailable,
    isInstalling: swInfo.installing,
    totalCacheSize: cacheInfo.reduce((acc, cache) => acc + (cache.size || 0), 0),
    cacheCount: cacheInfo.length,
  };
}
