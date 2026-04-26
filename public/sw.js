// Service Worker CineCasa - Stable Version v24
// Estratégia: Stale-While-Revalidate com fallback gracioso
// BUILD: 20260426-135500 - FORCE CACHE CLEAR v3
const CACHE_VERSION = 'v24-stable';
const BUILD_TIMESTAMP = '20260426-135500';

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
  console.log('[SW] Instalando v24 - Stable...');
  
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[SW] Cacheando assets essenciais');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Instalação completa');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Erro na instalação:', err);
        return self.skipWaiting();
      })
  );
});

// === ATIVAÇÃO: Limpar caches antigos apenas ===
self.addEventListener('activate', e => {
  console.log('[SW] Ativado v24 - Stable');
  
  e.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_VERSION)
            .map(name => {
              console.log('[SW] Removendo cache antigo:', name);
              return caches.delete(name);
            })
        );
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
  
  // Estratégia Stale-While-Revalidate: serve do cache imediatamente,
  // mas atualiza em background
  e.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Se tem no cache, retorna imediatamente
        const fetchPromise = fetch(request)
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
            // Falha silenciosa - já temos o cache
            console.log('[SW] Network falhou, usando cache');
            return cachedResponse;
          });
        
        // Retorna cache imediatamente (ou fetch se não tiver cache)
        return cachedResponse || fetchPromise;
      })
      .catch(() => {
        // Último fallback
        return fetch(request).catch(() => 
          new Response('Offline', { status: 503 })
        );
      })
  );
});
