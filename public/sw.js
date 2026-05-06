// Service Worker CineCasa - SILENT AUTO-UPDATE v33
// Estratégia: Silent Updates + Smart Cache + Zero User Impact
// BUILD: AUTO-GENERATED - SILENT UPDATE MODE
const CACHE_VERSION = 'v33-silent-update';
const BUILD_TIMESTAMP = 'AUTO-SILENT';
const SILENT_UPDATE_MODE = true;

// Arquivos essenciais para cache inicial
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// === INSTALAÇÃO: Silent Install ===
self.addEventListener('install', e => {
  console.log('[SW] Instalando modo silencioso...');
  
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[SW] Cacheando assets essenciais (silent)');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Instalação silenciosa completa');
        return self.skipWaiting(); // Ativação imediata e silenciosa
      })
      .catch(err => {
        console.error('[SW] Erro na instalação silenciosa:', err);
        return self.skipWaiting();
      })
  );
});

// === ATIVAÇÃO: Silent Activation ===
self.addEventListener('activate', e => {
  console.log('[SW] Ativação silenciosa...');
  
  e.waitUntil(
    // Limpar caches antigos de forma silenciosa
    caches.keys()
      .then(cacheNames => {
        console.log('[SW] Limpando caches antigos (silent)');
        return Promise.all(
          cacheNames.map(name => {
            if (name !== CACHE_VERSION && !name.includes('silent-update')) {
              console.log('[SW] Removendo cache antigo:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Ativação silenciosa completa');
        // Assumir controle sem notificar usuários
        return self.clients.claim();
      })
  );
});

// === MENSAGENS: Silent Communication ===
self.addEventListener('message', e => {
  const { type, data } = e.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      e.source.postMessage({
        type: 'SW_VERSION',
        version: CACHE_VERSION,
        timestamp: BUILD_TIMESTAMP,
        silentMode: SILENT_UPDATE_MODE
      });
      break;
      
    case 'SILENT_UPDATE':
      console.log('[SW] Iniciando atualização silenciosa...');
      performSilentUpdate();
      break;
      
    case 'CHECK_UPDATES':
      checkForSilentUpdates()
        .then(hasUpdate => {
          e.source.postMessage({
            type: 'UPDATE_CHECK_RESULT',
            hasUpdate,
            version: CACHE_VERSION
          });
        });
      break;
  }
});

// Função de atualização silenciosa
async function performSilentUpdate() {
  try {
    // Verificar nova versão
    const response = await fetch('/version.json', { cache: 'no-cache' });
    const versionInfo = await response.json();
    
    if (versionInfo.hash !== BUILD_TIMESTAMP) {
      console.log('[SW] Nova versão detectada, atualizando...');
      
      // Pré-carregar novos recursos
      await preloadNewAssets();
      
      // Atualizar cache
      await updateCacheSilently();
      
      // Notificar clients silenciosamente
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SILENT_UPDATE_COMPLETE',
            version: versionInfo
          });
        });
      });
    }
  } catch (error) {
    console.error('[SW] Erro na atualização silenciosa:', error);
  }
}

async function checkForSilentUpdates() {
  try {
    const response = await fetch('/version.json', { cache: 'no-cache' });
    const versionInfo = await response.json();
    return versionInfo.hash !== BUILD_TIMESTAMP;
  } catch (error) {
    return false;
  }
}

async function preloadNewAssets() {
  const cache = await caches.open(CACHE_VERSION);
  const assets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/silent-updater.js'
  ];
  
  const preloadPromises = assets.map(async (asset) => {
    try {
      const response = await fetch(asset, { cache: 'reload' });
      if (response.ok) {
        await cache.put(asset, response);
      }
    } catch (error) {
      console.warn(`[SW] Erro no pré-carregamento de ${asset}:`, error);
    }
  });
  
  await Promise.allSettled(preloadPromises);
}

async function updateCacheSilently() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name !== CACHE_VERSION && !name.includes('silent-update')
  );
  
  await Promise.all(oldCaches.map(name => caches.delete(name)));
}

// === FETCH: Silent Network First ===
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.startsWith('/api/')) return;
  
  // Estratégia Network First com cache silencioso
  e.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // Se tem cache válido, retornar e atualizar em background
        if (cachedResponse) {
          // Atualizar em background silenciosamente
          fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const cache = caches.open(CACHE_VERSION);
              cache.then(c => c.put(request, networkResponse.clone()));
            }
          }).catch(() => {}); // Silenciar erros de background
          
          return cachedResponse;
        }
        
        // Se não tem cache, buscar da rede
        return fetch(request, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        })
          .then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_VERSION).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback para cache antigo ou offline
            return caches.match(request) || 
                   new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// === SYNC: Silent Background Sync ===
self.addEventListener('sync', e => {
  if (e.tag === 'silent-update') {
    console.log('[SW] Executando sync de atualização silenciosa...');
    e.waitUntil(
      performSilentUpdate()
    );
  }
  
  if (e.tag === 'clear-old-caches') {
    e.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_VERSION && !name.includes('silent-update'))
            .map(name => caches.delete(name))
        );
      })
    );
  }
});

// === PUSH: Silent Push Notifications ===
self.addEventListener('push', e => {
  if (!e.data) return;
  
  const data = e.data.json();
  
  // Processar apenas pushes silenciosos
  if (data.silent) {
    console.log('[SW] Processando push silencioso:', data);
    
    e.waitUntil(
      (async () => {
        try {
          if (data.type === 'UPDATE_AVAILABLE') {
            await performSilentUpdate();
          }
        } catch (error) {
          console.error('[SW] Erro no processamento de push silencioso:', error);
        }
      })()
    );
  }
});

console.log('[SW] Service Worker para atualizações silenciosas carregado');
