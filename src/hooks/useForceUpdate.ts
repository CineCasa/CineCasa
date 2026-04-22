import { useEffect, useCallback, useState } from 'react';

interface ForceUpdateState {
  updateAvailable: boolean;
  updateApplying: boolean;
  lastCheck: number;
}

const STORAGE_KEY = '__cinecasa_force_update__';
const CHECK_INTERVAL = 30 * 1000; // Verificar a cada 30 segundos
const UPDATE_VERSION_KEY = '__cinecasa_update_version__';

export function useForceUpdate() {
  const [state, setState] = useState<ForceUpdateState>({
    updateAvailable: false,
    updateApplying: false,
    lastCheck: 0,
  });

  // Função para limpar TUDO
  const clearAllStorage = useCallback(async () => {
    console.log('[ForceUpdate] Limpando todo storage...');
    
    try {
      // 1. Limpar localStorage
      const keysToPreserve = ['user', 'supabase.auth.token']; // Preservar auth
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToPreserve.some(preserve => key.includes(preserve))) {
          localStorage.removeItem(key);
        }
      });
      
      // 2. Limpar sessionStorage
      sessionStorage.clear();
      
      // 3. Limpar caches via Service Worker
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('[ForceUpdate] Caches deletados:', cacheNames.length);
      }
      
      // 4. Limpar IndexedDB (compatibilidade)
      try {
        if ('databases' in window.indexedDB) {
          // @ts-ignore - databases() pode não existir em todos os browsers
          const dbs = await window.indexedDB.databases?.() || [];
          dbs.forEach((db: { name?: string }) => {
            if (db.name) {
              window.indexedDB.deleteDatabase(db.name);
            }
          });
        }
      } catch (e) {
        console.log('[ForceUpdate] IndexedDB limpeza parcial');
      }
      
      console.log('[ForceUpdate] Storage completamente limpo!');
      return true;
    } catch (err) {
      console.error('[ForceUpdate] Erro ao limpar:', err);
      return false;
    }
  }, []);

  // Função para forçar reload limpo
  const forceReload = useCallback(async () => {
    console.log('[ForceUpdate] Aplicando atualização forçada...');
    
    setState(prev => ({ ...prev, updateApplying: true }));
    
    try {
      // 1. Desregistrar Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('[ForceUpdate] SWs desregistrados:', registrations.length);
      }
      
      // 2. Limpar tudo
      await clearAllStorage;
      
      // 3. Marcar versão atual
      localStorage.setItem(UPDATE_VERSION_KEY, Date.now().toString());
      
      // 4. Recarregar com cache buster
      // @ts-ignore - URL constructor funciona corretamente
      const url = new URL(window.location.href);
      url.searchParams.set('_v', Date.now().toString());
      window.location.href = url.toString();
      
    } catch (err) {
      console.error('[ForceUpdate] Erro no reload:', err);
      window.location.reload();
    }
  }, [clearAllStorage]);

  // Verificar atualizações periodicamente
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Forçar check por nova versão
      await registration.update();
      
      setState(prev => ({ ...prev, lastCheck: Date.now() }));
      console.log('[ForceUpdate] Check realizado');
      
    } catch (err) {
      console.log('[ForceUpdate] Erro no check:', err);
    }
  }, []);

  // Listener para mensagens do SW - DESATIVADO para evitar loops
  useEffect(() => {
    // Não escutar mais mensagens de force update - causa loop infinito
    console.log('[ForceUpdate] Modo passivo - sem auto-reload');
    
    // Apenas expor funções globais para debug manual
    (window as any).__forceUpdateNow = forceReload;
    (window as any).__clearAllStorage = clearAllStorage;
    
    return () => {};
  }, [forceReload, clearAllStorage]);

  // Expor função global para debug/forçar
  useEffect(() => {
    (window as any).__forceUpdateNow = forceReload;
    (window as any).__clearAllStorage = clearAllStorage;
    (window as any).__checkUpdates = checkForUpdates;
  }, [forceReload, clearAllStorage, checkForUpdates]);

  return {
    ...state,
    forceReload,
    clearAllStorage,
    checkForUpdates,
  };
}
