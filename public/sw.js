// Service Worker CineCasa - NUCLEAR CACHE CLEAR v32
// Estratégia: Network First + Nuclear Cache Clearing
// BUILD: 20250502-1627 - NUCLEAR CLEAR ALL CACHES
const CACHE_VERSION = 'v32-nuclear-clear';
const BUILD_TIMESTAMP = '20250502-1627';
const NUCLEAR_CLEAR = true;

// Arquivos essenciais para cache inicial
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// === INSTALAÇÃO: Cachear assets essenciais ===
self.addEventListener('install', e => {
  console.log('[SW] Instalando v32 - NUCLEAR CACHE CLEAR...');
  
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[SW] Cacheando assets essenciais');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Instalação completa v32');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Erro na instalação:', err);
        return self.skipWaiting();
      })
  );
});

// === ATIVAÇÃO: NUCLEAR CLEAR - Limpar absolutamente TUDO ===
self.addEventListener('activate', e => {
  console.log('[SW] Ativado v32 - NUCLEAR CLEAR MODE');
  
  e.waitUntil(
    // Primeiro: limpar TODOS os caches existentes
    caches.keys()
      .then(cacheNames => {
        console.log('[SW] NUCLEAR CLEAR - Removendo caches:', cacheNames);
        return Promise.all(
          cacheNames.map(name => {
            console.log('[SW] 💥 NUCLEAR DELETE:', name);
            return caches.delete(name);
          })
        );
      })
      .then(() => {
        console.log('[SW] ✅ Todos os caches destruídos');
        // Notificar todos os clients para recarregar
        return self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ 
              type: 'NUCLEAR_CACHE_CLEARED', 
              version: CACHE_VERSION,
              reload: true 
            });
          });
        });
      })
      .then(() => {
        console.log('[SW] 🚀 Forçando reload em todos clients');
        return self.clients.claim();
      })
  );
});

// === MENSAGENS: Comunicação com app ===
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (e.data?.type === 'GET_VERSION') {
    e.source.postMessage({
      type: 'SW_VERSION',
      version: CACHE_VERSION,
      timestamp: BUILD_TIMESTAMP
    });
  }
});

// === FETCH: Network Only (desabilitar cache temporariamente) ===
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.startsWith('/api/')) return;
  
  // Estratégia Network First com cache-busting
  e.respondWith(
    fetch(request, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(request, clone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});

// === SYNC: Forçar limpeza periódica ===
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
