import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WorstRatedContent {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  tmdb_rating?: number;
  tmdb_id?: number;
}

interface UseWorstRatedReturn {
  content: WorstRatedContent[];
  isLoading: boolean;
  lastUpdated: string | null;
  refresh: () => Promise<void>;
  isUsingFallback: boolean;
}

// Chave para armazenar o cache no localStorage
const WORST_RATED_CACHE_KEY = 'worst_rated_cache';
const WORST_RATED_TIMESTAMP_KEY = 'worst_rated_timestamp';

export const useWorstRated = (userId?: string): UseWorstRatedReturn => {
  const [content, setContent] = useState<WorstRatedContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const isInitialized = useRef(false);

  const fetchContent = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Verificar se temos cache válido (não forçado)
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(WORST_RATED_CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(WORST_RATED_TIMESTAMP_KEY);
        
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
      
      // Buscar conteúdos de pior avaliação do banco local
      // Primeiro tentar com rating < 4.0, se não encontrar, usar os menores disponíveis
      console.log('[WorstRated] Buscando conteúdos com piores avaliações...');
      
      const [cinemaData, seriesData] = await Promise.all([
        supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, rating, year, tmdb_rating')
          .not('tmdb_rating', 'is', null)  // Apenas com rating TMDB
          .order('tmdb_rating', { ascending: true })
          .limit(15),
        supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, poster, rating, ano, tmdb_rating')
          .not('tmdb_rating', 'is', null)
          .order('tmdb_rating', { ascending: true })
          .limit(15)
      ]);
      
      console.log('[WorstRated] Filmes encontrados:', cinemaData.data?.length || 0);
      console.log('[WorstRated] Séries encontradas:', seriesData.data?.length || 0);
      
      // Logar alguns valores para debug
      if (cinemaData.data && cinemaData.data.length > 0) {
        console.log('[WorstRated] Primeiros filmes:', cinemaData.data.slice(0, 3).map(f => ({
          title: f.titulo,
          tmdb_rating: f.tmdb_rating
        })));
      }
      
      if (seriesData.data && seriesData.data.length > 0) {
        console.log('[WorstRated] Primeiras séries:', seriesData.data.slice(0, 3).map(s => ({
          title: s.titulo,
          tmdb_rating: s.tmdb_rating
        })));
      }

      const combinedContent: WorstRatedContent[] = [
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
          poster: (item as any).poster,
          type: 'series' as const,
          year: item.ano,
          rating: (item as any).rating || `${item.tmdb_rating}/10`,
          tmdb_rating: (item as any).tmdb_rating || undefined,
          tmdb_id: item.tmdb_id || undefined,
        }))
      ];

      // Filtrar conteúdos com rating TMDB válido e ordenar pelos piores
      const validContent = combinedContent.filter(item => item.tmdb_rating !== null && item.tmdb_rating !== undefined);
      
      // Ordenar pelo rating TMDB (piores primeiro)
      const sortedContent = validContent
        .sort((a, b) => (a.tmdb_rating || 10) - (b.tmdb_rating || 10))
        .slice(0, 5); // Pegar os 5 piores

      // Embaralhar para variar a cada carregamento
      const shuffled = sortedContent.sort(() => Math.random() - 0.5);
      
      setContent(shuffled);
      setLastUpdated(new Date().toISOString());
      setIsUsingFallback(false); // Não está usando fallback
      
      // Salvar no cache
      localStorage.setItem(WORST_RATED_CACHE_KEY, JSON.stringify(shuffled));
      localStorage.setItem(WORST_RATED_TIMESTAMP_KEY, Date.now().toString());
      
      console.log('[WorstRated] Carregados', sortedContent.length, 'conteúdos com piores notas');
      console.log('[WorstRated] Conteúdos selecionados:', shuffled.map(c => ({
        title: c.title,
        tmdb_rating: c.tmdb_rating
      })));
      
    } catch (err) {
      console.error('[WorstRated] Erro ao buscar conteúdo:', err);
      
      // Tentar usar cache em caso de erro
      const cachedData = localStorage.getItem(WORST_RATED_CACHE_KEY);
      if (cachedData) {
        const parsedContent = JSON.parse(cachedData);
        setContent(parsedContent);
        const cachedTimestamp = localStorage.getItem(WORST_RATED_TIMESTAMP_KEY);
        setLastUpdated(cachedTimestamp);
      } else {
        // Se não há conteúdo com piores ratings, buscar conteúdos aleatórios como fallback
        console.log('[WorstRated] Nenhum conteúdo com piores ratings, buscando fallback...');
        
        const [fallbackMovies, fallbackSeries] = await Promise.all([
          supabase
            .from('cinema')
            .select('id, tmdb_id, titulo, poster, rating, year, tmdb_rating')
            .not('poster', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('series')
            .select('id_n, tmdb_id, titulo, poster, rating, ano, tmdb_rating')
            .not('poster', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10)
        ]);
        
        const fallbackContent: WorstRatedContent[] = [
          ...(fallbackMovies.data || []).map((item: any) => ({
            id: item.id.toString(),
            title: item.titulo,
            poster: item.poster,
            type: 'movie' as const,
            year: item.year || item.ano,
            rating: item.rating || `${item.tmdb_rating || 'N/A'}/10`,
            tmdb_rating: item.tmdb_rating || undefined,
            tmdb_id: item.tmdb_id || undefined,
          })),
          ...(fallbackSeries.data || []).map((item: any) => ({
            id: item.id_n?.toString() || item.id?.toString(),
            title: item.titulo,
            poster: (item as any).poster,
            type: 'series' as const,
            year: item.ano,
            rating: (item as any).rating || `${item.tmdb_rating || 'N/A'}/10`,
            tmdb_rating: (item as any).tmdb_rating || undefined,
            tmdb_id: item.tmdb_id || undefined,
          }))
        ];
        
        // Embaralhar e pegar 5 aleatórios
        const shuffledFallback = fallbackContent.sort(() => Math.random() - 0.5).slice(0, 5);
        
        setContent(shuffledFallback);
        setLastUpdated(new Date().toISOString());
        setIsUsingFallback(true); // Indicar que está usando fallback
        
        // Salvar no cache
        localStorage.setItem(WORST_RATED_CACHE_KEY, JSON.stringify(shuffledFallback));
        localStorage.setItem(WORST_RATED_TIMESTAMP_KEY, Date.now().toString());
        
        console.log('[WorstRated] Fallback: carregados', shuffledFallback.length, 'conteúdos aleatórios');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    console.log('[WorstRated] Forçando atualização...');
    await fetchContent(true);
  }, [fetchContent]);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      // Limpar cache ao reiniciar o sistema (nova sessão)
      const sessionStart = sessionStorage.getItem('session_start');
      if (!sessionStart) {
        sessionStorage.setItem('session_start', Date.now().toString());
        localStorage.removeItem(WORST_RATED_CACHE_KEY);
        localStorage.removeItem(WORST_RATED_TIMESTAMP_KEY);
        console.log('[WorstRated] Cache limpo ao iniciar nova sessão');
      }
      
      fetchContent(false);
    }
  }, [fetchContent]);

  return {
    content,
    isLoading,
    lastUpdated,
    refresh,
    isUsingFallback,
  };
};

export default useWorstRated;
