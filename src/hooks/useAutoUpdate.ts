import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface VersionInfo {
  version: string;
  hash: string;
  timestamp: string;
}

export function useAutoUpdate(checkInterval = 30000) {
  const [currentVersion, setCurrentVersion] = useState<string>(() => {
    return import.meta.env.VITE_BUILD_VERSION || 'dev';
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);

  const checkForUpdate = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      // Adicionar timestamp para evitar cache
      const timestamp = Date.now();
      const response = await fetch(`/version.json?v=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        isCheckingRef.current = false;
        return;
      }

      const serverVersion: VersionInfo = await response.json();
      const localVersion = currentVersion;

      // Comparar versões
      if (serverVersion.version && serverVersion.version !== localVersion) {
        console.log('[AutoUpdate] Nova versão detectada:', serverVersion.version);
        setUpdateAvailable(true);

        // Mostrar toast para o usuário
        toast.info('Nova versão disponível!', {
          description: 'Atualizando para a versão mais recente...',
          duration: 3000,
        });

        // Aguardar 2 segundos para o usuário ver a mensagem, depois recarregar
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.log('[AutoUpdate] Erro ao verificar versão:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  const forceReload = () => {
    // Limpar todos os caches possíveis
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Recarregar a página sem cache
    window.location.reload();
  };

  useEffect(() => {
    // Verificar imediatamente ao montar
    checkForUpdate();

    // Configurar intervalo de verificação
    intervalRef.current = setInterval(checkForUpdate, checkInterval);

    // Verificar quando a aba fica visível novamente
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Verificar quando o usuário volta a focar na janela
    const handleFocus = () => {
      checkForUpdate();
    };

    window.addEventListener('focus', handleFocus);

    // Verificar ao reconectar online
    const handleOnline = () => {
      checkForUpdate();
    };

    window.addEventListener('online', handleOnline);

    // Configurar Service Worker para atualização automática
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[AutoUpdate] Service Worker atualizado, recarregando...');
        window.location.reload();
      });

      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[AutoUpdate] Novo Service Worker disponível');
                setUpdateAvailable(true);
                toast.info('Atualização disponível!', {
                  description: 'Aplicando atualização...',
                  duration: 2000,
                });
                setTimeout(() => window.location.reload(), 1500);
              }
            });
          }
        });
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkInterval, currentVersion]);

  return {
    currentVersion,
    updateAvailable,
    checkForUpdate,
    forceReload
  };
}

export default useAutoUpdate;
