import { useEffect, useCallback, useRef } from 'react';

interface SilentUpdateOptions {
  checkInterval?: number; // ms, default 5 min
  onUpdateAvailable?: () => void;
}

export function useSilentUpdate(options: SilentUpdateOptions = {}) {
  const { checkInterval = 5 * 60 * 1000, onUpdateAvailable } = options;
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Verificar atualizações silenciosamente
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    
    const now = Date.now();
    // Evitar checks muito frequentes
    if (now - lastCheckRef.current < 30000) return; // min 30s entre checks
    lastCheckRef.current = now;

    try {
      const registration = registrationRef.current || await navigator.serviceWorker.ready;
      if (!registration) return;

      // Forçar check por nova versão
      await registration.update();
      
      console.log('[SilentUpdate] Verificação concluída');
    } catch (err) {
      console.log('[SilentUpdate] Erro silencioso:', err);
    }
  }, []);

  // Função para limpar TODOS os caches e recarregar
  const forceCleanAndReload = useCallback(async () => {
    console.log('[SilentUpdate] Limpando todos os caches...');
    
    try {
      // 1. Limpar todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[SilentUpdate] Caches limpos:', cacheNames.length);
      }
      
      // 2. Limpar localStorage relacionado ao app (exceto auth)
      const keysToKeep = ['supabase.auth.token', 'user', 'sb-'];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.some(k => key.includes(k))) {
          localStorage.removeItem(key);
        }
      }
      
      // 3. Limpar sessionStorage
      sessionStorage.clear();
      
      console.log('[SilentUpdate] Storage limpo, recarregando...');
      
      // 4. Recarregar a página para aplicar nova versão
      window.location.reload();
    } catch (err) {
      console.error('[SilentUpdate] Erro ao limpar:', err);
      // Mesmo com erro, tentar recarregar
      window.location.reload();
    }
  }, []);

  // Escutar mensagens do SW - DESATIVADO para evitar loops
  useEffect(() => {
    // Não escutar mais mensagens de update - causa loop infinito no PWA
    console.log('[SilentUpdate] Modo passivo - sem auto-reload');
    return () => {};
  }, []);

  // NÃO registrar SW aqui - já registrado no index.html
  // Apenas usar o SW existente
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    
    // Apenas obter referência ao SW existente
    navigator.serviceWorker.ready.then(registration => {
      registrationRef.current = registration;
      console.log('[SilentUpdate] SW pronto');
    });
  }, []);

  // Verificação periódica
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const interval = setInterval(() => {
      checkForUpdates();
    }, checkInterval);

    // Verificar também quando a aba volta a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Verificar quando voltar online
    const handleOnline = () => {
      checkForUpdates();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkInterval, checkForUpdates]);

  return { checkForUpdates, forceCleanAndReload };
}
