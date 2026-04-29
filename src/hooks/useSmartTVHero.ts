import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchTmdbDetailsWithBackdrop, tmdbImageUrl } from '@/services/tmdb';

interface SmartTVHeroItem {
  id: string;
  tmdbId?: string;
  title: string;
  backdrop: string;
  poster: string;
  year: number;
  rating: string;
  duration?: string;
  seasons?: number;
  description: string;
  country?: string;
  contentRating?: string;
  type: 'movie' | 'series';
  genre: string[];
}

interface UseSmartTVHeroReturn {
  currentItem: SmartTVHeroItem | null;
  nextItem: SmartTVHeroItem | null;
  isLoading: boolean;
  queue: string[];
}

const SESSION_SHOWN_KEY = 'smarttv_hero_shown_ids';
const LAST_START_KEY = 'smarttv_hero_last_start';

export function useSmartTVHero(): UseSmartTVHeroReturn {
  const [items, setItems] = useState<SmartTVHeroItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nextItem, setNextItem] = useState<SmartTVHeroItem | null>(null);
  const preloadedImages = useRef<Set<string>>(new Set());

  // Buscar conteúdo aleatório (filmes + séries) com backdrops do TMDB
  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        // Buscar filmes e séries em paralelo
        const [moviesRes, seriesRes] = await Promise.all([
          supabase
            .from('cinema')
            .select('id, tmdb_id, titulo, capa, poster, year, rating, description, category, genero')
            .not('capa', 'is', null)
            .limit(50),
          supabase
            .from('series')
            .select('id_n, tmdb_id, titulo, banner, ano, rating, descricao, genero')
            .not('banner', 'is', null)
            .limit(50)
        ]);

        // Enriquecer filmes com backdrops do TMDB
        const moviesRaw = (moviesRes.data || []) as any[];
        const moviesWithBackdrops = await Promise.all(
          moviesRaw
            .filter(m => m.tmdb_id)
            .slice(0, 20)
            .map(async (m: any) => {
              const tmdbData = await fetchTmdbDetailsWithBackdrop(m.tmdb_id, 'movie');
              const backdropPath = tmdbData?.backdrop_path;
              
              // Filmes usam 'poster' conforme schema do banco
              const posterPath = m.poster;
              const backdropDbPath = m.backdrop || m.banner;
              
              return {
                id: `movie-${m.id}`,
                tmdbId: m.tmdb_id,
                title: m.titulo,
                backdrop: backdropPath ? tmdbImageUrl(backdropPath, 'original') : (backdropDbPath ? tmdbImageUrl(backdropDbPath, 'original') : ''),
                poster: posterPath ? tmdbImageUrl(posterPath, 'w500') : '',
                year: parseInt(m.year) || 0,
                rating: m.rating || 'N/A',
                description: m.description || '',
                country: tmdbData?.origin_country?.[0] || tmdbData?.production_countries?.[0]?.iso_3166_1,
                contentRating: tmdbData?.content_rating,
                type: 'movie' as const,
                genre: m.category ? m.category.split(',').map((g: string) => g.trim()) : 
                       m.genero ? m.genero.split(',').map((g: string) => g.trim()) : [],
              };
            })
        );

        // Enriquecer séries com backdrops do TMDB
        const seriesRaw = (seriesRes.data || []) as any[];
        const seriesWithBackdrops = await Promise.all(
          seriesRaw
            .filter(s => s.tmdb_id)
            .slice(0, 20) // Limitar para não sobrecarregar a API
            .map(async (s: any) => {
              const tmdbData = await fetchTmdbDetailsWithBackdrop(s.tmdb_id, 'tv');
              const backdropPath = tmdbData?.backdrop_path;
              
              return {
                id: `series-${s.id_n}`,
                tmdbId: s.tmdb_id,
                title: s.titulo,
                backdrop: backdropPath ? tmdbImageUrl(backdropPath, 'original') : s.banner,
                poster: s.banner,
                year: parseInt(s.ano) || 0,
                rating: s.rating || 'N/A',
                description: s.descricao || '',
                country: tmdbData?.origin_country?.[0],
                contentRating: tmdbData?.content_rating,
                type: 'series' as const,
                genre: s.genero ? s.genero.split(',').map((g: string) => g.trim()) : [],
              };
            })
        );

        // Combinar e embaralhar (Fisher-Yates)
        const combined = [...moviesWithBackdrops, ...seriesWithBackdrops];
        for (let i = combined.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        // Recuperar IDs já exibidos
        const shownIds = JSON.parse(sessionStorage.getItem(SESSION_SHOWN_KEY) || '[]');
        const lastStart = sessionStorage.getItem(LAST_START_KEY);

        // Se todos já foram mostrados, limpar histórico
        let availableItems = combined;
        if (shownIds.length > 0 && shownIds.length < combined.length) {
          availableItems = combined.filter(item => !shownIds.includes(item.id));
        }

        // Se não há disponíveis ou é primeira vez, usar todos
        if (availableItems.length === 0) {
          availableItems = combined;
          sessionStorage.removeItem(SESSION_SHOWN_KEY);
        }

        // Garantir início diferente do último
        let startIndex = 0;
        if (lastStart && availableItems.length > 1) {
          const lastId = lastStart;
          const lastIndex = availableItems.findIndex(i => i.id === lastId);
          if (lastIndex !== -1) {
            startIndex = (lastIndex + 1) % availableItems.length;
          }
        }

        // Salvar primeiro item como "último início"
        if (availableItems[startIndex]) {
          sessionStorage.setItem(LAST_START_KEY, availableItems[startIndex].id);
        }

        setItems(availableItems);
        setCurrentIndex(startIndex);

        // Pre-carregar próxima imagem
        if (availableItems[startIndex + 1]) {
          preloadImage(availableItems[startIndex + 1].backdrop);
          setNextItem(availableItems[startIndex + 1]);
        }

      } catch (error) {
        console.error('[useSmartTVHero] Error fetching content:', error);
      }
    };

    fetchContent();
  }, []);

  // Função para pre-carregar imagem
  const preloadImage = (url: string) => {
    if (!url || preloadedImages.current.has(url)) return;
    
    const img = new Image();
    img.src = url;
    img.onload = () => {
      preloadedImages.current.add(url);
    };
  };

  // Rotação automática a cada 7 segundos
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % items.length;
        const currentItem = items[prev];
        const nextItem = items[nextIndex];

        // Salvar ID exibido
        const shownIds = JSON.parse(sessionStorage.getItem(SESSION_SHOWN_KEY) || '[]');
        if (!shownIds.includes(currentItem.id)) {
          shownIds.push(currentItem.id);
          sessionStorage.setItem(SESSION_SHOWN_KEY, JSON.stringify(shownIds));
        }

        // Pre-carregar próxima imagem
        const nextNextIndex = (nextIndex + 1) % items.length;
        if (items[nextNextIndex]) {
          preloadImage(items[nextNextIndex].backdrop);
        }

        setNextItem(items[nextNextIndex] || null);
        return nextIndex;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [items]);

  // Atualizar nextItem quando currentIndex muda
  useEffect(() => {
    if (items.length === 0) return;
    const nextIndex = (currentIndex + 1) % items.length;
    setNextItem(items[nextIndex] || null);
  }, [currentIndex, items]);

  const currentItem = items[currentIndex] || null;
  const queue = items.map(i => i.id);

  return {
    currentItem,
    nextItem,
    isLoading,
    queue
  };
}
