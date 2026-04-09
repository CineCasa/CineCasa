import { lazy } from 'react';

// Lazy loading para componentes principais
export const LazyAdmin = lazy(() => import('@/pages/Admin'));
export const LazyAdvancedSearch = lazy(() => import('@/pages/AdvancedSearch'));
export const LazyStreamingHome = lazy(() => import('@/pages/StreamingHome'));
export const LazyFavorites = lazy(() => import('@/pages/Favorites'));
export const LazyTVLive = lazy(() => import('@/pages/TvAoVivo'));

// Lazy loading para componentes de conteúdo
export const LazyDynamicCategoryRow = lazy(() => import('@/components/DynamicCategoryRow'));
export const LazyContinueWatchingRow = lazy(() => import('@/components/ContinueWatchingRow'));

// Lazy loading para componentes de UI
export const LazyFilterSystem = lazy(() => import('@/components/FilterSystem'));
export const LazyFinanceSection = lazy(() => import('@/components/FinanceSection'));
export const LazyHeroBanner = lazy(() => import('@/components/HeroBanner'));
export const LazyPremiumNavbar = lazy(() => import('@/components/PremiumNavbar'));

// Função para preload de rota
export const preloadRoute = (routePath: string) => {
  const componentMap: Record<string, () => Promise<any>> = {
    '/admin': () => import('@/pages/Admin'),
    '/search': () => import('@/pages/AdvancedSearch'),
    '/home': () => import('@/pages/StreamingHome'),
    '/favorites': () => import('@/pages/Favorites'),
    '/tv-live': () => import('@/pages/TvAoVivo'),
    '/details': () => import('@/pages/Details'),
    '/cinema': () => import('@/pages/Cinema'),
    '/series': () => import('@/pages/Series'),
  };

  const loader = componentMap[routePath];
  if (loader) {
    // Iniciar preload mas não esperar
    loader();
  }
};

// Preload baseado em interação do usuário
export const preloadOnInteraction = (routePath: string, element: HTMLElement) => {
  const preload = () => preloadRoute(routePath);
  
  // Preload no hover
  element.addEventListener('mouseenter', preload, { once: true });
  
  // Preload no touch start (mobile)
  element.addEventListener('touchstart', preload, { once: true });
  
  // Preload no focus (acessibilidade)
  element.addEventListener('focus', preload, { once: true });
};

// Preload inteligente baseado em viewport
export const preloadOnViewport = (routePath: string, element: HTMLElement) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          preloadRoute(routePath);
          observer.disconnect();
        }
      });
    },
    { rootMargin: '50px' } // Preload quando estiver 50px perto do viewport
  );

  observer.observe(element);
};

// Mapeamento de chunks para análise
export const CHUNK_NAMES = {
  'admin': 'Admin Panel',
  'search': 'Advanced Search',
  'home': 'Streaming Home',
  'favorites': 'Favorites',
  'tv-live': 'TV Live',
  'details': 'Content Details',
  'cinema': 'Cinema Page',
  'series': 'Series Page',
  'category-row': 'Category Components',
  'filter-system': 'Filter Components',
  'finance': 'Finance Components',
} as const;

// Função para analisar chunks carregados
export const analyzeLoadedChunks = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const chunks = entries
      .filter(entry => entry.name.includes('.js') && entry.name.includes('chunk'))
      .map(entry => ({
        name: entry.name,
        size: entry.transferSize || 0,
        loadTime: entry.responseEnd - entry.requestStart,
      }));

    console.group('📊 Loaded Chunks Analysis');
    chunks.forEach(chunk => {
      console.log(`📦 ${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB (${chunk.loadTime}ms)`);
    });
    console.groupEnd();

    return chunks;
  }
  
  return [];
};

// Configuração de splitting otimizada
export const SPLITTING_CONFIG = {
  // Tamanho máximo dos chunks
  maxChunkSize: 244 * 1024, // 244KB
  
  // Mínimo de chunks por página
  minChunks: 1,
  
  // Máximo de requisições paralelas
  maxAsyncRequests: 6,
  
  // Priorizar chunks mais usados
  prioritizeUsed: true,
  
  // Timeout para preload
  preloadTimeout: 3000, // 3 segundos
} as const;
