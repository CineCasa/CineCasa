import { useState, useEffect, useCallback } from 'react';

interface OfflineContent {
  id: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  type: 'movie' | 'series';
  duration?: number;
  year?: number;
  genre?: string[];
  rating?: number;
  url?: string;
  localPath?: string;
  cachedAt: number;
  size: number;
  lastAccessed: number;
}

interface OfflineStorage {
  content: OfflineContent[];
  favorites: string[];
  watchProgress: Record<string, {
    currentTime: number;
    duration: number;
    lastUpdated: number;
  }>;
  settings: {
    maxCacheSize: number;
    autoDownload: boolean;
    wifiOnly: boolean;
    quality: 'low' | 'medium' | 'high';
  };
}

const STORAGE_KEY = 'cinecasa-offline';
const DEFAULT_STORAGE: OfflineStorage = {
  content: [],
  favorites: [],
  watchProgress: {},
  settings: {
    maxCacheSize: 1024 * 1024 * 1024, // 1GB
    autoDownload: false,
    wifiOnly: true,
    quality: 'medium',
  },
};

export function useOfflineContent() {
  const [storage, setStorage] = useState<OfflineStorage>(DEFAULT_STORAGE);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheSize, setCacheSize] = useState(0);
  const [isCaching, setIsCaching] = useState(false);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setStorage({
          ...DEFAULT_STORAGE,
          ...parsed,
          settings: {
            ...DEFAULT_STORAGE.settings,
            ...parsed.settings,
          },
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados offline:', error);
    }
  }, []);

  // Salvar dados no localStorage
  const saveStorage = useCallback((newStorage: OfflineStorage) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStorage));
      setStorage(newStorage);
    } catch (error) {
      console.error('Erro ao salvar dados offline:', error);
    }
  }, []);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calcular tamanho do cache
  useEffect(() => {
    const totalSize = storage.content.reduce((acc, item) => acc + item.size, 0);
    setCacheSize(totalSize);
  }, [storage.content]);

  // Verificar se conteúdo está disponível offline
  const isContentAvailableOffline = useCallback((contentId: string) => {
    return storage.content.some(item => item.id === contentId && item.localPath);
  }, [storage.content]);

  // Obter conteúdo offline
  const getOfflineContent = useCallback((contentId: string) => {
    return storage.content.find(item => item.id === contentId);
  }, [storage.content]);

  // Adicionar conteúdo ao cache
  const cacheContent = useCallback(async (content: Omit<OfflineContent, 'cachedAt' | 'size' | 'lastAccessed'>) => {
    if (!isOnline) {
      return { success: false, error: 'Offline mode' };
    }

    // Verificar se já está em cache
    const existing = storage.content.find(item => item.id === content.id);
    if (existing) {
      return { success: true, message: 'Already cached' };
    }

    // Verificar espaço disponível
    const contentSize = estimateContentSize(content);
    if (cacheSize + contentSize > storage.settings.maxCacheSize) {
      return { success: false, error: 'Insufficient cache space' };
    }

    setIsCaching(true);

    try {
      // Baixar conteúdo
      const response = await fetch(content.url || content.poster);
      const blob = await response.blob();
      
      // Criar URL local
      const localPath = URL.createObjectURL(blob);
      
      const offlineContent: OfflineContent = {
        ...content,
        localPath,
        cachedAt: Date.now(),
        size: contentSize,
        lastAccessed: Date.now(),
      };

      const newContent = [...storage.content, offlineContent];
      saveStorage({ ...storage, content: newContent });

      return { success: true, localPath };
    } catch (error) {
      console.error('Erro ao fazer cache do conteúdo:', error);
      return { success: false, error };
    } finally {
      setIsCaching(false);
    }
  }, [isOnline, cacheSize, storage, saveStorage]);

  // Remover conteúdo do cache
  const removeCachedContent = useCallback((contentId: string) => {
    const content = storage.content.find(item => item.id === contentId);
    if (content?.localPath) {
      URL.revokeObjectURL(content.localPath);
    }

    const newContent = storage.content.filter(item => item.id !== contentId);
    saveStorage({ ...storage, content: newContent });
  }, [storage, saveStorage]);

  // Limpar cache antigo
  const cleanOldCache = useCallback(() => {
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

    const newContent = storage.content.filter(item => {
      const age = now - item.cachedAt;
      return age < maxAge;
    });

    saveStorage({ ...storage, content: newContent });
  }, [storage, saveStorage]);

  // Adicionar aos favoritos offline
  const addToOfflineFavorites = useCallback((contentId: string) => {
    if (!storage.favorites.includes(contentId)) {
      const newFavorites = [...storage.favorites, contentId];
      saveStorage({ ...storage, favorites: newFavorites });
    }
  }, [storage, saveStorage]);

  // Remover dos favoritos offline
  const removeFromOfflineFavorites = useCallback((contentId: string) => {
    const newFavorites = storage.favorites.filter(id => id !== contentId);
    saveStorage({ ...storage, favorites: newFavorites });
  }, [storage, saveStorage]);

  // Atualizar progresso de visualização
  const updateWatchProgress = useCallback((contentId: string, currentTime: number, duration: number) => {
    const newProgress = {
      ...storage.watchProgress,
      [contentId]: {
        currentTime,
        duration,
        lastUpdated: Date.now(),
      },
    };

    saveStorage({ ...storage, watchProgress: newProgress });
  }, [storage, saveStorage]);

  // Obter progresso de visualização
  const getWatchProgress = useCallback((contentId: string) => {
    return storage.watchProgress[contentId];
  }, [storage.watchProgress]);

  // Obter favoritos offline
  const getOfflineFavorites = useCallback(() => {
    return storage.content.filter(item => storage.favorites.includes(item.id));
  }, [storage.content, storage.favorites]);

  // Sincronizar quando online
  const syncWhenOnline = useCallback(async () => {
    if (!isOnline) return;

    // Sincronizar favoritos
    try {
      const response = await fetch('/api/sync/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: storage.favorites }),
      });
      
      if (response.ok) {
        const { favorites } = await response.json();
        saveStorage({ ...storage, favorites });
      }
    } catch (error) {
      console.error('Erro ao sincronizar favoritos:', error);
    }
  }, [isOnline, storage, saveStorage]);

  // Estimar tamanho do conteúdo
  const estimateContentSize = (content: any): number => {
    // Estimativa baseada no tipo e qualidade
    const baseSize = content.type === 'movie' ? 500 * 1024 * 1024 : 200 * 1024 * 1024; // 500MB para filmes, 200MB para séries
    
    const qualityMultiplier = {
      low: 0.5,
      medium: 1,
      high: 2,
    };

    return baseSize * (qualityMultiplier[storage.settings.quality] || 1);
  };

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    const totalItems = storage.content.length;
    const totalSize = cacheSize;
    const maxCacheSize = storage.settings.maxCacheSize;
    const usagePercentage = (totalSize / maxCacheSize) * 100;

    const byType = storage.content.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byAge = storage.content.reduce((acc, item) => {
      const age = Date.now() - item.cachedAt;
      const days = Math.floor(age / (24 * 60 * 60 * 1000));
      
      if (days < 1) acc.recent = (acc.recent || 0) + 1;
      else if (days < 7) acc.week = (acc.week || 0) + 1;
      else acc.old = (acc.old || 0) + 1;
      
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      totalSize,
      maxCacheSize,
      usagePercentage,
      freeSpace: maxCacheSize - totalSize,
      byType,
      byAge,
    };
  }, [storage.content, cacheSize]);

  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<OfflineStorage['settings']>) => {
    const updatedSettings = { ...storage.settings, ...newSettings };
    saveStorage({ ...storage, settings: updatedSettings });
  }, [storage, saveStorage]);

  // Limpar todo o cache
  const clearAllCache = useCallback(() => {
    // Revogar todas as URLs
    storage.content.forEach(item => {
      if (item.localPath) {
        URL.revokeObjectURL(item.localPath);
      }
    });

    saveStorage({
      ...storage,
      content: [],
      watchProgress: {},
    });
  }, [storage, saveStorage]);

  // Auto-sincronização quando voltar online
  useEffect(() => {
    if (isOnline && storage.settings.autoDownload) {
      syncWhenOnline();
    }
  }, [isOnline, storage.settings.autoDownload, syncWhenOnline]);

  return {
    // Estado
    storage,
    isOnline,
    cacheSize,
    isCaching,
    
    // Dados
    offlineContent: storage.content,
    offlineFavorites: getOfflineFavorites(),
    cacheStats: getCacheStats(),
    
    // Ações
    cacheContent,
    removeCachedContent,
    cleanOldCache,
    clearAllCache,
    addToOfflineFavorites,
    removeFromOfflineFavorites,
    updateWatchProgress,
    getWatchProgress,
    syncWhenOnline,
    updateSettings,
    
    // Utilitários
    isContentAvailableOffline,
    getOfflineContent,
    getCacheStats,
    
    // Estados derivados
    hasOfflineContent: storage.content.length > 0,
    cacheUsagePercentage: (cacheSize / storage.settings.maxCacheSize) * 100,
    isNearLimit: (cacheSize / storage.settings.maxCacheSize) > 0.9,
  };
}
