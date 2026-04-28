import { useState, useEffect, useCallback, useRef } from 'react';
import { top5Service } from '@/services/top5Streamings';
import { Top5Content, MissingContent } from '@/types/top5';

interface UseTop5StreamingsReturn {
  top5: Top5Content[];
  missing: MissingContent[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: string | null;
}

export const useTop5Streamings = (): UseTop5StreamingsReturn => {
  const [top5, setTop5] = useState<Top5Content[]>([]);
  const [missing, setMissing] = useState<MissingContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const fetchTop5 = useCallback(async (forceRefresh = true) => {
    // Forçar atualização sempre em localhost para garantir conteúdo fresco
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Se já temos cache e não precisa atualizar, usar cache (apenas em produção)
    if (!isLocalhost && !forceRefresh && !top5Service.needsUpdate() && top5Service.getCache()) {
      const cachedTop5 = top5Service.getCache();
      const cachedMissing = top5Service.getMissingCache();
      const cachedLastUpdate = top5Service.getLastUpdate();

      if (cachedTop5) {
        setTop5(cachedTop5);
        setMissing(cachedMissing || []);
        setLastUpdated(cachedLastUpdate);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const { top5: data, missing: missingData } = await top5Service.compileTop5List();
      
      setTop5(data);
      setMissing(missingData);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError('Erro ao carregar Top 5 dos streamings');
      console.error('Error loading top 5:', err);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchTop5(true);
  }, [fetchTop5]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchTop5();
    }
  }, [fetchTop5]);

  // Atualizar automaticamente a cada 15 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (top5Service.needsUpdate()) {
        fetchTop5(true);
      }
    }, 15 * 60 * 1000); // Verificar a cada 15 minutos

    return () => clearInterval(interval);
  }, [fetchTop5]);

  return {
    top5,
    missing,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
};

export default useTop5Streamings;
