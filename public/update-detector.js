/**
 * CineCasa - Background Update Detector
 * Detecta e aplica atualizações automaticamente sem interromper o usuário
 */

(function() {
  'use strict';

  const CHECK_INTERVAL = 30000; // 30 segundos
  const UPDATE_DELAY = 5000; // 5 segundos após inatividade
  let isChecking = false;
  let lastActivity = Date.now();
  let updatePending = false;
  let newVersion = null;

  // ===== UTILIDADES =====
  const log = (...args) => console.log('[Update]', ...args);

  // ===== DETECÇÃO DE ATIVIDADE =====
  function updateActivity() {
    lastActivity = Date.now();
    if (updatePending) {
      log('Usuário ativo - adiando atualização');
      // Não atualizar enquanto usuário estiver ativo
    }
  }

  // Monitorar atividade do usuário
  ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateActivity, { passive: true });
  });

  function isUserActive() {
    return Date.now() - lastActivity < 3000; // Ativo se movimento nos últimos 3s
  }

  function isVideoPlaying() {
    const videos = document.querySelectorAll('video');
    return Array.from(videos).some(v => !v.paused && !v.ended);
  }

  // ===== CHECAR VERSÃO =====
  async function checkForUpdate() {
    if (isChecking) return;
    isChecking = true;

    try {
      // Buscar versão atual do servidor
      const response = await fetch('/version.json?v=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) throw new Error('Failed to fetch version');
      
      const serverVersion = await response.json();
      const currentVersion = localStorage.getItem('app_version');
      
      log('Versão atual:', currentVersion, '| Servidor:', serverVersion.version);
      
      if (serverVersion.version && serverVersion.version !== currentVersion) {
        log('🔄 Nova versão detectada:', serverVersion.version);
        newVersion = serverVersion.version;
        updatePending = true;
        
        // Salvar nova versão
        localStorage.setItem('pending_version', serverVersion.version);
        localStorage.setItem('pending_build_hash', serverVersion.hash);
        
        // Tentar aplicar quando seguro
        tryApplyUpdate();
      }
    } catch (err) {
      log('Erro ao checar versão:', err.message);
    } finally {
      isChecking = false;
    }
  }

  // ===== APLICAR ATUALIZAÇÃO =====
  function tryApplyUpdate() {
    if (!updatePending || !newVersion) return;
    
    // Verificar se é seguro atualizar
    if (isUserActive()) {
      log('Usuário ativo - aguardando para atualizar...');
      return;
    }
    
    if (isVideoPlaying()) {
      log('Vídeo em reprodução - aguardando para atualizar...');
      return;
    }
    
    // Aplicar atualização
    log('✅ Aplicando atualização para versão:', newVersion);
    applyUpdate();
  }

  function applyUpdate() {
    // Salvar nova versão como atual
    localStorage.setItem('app_version', newVersion);
    localStorage.setItem('app_updated_at', new Date().toISOString());
    
    // Limpar todos os caches
    clearAllCaches().then(() => {
      log('🔄 Recarregando para nova versão...');
      
      // Recarregar sem mostrar loading
      window.location.reload(true);
    });
  }

  async function clearAllCaches() {
    // Limpar caches do navegador
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Limpar localStorage não-essencial
    const keysToKeep = ['user_id', 'session_token', 'app_version', 'app_updated_at'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpar sessionStorage
    sessionStorage.clear();
    
    // Unregister Service Workers antigos
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
  }

  // ===== SERVICE WORKER =====
  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      log('Service Worker não suportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      log('SW registrado');

      // Ouvir mensagens do SW
      navigator.serviceWorker.addEventListener('message', e => {
        if (e.data?.type === 'UPDATE_AVAILABLE') {
          log('SW reportou atualização disponível');
          newVersion = e.data.version;
          updatePending = true;
          tryApplyUpdate();
        }
      });

      // Checar updates periodicamente
      setInterval(() => {
        registration.update();
      }, CHECK_INTERVAL);

    } catch (err) {
      log('Erro ao registrar SW:', err);
    }
  }

  // ===== INICIALIZAÇÃO =====
  function init() {
    log('Inicializando detector de atualizações...');
    
    // Registrar SW
    registerServiceWorker();
    
    // Checar versão periodicamente
    setInterval(checkForUpdate, CHECK_INTERVAL);
    
    // Primeira checagem após 5 segundos
    setTimeout(checkForUpdate, 5000);
    
    // Tentar aplicar updates pendentes
    const pending = localStorage.getItem('pending_version');
    if (pending && pending !== localStorage.getItem('app_version')) {
      log('Atualização pendente detectada:', pending);
      newVersion = pending;
      updatePending = true;
    }
    
    // Monitorar inatividade para aplicar updates
    setInterval(() => {
      if (updatePending) {
        tryApplyUpdate();
      }
    }, 10000);
  }

  // Iniciar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
