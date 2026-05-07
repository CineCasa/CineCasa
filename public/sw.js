// Service Worker CineCasa - v34 - Corrigido para evitar erros de Response
const CACHE_VERSION = 'v34-stable';

// Apenas cache de assets essenciais
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalação: Cache básico
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

// Ativação: Limpar caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name !== CACHE_VERSION).map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network first com fallback para cache
self.addEventListener('fetch', e => {
  const { request } = e;
  
  // Ignorar não-GET e chrome-extension
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension://')) return;
  
  // Para navegação (HTML): Network first
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }
  
  // Para assets estáticos: Cache first
  if (request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) {
          // Atualizar em background
          fetch(request).then(response => {
            if (response.ok) {
              caches.open(CACHE_VERSION).then(cache => cache.put(request, response));
            }
          }).catch(() => {});
          return cached;
        }
        
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }
  
  // Para APIs e outros: Pass-through
  e.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
});

console.log('[SW] Service Worker v34 carregado');
