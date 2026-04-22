// Service Worker CineCasa - FORCE UPDATE v17
// Sistema de atualização automática sem espera
const CACHE_VERSION = 'v17-force-update';
const BUILD_TIMESTAMP = '20260422-001300';
const FORCE_CLEAN = true; // Sempre limpar tudo

// Arquivos essenciais
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// === INSTALAÇÃO: Forçar ativação imediata ===
self.addEventListener('install', e => {
  console.log('[SW] Instalando v17 - FORCE UPDATE...');
  
  e.waitUntil(
    (async () => {
      try {
        // 1. Limpar TODOS os caches antigos primeiro
        if (FORCE_CLEAN) {
          const allCaches = await caches.keys();
          await Promise.all(allCaches.map(name => caches.delete(name)));
          console.log('[SW] Todos os caches antigos deletados:', allCaches.length);
        }
        
        // 2. Criar novo cache limpo
        const cache = await caches.open(CACHE_VERSION);
        await cache.addAll(PRECACHE_ASSETS);
        console.log('[SW] Novo cache criado:', CACHE_VERSION);
        
        // 3. Forçar ativação IMEDIATA - sem esperar
        await self.skipWaiting();
        console.log('[SW] Ativação forçada!');
        
      } catch (err) {
        console.error('[SW] Erro na instalação:', err);
        await self.skipWaiting();
      }
    })()
  );
});

// === ATIVAÇÃO: Limpar tudo e assumir controle ===
self.addEventListener('activate', e => {
  console.log('[SW] Ativado v17 - FORCE UPDATE');
  
  e.waitUntil(
    (async () => {
      try {
        // 1. Deletar TODOS os caches exceto o atual
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => name !== CACHE_VERSION);
        
        await Promise.all(oldCaches.map(name => {
          console.log('[SW] Deletando:', name);
          return caches.delete(name);
        }));
        
        // 2. Assumir controle de TODOS os clientes imediatamente
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        await self.clients.claim();
        console.log('[SW] Controle total assumido');
        
        // 3. Notificar clientes para recarregar
        clients.forEach(client => {
          try {
            client.postMessage({
              type: 'SW_FORCE_UPDATE',
              version: CACHE_VERSION,
              timestamp: BUILD_TIMESTAMP,
              force: true,
              action: 'RELOAD_NOW'
            });
          } catch (err) {}
        });
        
      } catch (err) {
        console.error('[SW] Erro na ativação:', err);
        await self.clients.claim();
      }
    })()
  );
});

// === MENSAGENS: Aceitar comandos do app ===
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (e.data?.type === 'FORCE_CLEAN_ALL') {
    e.waitUntil(
      (async () => {
        // Limpar todos os caches
        const caches_list = await caches.keys();
        await Promise.all(caches_list.map(name => caches.delete(name)));
        
        // Notificar que limpou
        e.source.postMessage({
          type: 'ALL_CACHES_CLEARED',
          count: caches_list.length
        });
      })()
    );
  }
});

// === FETCH: Network First sempre (para ter conteúdo fresco) ===
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  
  // Para assets estáticos: Network First (sempre buscar novo)
  if (url.pathname.match(/\.(js|css|html|json|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    e.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            // Atualizar cache com versão nova
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Se falhar na rede, tentar cache
          return caches.match(request).then(cached => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }
  
  // Para index.html: sempre buscar novo
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(request, { cache: 'no-store' })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }
});
