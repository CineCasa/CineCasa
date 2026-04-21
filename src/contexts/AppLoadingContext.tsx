import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface AppLoadingContextType {
  // Estados de carregamento
  authReady: boolean;
  heroImagesReady: boolean;
  firstContentReady: boolean;
  allCriticalReady: boolean;
  
  // Ações
  setAuthReady: (ready: boolean) => void;
  setHeroImagesReady: (ready: boolean) => void;
  setFirstContentReady: (ready: boolean) => void;
  markCriticalImageLoaded: () => void;
  markCriticalImageError: () => void;
  
  // Contadores
  criticalImagesTotal: number;
  criticalImagesLoaded: number;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

const CRITICAL_IMAGES_TARGET = 5; // Mínimo de imagens críticas para considerar pronto
const MAX_WAIT_TIME = 8000; // Máximo de 8 segundos esperando imagens

export const AppLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [heroImagesReady, setHeroImagesReady] = useState(false);
  const [firstContentReady, setFirstContentReady] = useState(false);
  const [criticalImagesLoaded, setCriticalImagesLoaded] = useState(0);
  const [criticalImagesError, setCriticalImagesError] = useState(0);
  const [forceReady, setForceReady] = useState(false);

  // Forçar ready após timeout máximo
  useEffect(() => {
    if (!authReady) return;
    
    const timer = setTimeout(() => {
      if (!heroImagesReady || !firstContentReady) {
        console.log('[AppLoading] Timeout atingido - forçando ready');
        setForceReady(true);
      }
    }, MAX_WAIT_TIME);

    return () => clearTimeout(timer);
  }, [authReady, heroImagesReady, firstContentReady]);

  const markCriticalImageLoaded = useCallback(() => {
    setCriticalImagesLoaded(prev => {
      const newCount = prev + 1;
      if (newCount >= CRITICAL_IMAGES_TARGET) {
        setHeroImagesReady(true);
      }
      return newCount;
    });
  }, []);

  const markCriticalImageError = useCallback(() => {
    setCriticalImagesError(prev => prev + 1);
    // Mesmo com erro, contamos como "processado" para não travar
    setCriticalImagesLoaded(prev => {
      const newCount = prev + 1;
      if (newCount >= CRITICAL_IMAGES_TARGET) {
        setHeroImagesReady(true);
      }
      return newCount;
    });
  }, []);

  // Verificar se tudo está pronto
  const allCriticalReady = (authReady && (heroImagesReady || forceReady) && (firstContentReady || forceReady)) || forceReady;

  // Log para debug
  useEffect(() => {
    console.log('[AppLoading] Status:', {
      authReady,
      heroImagesReady,
      firstContentReady,
      allCriticalReady,
      criticalImagesLoaded,
      criticalImagesError,
      forceReady
    });
  }, [authReady, heroImagesReady, firstContentReady, allCriticalReady, criticalImagesLoaded, criticalImagesError, forceReady]);

  return (
    <AppLoadingContext.Provider value={{
      authReady,
      heroImagesReady,
      firstContentReady,
      allCriticalReady,
      setAuthReady,
      setHeroImagesReady,
      setFirstContentReady,
      markCriticalImageLoaded,
      markCriticalImageError,
      criticalImagesTotal: CRITICAL_IMAGES_TARGET,
      criticalImagesLoaded
    }}>
      {children}
    </AppLoadingContext.Provider>
  );
};

export const useAppLoading = () => {
  const context = useContext(AppLoadingContext);
  if (context === undefined) {
    throw new Error('useAppLoading must be used within an AppLoadingProvider');
  }
  return context;
};

// Hook utilitário para pré-carregar imagens
export const usePreloadImages = () => {
  const { markCriticalImageLoaded, markCriticalImageError } = useAppLoading();

  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!src || src.trim() === '') {
        markCriticalImageError();
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        markCriticalImageLoaded();
        resolve();
      };
      img.onerror = () => {
        markCriticalImageError();
        resolve();
      };
      img.src = src;
      
      // Timeout de segurança
      setTimeout(() => {
        markCriticalImageError();
        resolve();
      }, 5000);
    });
  }, [markCriticalImageLoaded, markCriticalImageError]);

  const preloadImages = useCallback(async (sources: string[]) => {
    const validSources = sources.filter(src => src && src.trim() !== '');
    await Promise.all(validSources.map(preloadImage));
  }, [preloadImage]);

  return { preloadImage, preloadImages };
};
