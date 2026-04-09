import { useEffect, useRef, useCallback } from 'react';
import { analyzeLoadedChunks, preloadOnInteraction } from '@/utils/codeSplitting';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export function usePerformanceOptimization() {
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});
  const observerRef = useRef<PerformanceObserver | null>(null);

  // Medir Core Web Vitals
  const measureCoreWebVitals = useCallback(() => {
    if (typeof window === 'undefined' || !window.performance) return;

    // First Contentful Paint
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
    if (fcpEntry) {
      metricsRef.current.fcp = fcpEntry.startTime;
    }

    // Time to First Byte
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metricsRef.current.ttfb = navigation.responseStart - navigation.requestStart;
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metricsRef.current.lcp = lastEntry.startTime;
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observerRef.current = lcpObserver;
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            metricsRef.current.cls = clsValue;
          }
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metricsRef.current.fid = (entry as any).processingStart - entry.startTime;
        }
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }, []);

  // Otimizar imagens lazy loading
  const optimizeImages = useCallback(() => {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, { rootMargin: '50px' });

    images.forEach(img => imageObserver.observe(img));
  }, []);

  // Preload critical resources
  const preloadCriticalResources = useCallback(() => {
    // Preload fontes críticas
    const fonts = [
      '/fonts/inter-var.woff2',
      '/fonts/cinzel-var.woff2',
    ];

    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });

    // Preload CSS crítico
    const criticalCSS = [
      '/assets/index.css',
    ];

    criticalCSS.forEach(css => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = css;
      document.head.appendChild(link);
    });
  }, []);

  // Otimizar rolagem
  const optimizeScrolling = useCallback(() => {
    let ticking = false;
    
    const updateScrollPosition = () => {
      // Lógica de otimização de rolagem aqui
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Detectar dispositivo e ajustar configurações
  const detectDeviceAndOptimize = useCallback(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSlowConnection = navigator.connection && 
      (navigator.connection.saveData || 
       (navigator.connection.effectiveType && navigator.connection.effectiveType.includes('2g')));

    // Ajustar configurações baseado no dispositivo
    if (isMobile) {
      document.documentElement.classList.add('mobile-device');
    }

    if (isSlowConnection) {
      document.documentElement.classList.add('slow-connection');
      
      // Reduzir qualidade de imagens em conexões lentas
      document.documentElement.style.setProperty('--image-quality', '70');
    }

    return { isMobile, isSlowConnection };
  }, []);

  // Limpar observadores
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    measureCoreWebVitals();
    optimizeImages();
    preloadCriticalResources();
    const cleanupScroll = optimizeScrolling();
    detectDeviceAndOptimize();

    // Analisar chunks carregados
    setTimeout(() => {
      analyzeLoadedChunks();
    }, 5000);

    // Limpar cache periodicamente
    const cleanupInterval = setInterval(() => {
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('old') || cacheName.includes('temp')) {
              caches.delete(cacheName);
            }
          });
        });
      }
    }, 10 * 60 * 1000); // A cada 10 minutos

    return () => {
      cleanup();
      cleanupScroll();
      clearInterval(cleanupInterval);
    };
  }, [measureCoreWebVitals, optimizeImages, preloadCriticalResources, optimizeScrolling, detectDeviceAndOptimize, cleanup]);

  // Expor métricas para debugging
  const getMetrics = useCallback(() => {
    return {
      ...metricsRef.current,
      timestamp: Date.now(),
    };
  }, []);

  // Enviar métricas para analytics
  const reportMetrics = useCallback(() => {
    const metrics = getMetrics();
    
    // Enviar para serviço de analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        custom_map: {
          fcp: metrics.fcp,
          lcp: metrics.lcp,
          fid: metrics.fid,
          cls: metrics.cls,
          ttfb: metrics.ttfb,
        }
      });
    }

    console.group('📊 Performance Metrics');
    console.log('FCP:', metrics.fcp, 'ms');
    console.log('LCP:', metrics.lcp, 'ms');
    console.log('FID:', metrics.fid, 'ms');
    console.log('CLS:', metrics.cls);
    console.log('TTFB:', metrics.ttfb, 'ms');
    console.groupEnd();
  }, [getMetrics]);

  return {
    getMetrics,
    reportMetrics,
    optimizeImages,
    preloadCriticalResources,
  };
}
