// Service Worker para CineCasa PWA - Versão ULTRA MÍNIMA v10
// SIMPLIFICADO: Não intercepta requisições para evitar problemas com Supabase
const CACHE_VERSION = 'v10';

self.addEventListener('install', e => {
  console.log('[SW v10] Instalando...');
  e.waitUntil(caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('[SW v10] Ativado');
  e.waitUntil(self.clients.claim());
});

// NÃO INTERCEPTAR fetch - deixa tudo passar direto
