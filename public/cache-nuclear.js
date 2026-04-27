// NUCLEAR CACHE BUSTER v27
// Este arquivo deve ser carregado ANTES de qualquer outro script
// Ele limpa TODO o cache e força recarga completa

(function() {
  const NUCLEAR_VERSION = 'v27-nuclear-20260426-2140';
  const stored = localStorage.getItem('nuclear_cache_version');
  
  if (stored !== NUCLEAR_VERSION) {
    console.log('[NUCLEAR] Nova versão detectada:', NUCLEAR_VERSION, 'Limpando tudo...');
    
    // Limpar localStorage
    const keysToKeep = ['supabase.auth.token']; // Preservar auth se existir
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Limpar todos os caches
    if ('caches' in window) {
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        console.log('[NUCLEAR] Todos os caches limpos');
      });
    }
    
    // Limpar Service Workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        return Promise.all(registrations.map(r => r.unregister()));
      }).then(() => {
        console.log('[NUCLEAR] Service Workers desregistrados');
      });
    }
    
    // Marcar como limpo
    localStorage.setItem('nuclear_cache_version', NUCLEAR_VERSION);
    localStorage.setItem('app_version', '20260426-2140');
    
    // Recarregar imediatamente sem cache
    console.log('[NUCLEAR] Recarregando página...');
    window.location.reload(true);
  } else {
    console.log('[NUCLEAR] Cache já limpo para versão:', NUCLEAR_VERSION);
  }
})();
