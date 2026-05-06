import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    silentUpdater?: any;
  }
}

interface SilentUpdaterStatus {
  currentVersion: any;
  isUpdating: boolean;
  queueLength: number;
  lastCheck: string;
}

export const useSilentUpdater = () => {
  const isInitialized = useRef(false);
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const statusCheckIntervalRef = useRef<NodeJS.Timeout>();

  // Inicializar sistema de atualização silenciosa
  const initializeSilentUpdater = useCallback(() => {
    if (isInitialized.current || typeof window === 'undefined') return;

    // Carregar script do silent updater
    const script = document.createElement('script');
    script.src = '/silent-updater.js';
    script.async = true;
    script.onload = () => {
      console.log('[Silent Updater Hook] Sistema inicializado');
      isInitialized.current = true;
    };
    script.onerror = () => {
      console.warn('[Silent Updater Hook] Erro ao carregar script');
    };
    
    document.head.appendChild(script);

    // Configurar listener para atualizações completas
    const handleSilentUpdate = (event: CustomEvent) => {
      console.log('[Silent Updater Hook] Atualização silenciosa concluída:', event.detail);
      
      // Recarregar componentes que precisam de atualização
      window.dispatchEvent(new CustomEvent('appDataUpdated', {
        detail: { version: event.detail.version }
      }));
    };

    window.addEventListener('silentUpdateComplete', handleSilentUpdate as EventListener);

    return () => {
      window.removeEventListener('silentUpdateComplete', handleSilentUpdate as EventListener);
    };
  }, []);

  // Forçar verificação de atualizações
  const forceUpdateCheck = useCallback(() => {
    if (window.silentUpdater) {
      window.silentUpdater.forceCheck();
    } else {
      console.warn('[Silent Updater Hook] Sistema não inicializado');
    }
  }, []);

  // Obter status do atualizador
  const getStatus = useCallback((): SilentUpdaterStatus | null => {
    if (window.silentUpdater) {
      return window.silentUpdater.getStatus();
    }
    return null;
  }, []);

  // Verificar periodicamente se há atualizações
  const startPeriodicCheck = useCallback(() => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }

    statusCheckIntervalRef.current = setInterval(() => {
      const status = getStatus();
      if (status && status.isUpdating) {
        console.log('[Silent Updater Hook] Atualização em andamento...');
      }
    }, 30000); // Verificar a cada 30 segundos
  }, [getStatus]);

  // Parar verificação periódica
  const stopPeriodicCheck = useCallback(() => {
    if (statusCheckIntervalRef.current) {
      clearInterval(statusCheckIntervalRef.current);
    }
  }, []);

  useEffect(() => {
    const cleanup = initializeSilentUpdater();
    
    // Iniciar verificação periódica após inicialização
    setTimeout(() => {
      startPeriodicCheck();
    }, 5000);

    return () => {
      cleanup?.();
      stopPeriodicCheck();
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [initializeSilentUpdater, startPeriodicCheck, stopPeriodicCheck]);

  // Listener para mudanças na conexão (verificar atualizações quando voltar online)
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Silent Updater Hook] Conexão restaurada, verificando atualizações...');
      setTimeout(forceUpdateCheck, 2000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized.current) {
        console.log('[Silent Updater Hook] Página visível, verificando atualizações...');
        setTimeout(forceUpdateCheck, 1000);
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forceUpdateCheck]);

  return {
    forceUpdateCheck,
    getStatus,
    isInitialized: isInitialized.current,
    startPeriodicCheck,
    stopPeriodicCheck
  };
};
