import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserAnalytics, GenreAnalytics } from './useUserAnalytics';
import { tmdbImageUrl } from '@/services/tmdb';

export interface Recomendacao {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  backdrop?: string;
  type: 'movie' | 'series';
  year: string;
  rating: string;
  genres: string[];
  matchScore: number;
  reason: string;
  isPersonalized: boolean;
}

interface UseRecomendacoesReturn {
  recomendacoes: Recomendacao[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  topGenres: GenreAnalytics[];
}

const RECOMENDACOES_CACHE_KEY = 'cinecasa_recomendacoes_cache';
const RECOMENDACOES_TIMESTAMP_KEY = 'cinecasa_recomendacoes_timestamp';

export const useRecomendacoes = (userId?: string): UseRecomendacoesReturn => {
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  
  const { topGenres, viewingHistory, trackViewing, refresh: refreshAnalytics } = useUserAnalytics(userId);

  // Calcular score de match entre conteúdo e gêneros do usuário
  const calculateMatchScore = (content: any, userGenres: GenreAnalytics[]): { score: number; matchedGenres: string[] } => {
    const contentGenres: string[] = [];
    
    // Extrair gêneros do conteúdo
    if (content.category) contentGenres.push(content.category);
    if (content.categoria) contentGenres.push(content.categoria);
    if (content.genre) {
      if (Array.isArray(content.genre)) contentGenres.push(...content.genre);
      else contentGenres.push(...content.genre.split(',').map((g: string) => g.trim()));
    }
    if (content.genres) {
      if (Array.isArray(content.genres)) contentGenres.push(...content.genres);
      else contentGenres.push(...content.genres.split(',').map((g: string) => g.trim()));
    }
    
    const matchedGenres: string[] = [];
    let totalScore = 0;
    
    userGenres.forEach((userGenre, index) => {
      const genreMatch = contentGenres.some(cg => 
        cg.toLowerCase().includes(userGenre.genre.toLowerCase()) ||
        userGenre.genre.toLowerCase().includes(cg.toLowerCase())
      );
      
      if (genreMatch) {
        matchedGenres.push(userGenre.genre);
        // Peso decrescente: 1º gênero = 40%, 2º = 25%, 3º = 15%, 4º = 12%, 5º = 8%
        const weights = [0.4, 0.25, 0.15, 0.12, 0.08];
        const weight = weights[index] || 0.05;
        totalScore += userGenre.score * weight;
      }
    });
    
    return { score: totalScore, matchedGenres };
  };

  // Buscar conteúdo dos top 5 gêneros - INTELIGENTE: apenas conteúdo baseado nos hábitos reais do usuário
  const fetchRecomendacoesInteligentes = useCallback(async (forceRefresh = false) => {
    // Se não tiver histórico suficiente, não mostrar recomendações genéricas
    // Retornar vazio para que a seção "Exclusivos para Você" não apareça
    if (!userId || topGenres.length === 0) {
      setRecomendacoes([]);
      setIsLoading(false);
      return;
    }
    
    // Verificar cache
    const cacheKey = `${RECOMENDACOES_CACHE_KEY}_${userId}`;
    const timestampKey = `${RECOMENDACOES_TIMESTAMP_KEY}_${userId}`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      const timestamp = localStorage.getItem(timestampKey);
      
      if (cached && timestamp) {
        const hoursSinceLastLoad = (Date.now() - parseInt(timestamp)) / (1000 * 60 * 60);
        if (hoursSinceLastLoad < 1) { // Cache de 1 hora
          setRecomendacoes(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
      }
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const candidates: Recomendacao[] = [];
      const contentIds = new Set<string>(); // Evitar duplicados
      
      // Já vistos pelo usuário
      const viewedIds = new Set(viewingHistory.map(v => v.contentId));
      
      // Buscar MAIS conteúdo para cada um dos top 5 gêneros para garantir 5 recomendações de qualidade
      for (const genreAnalytics of topGenres.slice(0, 5)) {
        // Buscar em cinema - SEM limite para garantir todos os candidatos
        const { data: filmes, error: errorFilmes } = await supabase
          .from('cinema')
          .select('*')
          .or(`genero.ilike.${genreAnalytics.genre}%,categoria.ilike.${genreAnalytics.genre}%`)
          .order('id', { ascending: false });
        
        if (!errorFilmes && filmes) {
          for (const filme of filmes) {
            const id = filme.id?.toString();
            if (!id || contentIds.has(id) || viewedIds.has(id)) continue;
            
            const { score, matchedGenres } = calculateMatchScore(filme, topGenres);
            
            // Só adicionar se tiver match score significativo (mínimo 0.5)
            if (score >= 0.5) {
              candidates.push({
                id,
                tmdbId: filme.tmdb_id,
                title: filme.titulo,
                poster: filme.poster ? tmdbImageUrl(filme.poster, 'w500') : '',
                backdrop: (filme as any).backdrop,
                type: 'movie',
                year: filme.year,
                rating: filme.rating,
                genres: matchedGenres,
                matchScore: score,
                reason: `Baseado em: ${matchedGenres.slice(0, 2).join(', ')}`,
                isPersonalized: true,
              });
              
              contentIds.add(id);
            }
          }
        }
        
        // Buscar em series - SEM limite
        const { data: series, error: errorSeries } = await supabase
          .from('series')
          .select('*')
          .or(`genero.ilike.${genreAnalytics.genre}%,categoria.ilike.${genreAnalytics.genre}%`)
          .order('id', { ascending: false });
        
        if (!errorSeries && series) {
          for (const serie of series) {
            const id = (serie as any).id?.toString();
            if (!id || contentIds.has(id) || viewedIds.has(id)) continue;
            
            const { score, matchedGenres } = calculateMatchScore(serie, topGenres);
            
            // Só adicionar se tiver match score significativo
            if (score >= 0.5) {
              candidates.push({
                id,
                tmdbId: serie.tmdb_id,
                title: serie.titulo,
                // Séries usam 'capa' conforme schema do banco
                poster: serie.capa ? tmdbImageUrl(serie.capa, 'w500') : (serie.banner ? tmdbImageUrl(serie.banner, 'w500') : ''),
                backdrop: serie.banner ? tmdbImageUrl(serie.banner, 'original') : '',
                type: 'series',
                year: serie.year || '2024',
                rating: 'N/A',
                genres: matchedGenres,
                matchScore: score,
                reason: `Baseado em: ${matchedGenres.slice(0, 2).join(', ')}`,
                isPersonalized: true,
              });
              
              contentIds.add(id);
            }
          }
        }
      }
      
      // Ordenar por score de match (sem limite)
      const sorted = candidates
        .sort((a, b) => b.matchScore - a.matchScore);
      
      // IMPORTANTE: NUNCA completar com populares genéricos
      // Se não tiver 5 recomendações personalizadas de alta qualidade,
      // mostrar apenas as que tiverem match real com os hábitos do usuário
      // Isso garante que a seção só mostre conteúdo realmente relevante
      
      // Salvar no cache
      localStorage.setItem(cacheKey, JSON.stringify(sorted));
      localStorage.setItem(timestampKey, Date.now().toString());
      
      setRecomendacoes(sorted);
    } catch (err: any) {
      setError('Erro ao carregar recomendações');
      console.error('Error loading recomendacoes:', err);
    }
  }, [userId, topGenres, viewingHistory]);
  
  // Buscar populares genéricos (fallback)
  const fetchPopularesGenericos = async () => {
    try {
      const { data } = await supabase
        .from('cinema')
        .select('*')
        .order('id', { ascending: false })
        .limit(5);
      
      if (data) {
        const genericos = data.map((item: any) => ({
          id: item.id.toString(),
          title: item.titulo,
          poster: item.poster ? tmdbImageUrl(item.poster, 'w500') : '',
          backdrop: item.backdrop,
          type: 'movie' as const,
          year: item.year,
          rating: item.rating,
          genres: [],
          matchScore: 0,
          reason: 'Populares',
          isPersonalized: false,
        }));
        
        setRecomendacoes(genericos);
      }
    } catch (err) {
      console.error('Error loading genericos:', err);
    }
  };

  const refresh = useCallback(async () => {
    await refreshAnalytics();
    await fetchRecomendacoesInteligentes(true);
  }, [refreshAnalytics, fetchRecomendacoesInteligentes]);

  // Carregar na montagem
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      fetchRecomendacoesInteligentes();
    }
  }, [fetchRecomendacoesInteligentes]);

  // Recarregar quando topGenres mudar
  useEffect(() => {
    if (isInitialized.current && topGenres.length > 0) {
      fetchRecomendacoesInteligentes(true);
    }
  }, [topGenres.length, fetchRecomendacoesInteligentes]);

  return {
    recomendacoes,
    isLoading,
    error,
    refresh,
    topGenres,
  };
};

export default useRecomendacoes;
