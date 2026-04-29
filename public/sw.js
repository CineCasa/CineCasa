// Service Worker CineCasa - Stable Version v31
// Estratégia: Stale-While-Revalidate - CACHE BUSTING TOTAL
// BUILD: 20260429-0057 - FORCE CLEAR CACHE
const CACHE_VERSION = 'v31-force-clear';
const BUILD_TIMESTAMP = '20260429-0057';

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
  console.log('[SW] Instalando v30 - No Loop...');
  
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[SW] Cacheando assets essenciais');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Instalação completa v30');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Erro na instalação:', err);
        return self.skipWaiting();
      })
  );
});

// === ATIVAÇÃO: Limpar TODOS os caches antigos ===
self.addEventListener('activate', e => {
  console.log('[SW] Ativado v31 - Force Clear');
  
  e.waitUntil(
    caches.keys()
      .then(cacheNames => {
        console.log('[SW] Limpando todos os caches:', cacheNames);
        return Promise.all(
          cacheNames.map(name => {
            console.log('[SW] Removendo cache:', name);
            return caches.delete(name);
          })
        );
      })
      .then(() => {
        console.log('[SW] Todos os caches limpos');
        // Notificar todos os clients que o cache foi limpo
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED', version: CACHE_VERSION });
          });
        });
      })
      .then(() => {
        console.log('[SW] Controle assumido');
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

// === FETCH: Stale-While-Revalidate ===
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.startsWith('/api/')) return; // Não cachear APIs
  
  // Estratégia Network First: sempre tenta buscar da rede primeiro
  // Só usa cache se a rede falhar ou para recursos essenciais
  e.respondWith(
    fetch(request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.ok) {
          // Atualiza cache em background
          const clone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(request, clone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se falhar na rede, tenta buscar do cache
        return caches.match(request).then(cachedResponse => {
          return cachedResponse || new Response('Offline', { status: 503 });
        });
      })
  );
});
