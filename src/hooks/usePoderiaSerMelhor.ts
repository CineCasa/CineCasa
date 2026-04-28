import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PoderiaContent {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  tmdb_rating?: number;
  tmdb_id?: number;
}

interface UsePoderiaSerMelhorReturn {
  content: PoderiaContent[];
  isLoading: boolean;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
}

// Chave para armazenar o cache no localStorage
const PODERIA_CACHE_KEY = 'poderia_ser_melhor_cache';
const PODERIA_CACHE_TIMESTAMP_KEY = 'poderia_ser_melhor_timestamp';

export const usePoderiaSerMelhor = (userId?: string): UsePoderiaSerMelhorReturn => {
  const [content, setContent] = useState<PoderiaContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Verificar se temos cache válido (não forçado)
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(PODERIA_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(PODERIA_CACHE_TIMESTAMP_KEY);
        
        if (cachedData && cachedTimestamp) {
          const cacheAge = Date.now() - parseInt(cachedTimestamp);
          // Cache válido por 24 horas ou até reiniciar o sistema
          if (cacheAge < 24 * 60 * 60 * 1000) {
            const parsedContent = JSON.parse(cachedData);
            setContent(parsedContent);
            setLastUpdated(cachedTimestamp);
            setIsLoading(false);
            return;
          }
        }
      }
      
      // Buscar conteúdos de baixa avaliação do banco local
      // Filtrar por rating TMDB < 5.0 (piores notas)
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, rating, year, tmdb_rating')
          .lt('tmdb_rating', '5.0')  // Avaliação TMDB menor que 5.0
          .not('tmdb_rating', 'is', null)  // Excluir nulos
          .order('tmdb_rating', { ascending: true })
          .limit(10),  // Buscar mais itens para depois filtrar
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, banner, ano, tmdb_rating')
          .lt('tmdb_rating', '5.0')
          .not('tmdb_rating', 'is', null)
          .order('tmdb_rating', { ascending: true })
          .limit(10)
      ]);

      const combinedContent: PoderiaContent[] = [
        ...(cinemaData.data || []).map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          poster: item.poster,
          type: 'movie' as const,
          year: item.year || item.ano,
          rating: item.rating || `${item.tmdb_rating}/10`,
          tmdb_rating: item.tmdb_rating || undefined,
          tmdb_id: item.tmdb_id || undefined,
        })),
        ...(seriesData.data || []).map((item: any) => ({
          id: item.id_n?.toString() || item.id?.toString(),
          title: item.titulo,
          poster: item.banner,
          type: 'series' as const,
          year: item.ano,
          rating: item.rating || `${item.tmdb_rating}/10`,
          tmdb_rating: item.tmdb_rating || undefined,
          tmdb_id: item.tmdb_id || undefined,
        }))
      ];

      // Ordenar pelo rating TMDB (piores primeiro) e pegar apenas 5
      const sortedContent = combinedContent
        .sort((a, b) => (a.tmdb_rating || 10) - (b.tmdb_rating || 10))
        .slice(0, 5);

      // Embaralhar para variar a cada carregamento
      const shuffled = sortedContent.sort(() => Math.random() - 0.5);
      
      setContent(shuffled);
      setLastUpdated(new Date().toISOString());
      
      // Salvar no cache
      localStorage.setItem(PODERIA_CACHE_KEY, JSON.stringify(shuffled));
      localStorage.setItem(PODERIA_CACHE_TIMESTAMP_KEY, Date.now().toString());
      
    } catch (err) {
      console.error('[PoderiaSerMelhor] Erro ao buscar conteúdo:', err);
      
      // Tentar usar cache em caso de erro
      const cachedData = localStorage.getItem(PODERIA_CACHE_KEY);
      if (cachedData) {
        const parsedContent = JSON.parse(cachedData);
        setContent(parsedContent);
        const cachedTimestamp = localStorage.getItem(PODERIA_CACHE_TIMESTAMP_KEY);
        setLastUpdated(cachedTimestamp);
      } else {
        setContent([]);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    console.log('[PoderiaSerMelhor] Forçando atualização...');
    await fetchContent(true);
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      // Limpar cache ao reiniciar o sistema (nova sessão)
      const sessionStart = sessionStorage.getItem('session_start');
      if (!sessionStart) {
        sessionStorage.setItem('session_start', Date.now().toString());
        localStorage.removeItem(PODERIA_CACHE_KEY);
        localStorage.removeItem(PODERIA_CACHE_TIMESTAMP_KEY);
      }
      
      fetchContent(false);
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    lastUpdated,
    refresh,
  };
};

export default usePoderiaSerMelhor;
