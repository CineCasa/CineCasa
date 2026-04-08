import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserViewingHistory {
  contentId: string;
  title: string;
  type: 'movie' | 'series';
  category?: string;
  genre?: string[];
  watchedAt: string;
  completionRate: number;
}

export interface GenreAnalytics {
  genre: string;
  count: number;
  score: number;
  lastWatched: string;
}

interface UseUserAnalyticsReturn {
  topGenres: GenreAnalytics[];
  viewingHistory: UserViewingHistory[];
  isLoading: boolean;
  trackViewing: (content: any, completionRate?: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const VIEWING_HISTORY_KEY = 'cinecasa_viewing_history';

export const useUserAnalytics = (userId?: string): UseUserAnalyticsReturn => {
  const [topGenres, setTopGenres] = useState<GenreAnalytics[]>([]);
  const [viewingHistory, setViewingHistory] = useState<UserViewingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extrair gêneros/categorias do conteúdo
  const extractGenres = (content: any): string[] => {
    const genres: string[] = [];
    
    // Categoria principal
    if (content.category) {
      genres.push(content.category);
    }
    
    // Gêneros (se existir campo genre ou genres)
    if (content.genre) {
      if (Array.isArray(content.genre)) {
        genres.push(...content.genre);
      } else if (typeof content.genre === 'string') {
        genres.push(...content.genre.split(',').map((g: string) => g.trim()));
      }
    }
    
    if (content.genres) {
      if (Array.isArray(content.genres)) {
        genres.push(...content.genres);
      } else if (typeof content.genres === 'string') {
        genres.push(...content.genres.split(',').map((g: string) => g.trim()));
      }
    }
    
    // Se não tiver gênero, usar categoria como fallback
    if (genres.length === 0 && content.categoria) {
      genres.push(content.categoria);
    }
    
    return genres.filter(g => g && g.trim() !== '');
  };

  // Analisar histórico e calcular top gêneros
  const analyzeGenres = useCallback((history: UserViewingHistory[]): GenreAnalytics[] => {
    const genreMap = new Map<string, { count: number; score: number; lastWatched: string }>();
    
    history.forEach(view => {
      const genres = view.genre || [];
      
      genres.forEach(genre => {
        const existing = genreMap.get(genre);
        
        // Score baseado em: visualização (1 ponto) + taxa de conclusão (0-1 ponto)
        const viewScore = 1 + (view.completionRate / 100);
        
        if (existing) {
          existing.count += 1;
          existing.score += viewScore;
          if (new Date(view.watchedAt) > new Date(existing.lastWatched)) {
            existing.lastWatched = view.watchedAt;
          }
        } else {
          genreMap.set(genre, {
            count: 1,
            score: viewScore,
            lastWatched: view.watchedAt,
          });
        }
      });
    });
    
    // Converter para array e ordenar por score (ponderação: 70% score, 30% recência)
    const sorted = Array.from(genreMap.entries())
      .map(([genre, data]) => ({
        genre,
        count: data.count,
        score: data.score,
        lastWatched: data.lastWatched,
      }))
      .sort((a, b) => {
        // Prioridade: score (70%) + recência (30%)
        const scoreWeight = 0.7;
        const recencyWeight = 0.3;
        
        const scoreDiff = (b.score - a.score) * scoreWeight;
        
        const aRecency = new Date(a.lastWatched).getTime();
        const bRecency = new Date(b.lastWatched).getTime();
        const maxRecency = Date.now();
        const minRecency = maxRecency - (30 * 24 * 60 * 60 * 1000); // 30 dias atrás
        
        const aRecencyNorm = (aRecency - minRecency) / (maxRecency - minRecency);
        const bRecencyNorm = (bRecency - minRecency) / (maxRecency - minRecency);
        
        const recencyDiff = (bRecencyNorm - aRecencyNorm) * recencyWeight * 10;
        
        return (b.score - a.score) + recencyDiff;
      })
      .slice(0, 5); // Top 5 gêneros
    
    return sorted;
  }, []);

  // Carregar histórico do localStorage
  const loadHistory = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Tentar carregar do Supabase primeiro
      const { data, error } = await supabase
        .from('user_views' as any)
        .select('*')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(100);
      
      if (!error && data) {
        const history = (data as any[]).map(item => ({
          contentId: item.content_id,
          title: item.title,
          type: item.type,
          category: item.category,
          genre: item.genre || [],
          watchedAt: item.watched_at,
          completionRate: item.completion_rate || 0,
        }));
        
        setViewingHistory(history);
        setTopGenres(analyzeGenres(history));
      } else {
        // Fallback para localStorage
        const cacheKey = `${VIEWING_HISTORY_KEY}_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const history = JSON.parse(cached);
          setViewingHistory(history);
          setTopGenres(analyzeGenres(history));
        }
      }
    } catch (err) {
      console.error('Error loading viewing history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, analyzeGenres]);

  // Rastrear visualização
  const trackViewing = useCallback(async (content: any, completionRate: number = 0) => {
    if (!userId || !content) return;
    
    const genres = extractGenres(content);
    
    const viewData: UserViewingHistory = {
      contentId: content.id?.toString(),
      title: content.titulo || content.title,
      type: content.type || 'movie',
      category: content.category || content.categoria,
      genre: genres,
      watchedAt: new Date().toISOString(),
      completionRate,
    };
    
    // Salvar no localStorage
    const cacheKey = `${VIEWING_HISTORY_KEY}_${userId}`;
    const existing = localStorage.getItem(cacheKey);
    const history = existing ? JSON.parse(existing) : [];
    
    // Verificar se já existe visualização recente (últimas 24h)
    const recentIndex = history.findIndex(
      (h: UserViewingHistory) => h.contentId === viewData.contentId && 
      (new Date().getTime() - new Date(h.watchedAt).getTime()) < (24 * 60 * 60 * 1000)
    );
    
    if (recentIndex >= 0) {
      // Atualizar visualização existente
      history[recentIndex] = viewData;
    } else {
      // Adicionar nova visualização
      history.unshift(viewData);
    }
    
    // Manter apenas últimos 100 registros
    const trimmed = history.slice(0, 100);
    localStorage.setItem(cacheKey, JSON.stringify(trimmed));
    
    // Atualizar estado
    setViewingHistory(trimmed);
    setTopGenres(analyzeGenres(trimmed));
    
    // Tentar salvar no Supabase
    try {
      await supabase.from('user_views' as any).upsert({
        user_id: userId,
        content_id: content.id,
        title: content.titulo || content.title,
        type: content.type || 'movie',
        category: content.category || content.categoria,
        genre: genres,
        watched_at: viewData.watchedAt,
        completion_rate: completionRate,
      });
    } catch (err) {
      // Silenciar erro - já salvamos no localStorage
    }
  }, [userId, analyzeGenres]);

  const refresh = useCallback(async () => {
    await loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    topGenres,
    viewingHistory,
    isLoading,
    trackViewing,
    refresh,
  };
};

export default useUserAnalytics;
