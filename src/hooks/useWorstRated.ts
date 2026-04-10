import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WorstRatedContent {
  id: string;
  title: string;
  poster: string;
  type: 'movie';
  year: string;
  rating: string;
  tmdb_id?: string;
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
      
      // Buscar apenas filmes com baixa avaliação (rating < 5.0)
      console.log('[WorstRated] Buscando filmes com baixa avaliação...');
      
      const { data: lowRatedMovies, error } = await supabase
        .from('cinema')
        .select('id, tmdb_id, titulo, poster, rating, year')
        .not('poster', 'is', null)
        .not('rating', 'is', null)
        .lt('rating', '5.0')  // Apenas filmes com rating menor que 5.0
        .limit(20);
        
      console.log('[WorstRated] Filmes com baixa avaliação:', lowRatedMovies?.length || 0);
      
      if (error) {
        console.error('[WorstRated] Erro:', error);
      }
      
      // Se não encontrou filmes com baixa avaliação, buscar filmes aleatórios
      if (!lowRatedMovies || lowRatedMovies.length === 0) {
        console.log('[WorstRated] Nenhum filme com baixa avaliação, buscando filmes aleatórios...');
        
        const { data: randomMovies } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, rating, year')
          .not('poster', 'is', null)
          .limit(10);
          
        const fallbackContent: WorstRatedContent[] = (randomMovies || []).map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          poster: item.poster,
          type: 'movie' as const,
          year: item.year || 'N/A',
          rating: item.rating || 'N/A',
          tmdb_id: item.tmdb_id || undefined,
        }));
        
        const shuffledFallback = fallbackContent.sort(() => Math.random() - 0.5).slice(0, 5);
        
        setContent(shuffledFallback);
        setLastUpdated(new Date().toISOString());
        setIsUsingFallback(true);
        
        localStorage.setItem(WORST_RATED_CACHE_KEY, JSON.stringify(shuffledFallback));
        localStorage.setItem(WORST_RATED_TIMESTAMP_KEY, Date.now().toString());
        
        console.log('[WorstRated] Fallback: carregados', shuffledFallback.length, 'filmes aleatórios');
        return;
      }
      
      // Apenas filmes com baixa avaliação
      const movieContent: WorstRatedContent[] = lowRatedMovies.map((item: any) => ({
        id: item.id.toString(),
        title: item.titulo,
        poster: item.poster,
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
        tmdb_id: item.tmdb_id || undefined,
      }));
      
      // Embaralhar e pegar 5 filmes
      const shuffledMovies = movieContent.sort(() => Math.random() - 0.5).slice(0, 5);
      
      setContent(shuffledMovies);
      setLastUpdated(new Date().toISOString());
      setIsUsingFallback(false);
      
      // Salvar no cache
      localStorage.setItem(WORST_RATED_CACHE_KEY, JSON.stringify(shuffledMovies));
      localStorage.setItem(WORST_RATED_TIMESTAMP_KEY, Date.now().toString());
      
      console.log('[WorstRated] Carregados', shuffledMovies.length, 'filmes com baixa avaliação');
      
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
        // Se não há cache, buscar filmes aleatórios
        console.log('[WorstRated] Erro - buscando filmes de emergência...');
        
        const { data: emergencyMovies } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, rating, year')
          .limit(10);
        
        const emergencyContent: WorstRatedContent[] = (emergencyMovies || []).map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          poster: item.poster || '/api/placeholder/300/450',
          type: 'movie' as const,
          year: item.year || 'N/A',
          rating: item.rating || 'N/A',
          tmdb_id: item.tmdb_id || undefined,
        }));
        
        const shuffledEmergency = emergencyContent.sort(() => Math.random() - 0.5).slice(0, 5);
        setContent(shuffledEmergency);
        setLastUpdated(new Date().toISOString());
        setIsUsingFallback(true);
        
        localStorage.setItem(WORST_RATED_CACHE_KEY, JSON.stringify(shuffledEmergency));
        localStorage.setItem(WORST_RATED_TIMESTAMP_KEY, Date.now().toString());
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
