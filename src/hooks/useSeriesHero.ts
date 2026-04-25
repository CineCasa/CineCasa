import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchTmdbDetailsWithBackdrop, tmdbImageUrl } from '@/services/tmdb';

interface SeriesHeroItem {
  id: string;
  tmdbId?: string;
  title: string;
  backdrop: string;
  poster: string;
  year: number;
  rating: string;
  seasons?: number;
  episodes?: number;
  description: string;
  country?: string;
  contentRating?: string;
  genre: string[];
}

interface UseSeriesHeroReturn {
  currentItem: SeriesHeroItem | null;
  nextItem: SeriesHeroItem | null;
  isLoading: boolean;
  queue: string[];
}

const SERIES_HERO_SHOWN_KEY = 'series_hero_shown_ids';
const SERIES_LAST_START_KEY = 'series_hero_last_start';

export function useSeriesHero(): UseSeriesHeroReturn {
  const [items, setItems] = useState<SeriesHeroItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [nextItem, setNextItem] = useState<SeriesHeroItem | null>(null);
  const preloadedImages = useRef<Set<string>>(new Set());

  // Buscar séries aleatórias com backdrops do TMDB
  useEffect(() => {
    const fetchSeries = async () => {
      setIsLoading(true);
      try {
        const { data: series, error } = await supabase
          .from('series')
          .select('id, tmdb_id, titulo, banner, ano, rating, descricao, genero, temporadas, episodios')
          .not('tmdb_id', 'is', null)
          .limit(30);

        if (error) {
          console.error('[useSeriesHero] Error:', error);
          setIsLoading(false);
          return;
        }

        // Enriquecer com backdrops do TMDB
        const seriesWithBackdrops = await Promise.all(
          (series as any[] || [])
            .filter(s => s.tmdb_id)
            .slice(0, 20)
            .map(async (s: any) => {
              const tmdbData = await fetchTmdbDetailsWithBackdrop(s.tmdb_id, 'tv');
              const backdropPath = tmdbData?.backdrop_path;
              
              return {
                id: `series-${s.id}`,
                tmdbId: s.tmdb_id,
                title: s.titulo,
                backdrop: backdropPath ? tmdbImageUrl(backdropPath, 'original') : s.banner,
                poster: s.banner,
                year: parseInt(s.ano) || 0,
                rating: s.rating || 'N/A',
                seasons: s.temporadas || tmdbData?.number_of_seasons || 1,
                episodes: s.episodios || tmdbData?.number_of_episodes,
                description: s.descricao || tmdbData?.overview || '',
                country: tmdbData?.origin_country?.[0] || '',
                contentRating: tmdbData?.content_rating || '',
                genre: s.genero ? s.genero.split(',').map((g: string) => g.trim()) : [],
              };
            })
        );

        const formattedSeries: SeriesHeroItem[] = seriesWithBackdrops;

        // Fisher-Yates shuffle
        for (let i = formattedSeries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [formattedSeries[i], formattedSeries[j]] = [formattedSeries[j], formattedSeries[i]];
        }

        // Recuperar histórico
        const shownIds = JSON.parse(sessionStorage.getItem(SERIES_HERO_SHOWN_KEY) || '[]');
        const lastStart = sessionStorage.getItem(SERIES_LAST_START_KEY);

        let availableItems = formattedSeries;
        if (shownIds.length > 0 && shownIds.length < formattedSeries.length) {
          availableItems = formattedSeries.filter(item => !shownIds.includes(item.id));
        }

        if (availableItems.length === 0) {
          availableItems = formattedSeries;
          sessionStorage.removeItem(SERIES_HERO_SHOWN_KEY);
        }

        // Início diferente do último
        let startIndex = 0;
        if (lastStart && availableItems.length > 1) {
          const lastIndex = availableItems.findIndex(i => i.id === lastStart);
          if (lastIndex !== -1) {
            startIndex = (lastIndex + 1) % availableItems.length;
          }
        }

        if (availableItems[startIndex]) {
          sessionStorage.setItem(SERIES_LAST_START_KEY, availableItems[startIndex].id);
        }

        setItems(availableItems);
        setCurrentIndex(startIndex);

        // Pre-carregar próxima imagem
        if (availableItems[startIndex + 1]) {
          preloadImage(availableItems[startIndex + 1].backdrop);
          setNextItem(availableItems[startIndex + 1]);
        }

      } catch (error) {
        console.error('[useSeriesHero] Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeries();
  }, []);

  const preloadImage = (url: string) => {
    if (!url || preloadedImages.current.has(url)) return;
    const img = new Image();
    img.src = url;
    img.onload = () => preloadedImages.current.add(url);
  };

  // Rotação automática a cada 7 segundos
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % items.length;
        const currentItem = items[prev];
        
        // Salvar ID exibido
        const shownIds = JSON.parse(sessionStorage.getItem(SERIES_HERO_SHOWN_KEY) || '[]');
        if (!shownIds.includes(currentItem.id)) {
          shownIds.push(currentItem.id);
          sessionStorage.setItem(SERIES_HERO_SHOWN_KEY, JSON.stringify(shownIds));
        }

        // Pre-carregar próxima
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

  useEffect(() => {
    if (items.length === 0) return;
    const nextIndex = (currentIndex + 1) % items.length;
    setNextItem(items[nextIndex] || null);
  }, [currentIndex, items]);

  return {
    currentItem: items[currentIndex] || null,
    nextItem,
    isLoading,
    queue: items.map(i => i.id)
  };
}
