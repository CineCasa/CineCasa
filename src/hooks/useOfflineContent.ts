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
