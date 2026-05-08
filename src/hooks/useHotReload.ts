import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UpdateInfo {
  version: string;
  hash: string;
  timestamp: string;
  force?: boolean;
}

export function useHotReload() {
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const lastVersionRef = useRef<string>('');
  const isCheckingRef = useRef<boolean>(false);

  const checkForUpdates = useCallback(async () => {
    if (isCheckingRef.current) return;
    
    try {
      isCheckingRef.current = true;
      
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) return;
      
      const updateInfo: UpdateInfo = await response.json();
      const currentVersion = updateInfo.version;
      
      if (!lastVersionRef.current) {
        lastVersionRef.current = currentVersion;
        return;
      }
      
      if (currentVersion !== lastVersionRef.current) {
        console.log(`[HotReload] Nova versão detectada: ${currentVersion}`);
        
        // Verificar se é uma atualização crítica
        const isCritical = updateInfo.force || currentVersion.includes('critical');
        
        if (isCritical) {
          // Atualização crítica - notificar e preparar refresh
          toast.error('Atualização crítica disponível', {
            description: 'O sistema será atualizado em 10 segundos...',
            duration: 10000,
            action: {
              label: 'Atualizar Agora',
              onClick: () => window.location.reload()
            }
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 10000);
        } else {
          // Atualização suave - notificar e aplicar sem refresh
          toast.success('Nova atualização disponível', {
            description: 'As mudanças serão aplicadas automaticamente.',
            duration: 5000,
            action: {
              label: 'Recarregar',
              onClick: () => window.location.reload()
            }
          });
          
          // Aplicar atualizações suaves
          applySoftUpdates(updateInfo);
        }
        
        lastVersionRef.current = currentVersion;
      }
    } catch (error) {
      console.warn('[HotReload] Erro ao verificar atualizações:', error);
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  const applySoftUpdates = useCallback((updateInfo: UpdateInfo) => {
    // Atualizar meta tags
    const versionMeta = document.querySelector('meta[name="app-version"]');
    if (versionMeta) {
      versionMeta.setAttribute('content', updateInfo.version);
    }
    
    // Limpar caches específicos
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('cinecasa') && name !== 'v34-stable') {
            caches.delete(name);
          }
        });
      });
    }
    
    // Disparar evento para componentes ouvirem
    window.dispatchEvent(new CustomEvent('app-updated', {
      detail: updateInfo
    }));
    
    console.log('[HotReload] Atualização suave aplicada:', updateInfo.version);
  }, []);

  const forceCheck = useCallback(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  useEffect(() => {
    // Verificar imediatamente
    checkForUpdates();
    
    // Configurar verificação periódica
    checkIntervalRef.current = setInterval(() => {
      checkForUpdates();
    }, 30000); // Verificar a cada 30 segundos
    
    // Ouvir eventos de visibilidade
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdates();
      }
    };
    
    // Ouvir eventos de foco
    const handleFocus = () => {
      checkForUpdates();
    };
    
    // Ouvir eventos online/offline
    const handleOnline = () => {
      checkForUpdates();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForUpdates]);

  return {
    checkForUpdates: forceCheck,
    currentVersion: lastVersionRef.current
  };
}
