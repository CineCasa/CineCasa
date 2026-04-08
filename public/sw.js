// Service Worker para CineCasa PWA
const CACHE_NAME = 'cinecasa-v1';

// Detectar modo de desenvolvimento (localhost)
const isDevelopment = self.location.hostname === 'localhost' || 
                      self.location.hostname === '127.0.0.1';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index-fTVPCL7o.js',
  '/assets/index-CzQ3HgWb.css',
  '/favicon.ico'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  // Pular cache em modo de desenvolvimento
  if (isDevelopment) {
    console.log('Service Worker: Modo DEV - cache desativado');
    self.skipWaiting();
    return;
  }
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  if (isDevelopment) {
    console.log('Service Worker: Modo DEV - limpando caches antigos');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => caches.delete(cache))
        );
      })
    );
    return;
  }
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
  // Em desenvolvimento: não usar cache, sempre buscar da rede
  if (isDevelopment) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Verifica se é uma resposta válida
          if (!response || response.status !== 0 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Evento de push (para notificações futuras)
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir CineCasa',
        icon: '/icons/icon-48x48.png'
      },
      {
        action: 'close',
        title: 'Fechar notificação',
        icon: '/icons/icon-48x48.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CineCasa Entretenimento', options)
  );
});

// Evento de clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Evento de sincronização em background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Lógica de sincronização aqui
      console.log('Service Worker: Sincronizando dados')
    );
  }
});
