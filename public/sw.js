// Service Worker CineCasa v15 - PWA com Cache Estratégico
const CACHE_VERSION = 'v15-pwa-cache';
const BUILD_TIMESTAMP = '20260421-005';

// Arquivos essenciais para PWA funcionar offline
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png'
];

// Limpar todo cache na ativação para garantir código novo
const CLEAR_ALL_CACHES = true;

// Instalação: cachear arquivos essenciais do PWA
self.addEventListener('install', e => {
  console.log('[SW] Instalando v14 - cacheando assets PWA...');
  
  e.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_VERSION);
        
        // Cachear arquivos essenciais do PWA
        console.log('[SW] Cacheando', PRECACHE_ASSETS.length, 'assets');
        await cache.addAll(PRECACHE_ASSETS);
        console.log('[SW] Assets cacheados com sucesso');
        
        // Forçar ativação imediata
        await self.skipWaiting();
        console.log('[SW] Skip waiting aplicado');
        
      } catch (err) {
        console.error('[SW] Erro ao cachear assets:', err);
        // Mesmo com erro, tentar continuar
        await self.skipWaiting();
      }
    })()
  );
});

// Ativação: limpar caches antigos e assumir controle
self.addEventListener('activate', e => {
  console.log('[SW] Ativado v15');
  
  e.waitUntil(
    (async () => {
      try {
        // 1. Limpar caches antigos
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => name !== CACHE_VERSION);
        
        await Promise.all(
          oldCaches.map(name => {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          })
        );
        
        // 2. Assumir controle de todos os clientes
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        console.log('[SW] Clientes encontrados:', clients.length);
        
        await self.clients.claim();
        console.log('[SW] Controle assumido');
        
        // 3. Notificar todos os clientes
        clients.forEach(client => {
          try {
            client.postMessage({
              type: 'SW_UPDATED',
              version: CACHE_VERSION,
              timestamp: BUILD_TIMESTAMP,
              force: false
            });
          } catch (err) {
            console.log('[SW] Erro ao notificar cliente:', err);
          }
        });
        
      } catch (err) {
        console.error('[SW] Erro na ativação:', err);
        await self.clients.claim();
      }
    })()
  );
});

// Interceptar fetch - estratégia Cache First para assets estáticos, Network First para API
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  
  // Ignorar requisições não-GET
  if (request.method !== 'GET') return;
  
  // Ignorar chrome-extensions
  if (url.protocol === 'chrome-extension:') return;
  
  // Cache First para arquivos estáticos do app
  if (url.pathname.match(/\.(js|css|html|json|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          // Retornar do cache mas atualizar em background
          fetch(request).then(response => {
            if (response.ok) {
              caches.open(CACHE_VERSION).then(cache => cache.put(request, response));
            }
          }).catch(() => {});
          return cached;
        }
        
        // Não está no cache, buscar na rede
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Para a página principal (/) - Cache First
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      caches.match('/index.html').then(cached => {
        return cached || fetch(request);
      })
    );
    return;
  }
  
  // Para outros requests, usar network normalmente
});
