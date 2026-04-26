import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyImageOptions {
  src: string;
  threshold?: number;
  rootMargin?: string;
  priority?: boolean;
}

export const useLazyImage = ({ 
  src, 
  threshold = 0.1, 
  rootMargin = '50px',
  priority = false 
}: UseLazyImageOptions) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Se for prioridade, carrega imediatamente
    if (priority) {
      setIsInView(true);
      return;
    }

    const element = imgRef.current;
    if (!element) return;

    // Criar observer para detectar quando imagem entra na viewport
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Parar de observar após entrar na view
          observerRef.current?.unobserve(element);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, threshold, rootMargin]);

  // Efeito para carregar a imagem quando estiver em view
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setError(false);
    };
    
    img.onerror = () => {
      setError(true);
      setIsLoaded(true); // Marca como loaded mesmo com erro
    };

    img.src = src;

    // Se a imagem já estiver em cache, onload pode não disparar
    if (img.complete) {
      setIsLoaded(true);
    }

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isInView]);

  return { 
    imgRef, 
    isLoaded, 
    isInView,
    error,
    src: isInView ? src : undefined // Só retorna src quando está em view
  };
};

// Hook para carregamento de múltiplas imagens em batch
export const useLazyImageBatch = (imageCount: number, batchSize = 5) => {
  const [loadedCount, setLoadedCount] = useState(0);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  const markVisible = useCallback((index: number) => {
    setVisibleIndices(prev => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  }, []);

  const markLoaded = useCallback(() => {
    setLoadedCount(prev => prev + 1);
  }, []);

  const shouldLoad = useCallback((index: number) => {
    // Carrega em batches - primeiros batchSize itens primeiro
    const batchIndex = Math.floor(index / batchSize);
    const currentBatch = Math.floor(loadedCount / batchSize);
    
    return batchIndex <= currentBatch || visibleIndices.has(index);
  }, [loadedCount, visibleIndices, batchSize]);

  return { 
    markVisible, 
    markLoaded, 
    shouldLoad,
    loadedCount,
    visibleCount: visibleIndices.size 
  };
};

export default useLazyImage;
