import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Versão atual da aplicação - alterar sempre que fizer deploy de novas features
const APP_VERSION = '2026.04.29-v2';
const VERSION_KEY = 'cinecasa-app-version';
const LAST_CLEANUP_KEY = 'cinecasa-last-cleanup';

interface CleanupOptions {
  force?: boolean;
  preserveAuth?: boolean;
}

export function useAutoCacheCleanup() {
  // Limpa todos os caches do navegador
  const clearAllCaches = useCallback(async (): Promise<void> => {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[CacheCleanup] Todos os caches limpos:', cacheNames);
    } catch (error) {
      console.error('[CacheCleanup] Erro ao limpar caches:', error);
    }
  }, []);

  // Limpa localStorage exceto auth e versão
  const clearLocalStorage = useCallback((preserveAuth: boolean = true): void => {
    const keysToPreserve = preserveAuth 
      ? [VERSION_KEY, LAST_CLEANUP_KEY, 'supabase.auth.token', 'sb-eqhstnlsmfrwxhvcwoid-auth-token']
      : [VERSION_KEY, LAST_CLEANUP_KEY];

    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToPreserve.includes(key) && !key.startsWith('cinecasa-version-')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('[CacheCleanup] localStorage removido:', key);
    });
  }, []);

  // Limpa sessionStorage
  const clearSessionStorage = useCallback((): void => {
    const keysToPreserve: string[] = [];
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && !keysToPreserve.includes(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log('[CacheCleanup] sessionStorage removido:', key);
    });
  }, []);

  // Limpa IndexedDB
  const clearIndexedDB = useCallback(async (): Promise<void> => {
    if (!('indexedDB' in window)) return;

    try {
      const databases = await indexedDB.databases?.() || [];
      
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const request = indexedDB.deleteDatabase(db.name!);
              request.onsuccess = () => {
                console.log('[CacheCleanup] IndexedDB deletado:', db.name);
                resolve();
              };
              request.onerror = () => {
                console.error('[CacheCleanup] Erro ao deletar IndexedDB:', db.name);
                reject();
              };
            });
          }
          return Promise.resolve();
        })
);
    } catch (error) {
      console.error('[CacheCleanup] Erro ao limpar IndexedDB:', error);
    }
  }, []);

  // Registra Service Worker novo (skip waiting)
  const updateServiceWorker = useCallback(async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Força update do service worker
      await registration.update();
      
      // Se há um waiting worker, ativa imediatamente
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('[CacheCleanup] Service Worker: skip waiting ativado');
      }

      console.log('[CacheCleanup] Service Worker atualizado');
    } catch (error) {
      console.error('[CacheCleanup] Erro ao atualizar Service Worker:', error);
    }
  }, []);

  // Executa limpeza completa
  const performCleanup = useCallback(async (options: CleanupOptions = {}): Promise<void> => {
    const { force = false, preserveAuth = true } = options;

    console.log('[CacheCleanup] Iniciando limpeza', force ? '(forçada)' : '(automática)');

    try {
      // Limpa todos os storages
      await Promise.all([
        clearAllCaches(),
        clearLocalStorage(preserveAuth),
        clearSessionStorage(),
        clearIndexedDB(),
      ]);

      // Atualiza Service Worker
      await updateServiceWorker();

      // Registra data da limpeza
      localStorage.setItem(LAST_CLEANUP_KEY, new Date().toISOString());

      console.log('[CacheCleanup] Limpeza concluída com sucesso');
    } catch (error) {
      console.error('[CacheCleanup] Erro durante limpeza:', error);
    }
  }, [clearAllCaches, clearLocalStorage, clearSessionStorage, clearIndexedDB, updateServiceWorker]);

  // ATIVADO: Limpeza automática quando detectar nova versão
  const checkVersionAndCleanup = useCallback(async (): Promise<boolean> => {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== APP_VERSION) {
      console.log('[CacheCleanup] Nova versão detectada:', APP_VERSION, 'Versão anterior:', storedVersion);
      console.log('[CacheCleanup] Executando limpeza automática...');
      
      // Forçar limpeza completa de todos os caches
      await performCleanup({ force: true, preserveAuth: true });
      
      // Atualizar versão registrada
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      
      console.log('[CacheCleanup] Limpeza automática concluída');
      return true;
    }
    return false;
  }, [performCleanup]);

  // DESATIVADO: Limpeza periódica desabilitada
  // O sistema está online, não precisa limpar cache periodicamente
  const schedulePeriodicCleanup = useCallback(() => {
    // Limpeza automática desabilitada - sistema online
    console.log('[CacheCleanup] Limpeza automática desabilitada - sistema online');
  }, []);

  // Effect: verifica versão ao montar
  useEffect(() => {
    // Executar limpeza de versão imediatamente
    checkVersionAndCleanup();
    schedulePeriodicCleanup();

    // Handler para mensagens do Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
        console.log('[CacheCleanup] Nova versão disponível via SW');
        checkVersionAndCleanup();
      }
      
      if (event.data?.type === 'CACHE_CLEARED') {
        console.log('[CacheCleanup] Cache limpo pelo Service Worker, recarregando...');
        // Recarregar a página para garantir dados frescos
        window.location.reload();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [checkVersionAndCleanup, schedulePeriodicCleanup]);

  // API pública
  return {
    version: APP_VERSION,
    performCleanup,
    checkVersionAndCleanup,
    clearAllCaches,
    clearLocalStorage,
    clearSessionStorage,
    clearIndexedDB,
  };
}

export default useAutoCacheCleanup;
