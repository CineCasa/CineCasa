// Service Worker para CineCasa PWA - Versão Otimizada com Offline Avançado
const CACHE_VERSION = 'v6';
const STATIC_CACHE = `cinecasa-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cinecasa-dynamic-${CACHE_VERSION}`;
const API_CACHE = `cinecasa-api-${CACHE_VERSION}`;
const OFFLINE_CACHE = `cinecasa-offline-${CACHE_VERSION}`;

// Arquivos/pastas que NÃO devem ser cacheados (sempre buscar do servidor)
const NO_CACHE_URLS = [
  '/js/watch-party.js',
  '/js/criar-sala.js',
  '/watch.html',
  // REMOVIDO: '/assets/' - Arquivos de build PRECISAM ser cacheados para funcionar offline
  'supabase.co', // Supabase API - never cache
  'eqhstnlsmfrwxhvcwoid.supabase.co' // Supabase REST API
];

// Domínios externos que não devem ser interceptados
const EXTERNAL_DOMAINS = [
  'supabase.co',
  'themoviedb.org',
  'tmdb.org'
];

// Detectar modo de desenvolvimento (localhost)
const isDevelopment = self.location.hostname === 'localhost' || 
                      self.location.hostname === '127.0.0.1';

// URLs para cache estático (serão atualizadas automaticamente)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/watch.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/monochrome-icon-192x192.png',
  '/icons/monochrome-icon-512x512.png'
];

// Configurações de cache
const CACHE_CONFIG = {
  static: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    maxEntries: 100,
  },
  dynamic: {
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    maxEntries: 50,
  },
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutos
    maxEntries: 30,
  },
  images: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    maxEntries: 200,
  },
};

// Estratégias de cache otimizadas
const CACHE_STRATEGIES = {
  // Cache First para assets estáticos
  static: async (request) => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached && !isExpired(cached, CACHE_CONFIG.static.maxAge)) {
      return cached;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
        await limitCacheSize(cache, CACHE_CONFIG.static.maxEntries);
      }
      return response;
    } catch (error) {
      return cached || createOfflineResponse();
    }
  },

  // Network First para conteúdo dinâmico
  dynamic: async (request) => {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
        await limitCacheSize(cache, CACHE_CONFIG.dynamic.maxEntries);
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      return cached || createOfflineResponse();
    }
  },

  // Stale While Revalidate para APIs
  api: async (request) => {
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    
    // Atualizar cache em background
    const networkPromise = fetch(request)
      .then(async (response) => {
        if (response.ok) {
          cache.put(request, response.clone());
          await limitCacheSize(cache, CACHE_CONFIG.api.maxEntries);
        }
        return response;
      })
      .catch(() => null);
    
    // Retornar cache imediatamente se disponível
    if (cached) {
      return cached;
    }
    
    // Se não tiver cache, esperar network
    try {
      return await networkPromise;
    } catch (error) {
      return createOfflineResponse();
    }
  },

  // Cache First para imagens
  images: async (request) => {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached && !isExpired(cached, CACHE_CONFIG.images.maxAge)) {
      return cached;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
        await limitCacheSize(cache, CACHE_CONFIG.images.maxEntries);
      }
      return response;
    } catch (error) {
      return cached || createOfflineResponse();
    }
  }
};

// Instalação do Service Worker com cache estático
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  // Pular cache em modo de desenvolvimento
  if (isDevelopment) {
    console.log('[SW] Modo DEV - cache desativado');
    self.skipWaiting();
    return;
  }
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        // Forçar atualização imediata para evitar tela branca
        self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

// Ativação do Service Worker com limpeza inteligente
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  if (isDevelopment) {
    console.log('[SW] Modo DEV - limpando todos os caches');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            console.log('[SW] Limpando cache:', cache);
            return caches.delete(cache);
          })
        );
      })
    );
    return;
  }
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Manter apenas os caches atuais
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE &&
              cacheName !== OFFLINE_CACHE) {
            console.log('[SW] Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Ativação completa');
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições com estratégias inteligentes
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // CRITICAL: Ignorar completamente requisições para Supabase e outros domínios externos
  // Isso evita problemas de CORS
  if (url.hostname.includes('supabase.co') || 
      url.hostname.includes('themoviedb.org') ||
      url.hostname.includes('tmdb.org') ||
      url.origin !== self.location.origin) {
    return; // Deixa o navegador lidar com a requisição normalmente
  }

  // Em desenvolvimento: não usar cache, sempre buscar da rede
  if (isDevelopment) {
    event.respondWith(fetch(request));
    return;
  }

  // Ignorar requisições chrome-extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Lidar com diferentes métodos HTTP
  if (request.method === 'GET') {
    event.respondWith(handleGetRequest(request));
  } else if (request.method === 'POST') {
    event.respondWith(handlePostRequest(request));
  }
});

// Lidar com requisições GET
async function handleGetRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Verificar se a URL está na lista de não-cache
  if (NO_CACHE_URLS.some(noCacheUrl => pathname.includes(noCacheUrl))) {
    console.log('[SW] Network only (no cache):', pathname);
    return fetch(request);
  }
  
  // 1. Cache First para assets estáticos
  if (isStaticAsset(pathname)) {
    return CACHE_STRATEGIES.static(request);
  }
  
  // 2. Cache First para imagens
  if (isImageAsset(pathname)) {
    return CACHE_STRATEGIES.images(request);
  }
  
  // 3. Stale While Revalidate para APIs
  if (isAPIRequest(pathname)) {
    return CACHE_STRATEGIES.api(request);
  }
  
  // 4. Network First para conteúdo dinâmico
  if (isDynamicContent(pathname)) {
    return CACHE_STRATEGIES.dynamic(request);
  }
  
  // 5. Network Only para outras requisições
  return fetch(request);
}

// Lidar com requisições POST
async function handlePostRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    const response = await fetch(request);
    
    // Cache de respostas POST específicas
    if (isCacheablePost(pathname)) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network error for POST request, trying cache...');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Retornar resposta offline
    return new Response(
      JSON.stringify({ 
        error: 'Offline mode',
        message: 'No network connection available' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Utilitários de verificação
function isStaticAsset(pathname) {
  return STATIC_ASSETS.some(asset => pathname === asset) ||
         pathname.startsWith('/icons/') ||
         pathname.startsWith('/fonts/') ||
         pathname.startsWith('/styles/') ||
         pathname.startsWith('/assets/') || // Importante: cachear arquivos de build Vite
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.woff') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.ttf');
}

function isImageAsset(pathname) {
  return pathname.includes('/images/') ||
         pathname.includes('/posters/') ||
         pathname.includes('/backdrops/') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.gif');
}

function isAPIRequest(pathname) {
  return pathname.includes('/api/') ||
         pathname.includes('/rest/v1/') ||
         pathname.includes('/supabase/');
}

function isDynamicContent(pathname) {
  return pathname.startsWith('/filmes') ||
         pathname.startsWith('/series') ||
         pathname.startsWith('/details/') ||
         pathname.startsWith('/search') ||
         pathname.startsWith('/favorites') ||
         pathname.startsWith('/continue-watching');
}

function isCacheablePost(pathname) {
  return pathname.includes('/favorites') ||
         pathname.includes('/watch-progress') ||
         pathname.includes('/user/preferences') ||
         pathname.includes('/sync/');
}

function isExpired(response, maxAge) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader).getTime();
  const now = Date.now();
  return (now - responseDate) > maxAge;
}

async function limitCacheSize(cache, maxEntries) {
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

function createOfflineResponse() {
  return new Response(
    JSON.stringify({ 
      error: 'Offline',
      message: 'No internet connection available',
      offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// Evento de push (notificações avançadas)
self.addEventListener('push', event => {
  console.log('[SW] Push notification received:', event);
  
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Nova atualização no CineCasa!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/icon-48x48.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorar',
        icon: '/icons/icon-48x48.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'CineCasa', options)
  );
});

// Evento de clique na notificação
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  if (action === 'open') {
    // Abrir app na página relevante
    const url = data.url || '/';
    clients.openWindow(url);
  } else if (action === 'dismiss') {
    // Fechar notificação
    notification.close();
  } else {
    // Click padrão na notificação
    const url = data.url || '/';
    clients.openWindow(url);
    notification.close();
  }
});

// Background Sync avançado
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
  
  if (event.tag === 'sync-watch-progress') {
    event.waitUntil(syncWatchProgress());
  }
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Message Handling avançado
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CACHE_UPDATE') {
    const { url, data } = event.data;
    updateCache(url, data);
  }
  
  if (event.data?.type === 'CACHE_CLEAR') {
    clearAllCaches();
  }
  
  if (event.data?.type === 'FORCE_SYNC') {
    forceSync();
  }
});

// Funções de sincronização
async function syncFavorites() {
  try {
    const cache = await caches.open(API_CACHE);
    const favoritesResponse = await cache.match('/api/favorites');
    
    if (favoritesResponse) {
      const favorites = await favoritesResponse.json();
      
      // Enviar para servidor quando online
      await fetch('/api/sync/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites }),
      });
    }
  } catch (error) {
    console.error('[SW] Error syncing favorites:', error);
  }
}

async function syncWatchProgress() {
  try {
    const cache = await caches.open(API_CACHE);
    const progressResponse = await cache.match('/api/watch-progress');
    
    if (progressResponse) {
      const progress = await progressResponse.json();
      
      // Enviar para servidor quando online
      await fetch('/api/sync/watch-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });
    }
  } catch (error) {
    console.error('[SW] Error syncing watch progress:', error);
  }
}

async function syncOfflineData() {
  try {
    // Sincronizar todos os dados offline quando voltar online
    const cache = await caches.open(OFFLINE_CACHE);
    const offlineDataResponse = await cache.match('/offline-data');
    
    if (offlineDataResponse) {
      const offlineData = await offlineDataResponse.json();
      
      // Enviar dados para servidor
      await fetch('/api/sync/offline-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offlineData),
      });
    }
  } catch (error) {
    console.error('[SW] Error syncing offline data:', error);
  }
}

async function updateCache(url, data) {
  try {
    const cache = await caches.open(API_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
    await cache.put(new Request(url), response);
  } catch (error) {
    console.error('[SW] Error updating cache:', error);
  }
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Error clearing caches:', error);
  }
}

async function forceSync() {
  try {
    // Forçar sincronização de todos os dados
    await syncFavorites();
    await syncWatchProgress();
    await syncOfflineData();
    
    // Notificar clientes sobre sincronização
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW] Error forcing sync:', error);
  }
}

console.log(`[SW] Service Worker ${CACHE_VERSION} loaded successfully with advanced offline support`);
