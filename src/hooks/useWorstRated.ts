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
      
      // SEMPRE buscar novos filmes a cada reinício (sem cache persistente)
      // Removido cache para garantir atualização a cada reinício como solicitado
      
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
        .lt('rating', '6.0')  // Apenas filmes com rating menor que 5.99
        .limit(20);
        
      console.log('[WorstRated] Filmes com baixa avaliação:', lowRatedMovies?.length || 0);
      
      if (error) {
        console.error('[WorstRated] Erro:', error);
      }
      
      // Buscar filmes adicionais se necessário para completar 5
      let allLowRatedMovies = lowRatedMovies || [];
      
      if (allLowRatedMovies.length < 5) {
        console.log(`[WorstRated] Apenas ${allLowRatedMovies.length} filmes com nota < 5.99, buscando mais...`);
        
        const { data: additionalMovies } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, rating, year')
          .not('poster', 'is', null)
          .not('rating', 'is', null)
          .gte('rating', '6.0')  // Filmes com nota >= 6.0 para completar
          .limit(10);
          
        allLowRatedMovies = [...allLowRatedMovies, ...(additionalMovies || [])];
      }
      
      // Se ainda não temos 5, buscar qualquer filme
      if (allLowRatedMovies.length < 5) {
        console.log('[WorstRated] Buscando filmes adicionais para completar 5...');
        
        const { data: anyMovies } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, rating, year')
          .not('poster', 'is', null)
          .limit(10);
          
        allLowRatedMovies = [...allLowRatedMovies, ...(anyMovies || [])];
      }
      
      // Formatar filmes
      const movieContent: WorstRatedContent[] = allLowRatedMovies.map((item: any) => ({
        id: item.id.toString(),
        title: item.titulo,
        poster: item.poster,
        type: 'movie' as const,
        year: item.year || 'N/A',
        rating: item.rating || 'N/A',
        tmdb_id: item.tmdb_id || undefined,
      }));
      
      // Embaralhar e pegar exatamente 5 filmes
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
      console.log('[useWorstRated] Inicializando carregamento...');
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
