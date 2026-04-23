const CACHE_NAME = 'cinecasa-notifications-v3-auto-cleanup';
const APP_VERSION = '2026.04.23-v1';

// Evento de instalação
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando versão:', APP_VERSION);
  
  // Limpar caches antigos imediatamente
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de ativação
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  event.waitUntil(self.clients.claim());
});

// Receber mensagens do aplicativo
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Notificar todos os clients sobre nova versão
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.source.postMessage({
      type: 'VERSION_INFO',
      version: APP_VERSION
    });
  }
});

// Interceptar fetch para evitar cache de versões antigas
self.addEventListener('fetch', (event) => {
  // Só interceptar requisições GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de API e Supabase
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('/api/')) {
    return;
  }
  
  // Estratégia: Network First com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se resposta ok, atualiza cache e retorna
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tenta do cache
        return caches.match(event.request);
      })
  );
});

// Receber notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event);

  let data = {
    title: 'CineCasa',
    body: 'Nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'general',
    requireInteraction: false,
    data: {}
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao parsear push:', error);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    data: data.data,
    actions: data.actions || [],
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clicar na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event);
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;

  let url = '/';
  
  // Definir URL baseada no tipo de notificação
  if (notificationData.type === 'new_episode') {
    url = `/details/series/${notificationData.seriesId}?episode=${notificationData.episodeId}`;
  } else if (notificationData.type === 'recommendation') {
    url = `/details/cinema/${notificationData.contentId}`;
  } else if (notificationData.type === 'continue_watching') {
    url = `/watch/${notificationData.contentId}`;
  }

  // Lidar com ações específicas
  if (action === 'watch') {
    url = `/watch/${notificationData.contentId || notificationData.episodeId}`;
  } else if (action === 'dismiss') {
    return; // Apenas fechar
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Se já tem uma janela aberta, focar nela e navegar
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Se não tem janela aberta, abrir nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Fechar notificação
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notificação fechada:', event);
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-new-episodes') {
    event.waitUntil(checkNewEpisodes());
  } else if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Função para verificar novos episódios
async function checkNewEpisodes() {
  console.log('[Service Worker] Verificando novos episódios...');
  // Lógica será implementada no frontend
  return Promise.resolve();
}

// Função para sincronizar notificações
async function syncNotifications() {
  console.log('[Service Worker] Sincronizando notificações...');
  return Promise.resolve();
}
