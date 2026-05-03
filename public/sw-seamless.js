// Service Worker CineCasa - Seamless Background Updates
// Atualizações automáticas sem interrupção do usuário

const CACHE_VERSION = 'v33-seamless';
const BUILD_TIMESTAMP = new Date().toISOString();
const NUCLEAR_CLEAR = true;

// Arquivos essenciais
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/version.json'
];

// Check if user is actively watching
let isUserActive = false;
let activeClients = 0;

// === INSTALAÇÃO SILENCIOSA ===
self.addEventListener('install', e => {
  console.log('[SW] Instalando nova versão...');
  
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => {
        console.log('[SW] ✅ Nova versão instalada');
        // Não skipWaiting automaticamente - aguardar momento ideal
        return self.skipWaiting();
      })
  );
});

// === ATIVAÇÃO INTELIGENTE ===
self.addEventListener('activate', e => {
  console.log('[SW] Ativando nova versão...');
  
  e.waitUntil(
    // Limpar caches antigos
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_VERSION)
          .map(name => {
            console.log('[SW] 🗑️ Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    })
    .then(() => {
      console.log('[SW] ✅ Caches limpos');
      // Notificar clients sobre atualização disponível
      return self.clients.matchAll({ includeUncontrolled: true });
    })
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: CACHE_VERSION,
          timestamp: BUILD_TIMESTAMP
        });
      });
      return self.clients.claim();
    })
  );
});

// === FETCH COM CACHE INTELIGENTE ===
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  
  // Ignorar requests não-GET
  if (request.method !== 'GET') return;
  
  // Ignorar chrome extensions
  if (url.protocol === 'chrome-extension:') return;
  
  // API requests - sempre network
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/rest/')) return;
  
  // Version.json - sempre fresh
  if (url.pathname === '/version.json') {
    e.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // Estratégia: Stale-While-Revalidate para assets
  e.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request, {
        headers: {
          'Cache-Control': 'max-age=0'
        }
      }).then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(request, clone);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);
      
      // Retornar cache imediatamente se existir, ou aguardar network
      return cachedResponse || fetchPromise;
    })
  );
});

// === MENSAGENS COM CLIENTS ===
self.addEventListener('message', e => {
  switch(e.data?.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'USER_ACTIVE':
      isUserActive = true;
      activeClients = e.data.count || 1;
      break;
      
    case 'USER_INACTIVE':
      isUserActive = false;
      activeClients = Math.max(0, activeClients - 1);
      break;
      
    case 'GET_VERSION':
      e.source.postMessage({
        type: 'SW_VERSION',
        version: CACHE_VERSION,
        timestamp: BUILD_TIMESTAMP,
        isUpdateAvailable: false
      });
      break;
      
    case 'CHECK_UPDATE':
      // Verificar se há nova versão
      fetch('/version.json?v=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(version => {
          e.source.postMessage({
            type: 'UPDATE_CHECK_RESULT',
            currentVersion: CACHE_VERSION,
            serverVersion: version.version,
            hasUpdate: version.version !== CACHE_VERSION
          });
        })
        .catch(() => {
          e.source.postMessage({
            type: 'UPDATE_CHECK_RESULT',
            error: true
          });
        });
      break;
  }
});

// === PERIODIC SYNC PARA CHECAR UPDATES ===
self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-updates') {
    e.waitUntil(checkForUpdates());
  }
});

// === BACKGROUND SYNC ===
self.addEventListener('sync', e => {
  if (e.tag === 'clear-old-caches') {
    e.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_VERSION)
            .map(name => caches.delete(name))
        );
      })
    );
  }
});

// === PUSH NOTIFICATION (opcional) ===
self.addEventListener('push', e => {
  if (e.data) {
    const data = e.data.json();
    e.waitUntil(
      self.registration.showNotification(data.title || 'CineCasa', {
        body: data.body || 'Nova atualização disponível!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'update',
        requireInteraction: false
      })
    );
  }
});

// Função para checar updates
async function checkForUpdates() {
  try {
    const response = await fetch('/version.json?v=' + Date.now(), {
      cache: 'no-store'
    });
    const version = await response.json();
    
    if (version.version !== CACHE_VERSION) {
      // Nova versão disponível
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach(client => {
        client.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: version.version,
          currentVersion: CACHE_VERSION,
          silent: true
        });
      });
    }
  } catch (err) {
    console.log('[SW] Erro ao checar updates:', err);
  }
}

// Ping de atividade a cada 30 segundos
setInterval(() => {
  if (!isUserActive && activeClients === 0) {
    // Usuário inativo - pode fazer atualizações pesadas
    console.log('[SW] Usuário inativo - oportunidade para atualizar');
  }
}, 30000);

console.log('[SW] Service Worker seamless inicializado:', CACHE_VERSION);
