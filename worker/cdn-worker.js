// Cloudflare Worker para CDN e Cache inteligente
// CineCasa v4 - Zero Downtime Updates

const CACHE_TTL = 60; // 1 minuto para HTML
const ASSET_CACHE_TTL = 31536000; // 1 ano para assets
const API_CACHE_TTL = 300; // 5 minutos para APIs

// Configuração de headers de cache
const CACHE_HEADERS = {
  html: {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Build-Version': process.env.BUILD_VERSION || 'unknown',
    'X-CDN-Cache': 'MISS'
  },
  assets: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-CDN-Cache': 'HIT'
  },
  api: {
    'Cache-Control': 'public, max-age=300, must-revalidate',
    'X-CDN-Cache': 'API'
  }
};

// Detectar tipo de conteúdo
function getContentType(url) {
  if (url.includes('/assets/') || url.endsWith('.js') || url.endsWith('.css')) {
    return 'assets';
  }
  if (url.includes('/api/') || url.includes('/supabase/')) {
    return 'api';
  }
  return 'html';
}

// Verificar se é uma requisição de atualização
function isUpdateRequest(request) {
  const url = new URL(request.url);
  return url.searchParams.has('v') || 
         url.searchParams.has('t') || 
         url.searchParams.has('bust') ||
         request.headers.get('Cache-Control') === 'no-cache';
}

// Manipular CORS
function handleCORS() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };
  
  return new Response(null, { 
    status: 200, 
    headers 
  });
}

// Adicionar headers de segurança
function addSecurityHeaders(response, url) {
  const headers = new Headers(response.headers);
  
  // Headers de segurança
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Headers de performance
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('X-Download-Options', 'noopen');
  
  // Headers específicos para PWA
  if (url.pathname === '/' || url.pathname === '/index.html') {
    headers.set('X-PWA-Version', process.env.BUILD_VERSION || 'unknown');
    headers.set('X-Service-Worker-Allowed', '/');
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Cache inteligente
async function handleRequest(request) {
  const url = new URL(request.url);
  const contentType = getContentType(url.pathname);
  const isUpdate = isUpdateRequest(request);
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }
  
  // Apenas GET requests são cacheadas
  if (request.method !== 'GET') {
    const response = await fetch(request);
    return addSecurityHeaders(response, url);
  }
  
  // Para atualizações, sempre buscar do origin
  if (isUpdate) {
    console.log(`[CDN Worker] Update request: ${url.pathname}`);
    const response = await fetch(request);
    const securedResponse = addSecurityHeaders(response, url);
    
    // Adicionar headers de cache atualizados
    const headers = new Headers(securedResponse.headers);
    headers.set('X-Cache-Status', 'BYPASS');
    headers.set('X-Update-Timestamp', new Date().toISOString());
    
    return new Response(securedResponse.body, {
      status: securedResponse.status,
      headers
    });
  }
  
  // Tentar cache primeiro
  const cacheKey = new Request(request.url, {
    method: 'GET',
    headers: request.headers
  });
  
  const cache = caches.default;
  let response = await cache.match(cacheKey);
  
  if (response) {
    // Verificar se o cache ainda é válido
    const cacheTime = response.headers.get('X-Cache-Time');
    const cacheAge = cacheTime ? (Date.now() - parseInt(cacheTime)) / 1000 : Infinity;
    const maxAge = contentType === 'assets' ? ASSET_CACHE_TTL : 
                   contentType === 'api' ? API_CACHE_TTL : CACHE_TTL;
    
    if (cacheAge < maxAge) {
      console.log(`[CDN Worker] Cache HIT: ${url.pathname}`);
      const headers = new Headers(response.headers);
      headers.set('X-Cache-Status', 'HIT');
      headers.set('X-Cache-Age', Math.floor(cacheAge).toString());
      
      return new Response(response.body, {
        status: response.status,
        headers
      });
    }
  }
  
  // Cache miss ou expirado - buscar do origin
  console.log(`[CDN Worker] Cache MISS: ${url.pathname}`);
  
  try {
    const originResponse = await fetch(request);
    
    // Clonar response para cache
    const responseToCache = originResponse.clone();
    
    // Adicionar headers de cache
    const cacheHeaders = new Headers(responseToCache.headers);
    cacheHeaders.set('X-Cache-Time', Date.now().toString());
    cacheHeaders.set('X-Cache-Status', 'MISS');
    
    // Adicionar headers específicos por tipo
    const typeHeaders = CACHE_HEADERS[contentType] || CACHE_HEADERS.html;
    Object.entries(typeHeaders).forEach(([key, value]) => {
      cacheHeaders.set(key, value);
    });
    
    // Salvar no cache
    const cacheResponse = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: cacheHeaders
    });
    
    // Cache em background (não bloquear)
    cache.put(cacheKey, cacheResponse.clone()).catch(() => {
      console.log(`[CDN Worker] Cache save failed: ${url.pathname}`);
    });
    
    // Retornar response com segurança headers
    return addSecurityHeaders(originResponse, url);
    
  } catch (error) {
    console.error(`[CDN Worker] Origin fetch failed: ${url.pathname}`, error);
    
    // Tentar servir do cache mesmo que expirado
    if (response) {
      const headers = new Headers(response.headers);
      headers.set('X-Cache-Status', 'STALE');
      headers.set('X-Cache-Error', 'origin-failed');
      
      return new Response(response.body, {
        status: response.status,
        headers
      });
    }
    
    // Retornar erro 503
    return new Response('Service Temporarily Unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60',
        'X-Cache-Status': 'ERROR'
      }
    });
  }
}

// Event listener principal
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// Event listener para scheduled tasks (limpeza de cache)
addEventListener('scheduled', event => {
  event.waitUntil(
    (async () => {
      console.log('[CDN Worker] Scheduled cache cleanup');
      
      // Limpar caches antigos
      const cache = caches.default;
      const keys = await cache.keys();
      const now = Date.now();
      
      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const cacheTime = response.headers.get('X-Cache-Time');
          if (cacheTime && (now - parseInt(cacheTime)) > (ASSET_CACHE_TTL * 1000)) {
            await cache.delete(key);
            console.log(`[CDN Worker] Cleaned expired cache: ${key.url}`);
          }
        }
      }
    })()
  );
});

// Health check endpoint
addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/__cdn-health') {
    event.respondWith(
      new Response(JSON.stringify({
        status: 'healthy',
        version: process.env.BUILD_VERSION || 'unknown',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - globalThis.startTime
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
    );
  }
});

console.log('[CDN Worker] CineCasa CDN Worker initialized');
globalThis.startTime = Date.now();
