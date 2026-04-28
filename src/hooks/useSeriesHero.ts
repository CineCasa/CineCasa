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

// Removido: Não usar mais sessionStorage para tracking - causa repetição

export function useSeriesHero(): UseSeriesHeroReturn {
  const [items, setItems] = useState<SeriesHeroItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nextItem, setNextItem] = useState<SeriesHeroItem | null>(null);
  const preloadedImages = useRef<Set<string>>(new Set());

  // Buscar séries aleatórias com backdrops do TMDB
  useEffect(() => {
    const fetchSeries = async () => {
      setIsLoading(true);
      try {
        const { data: series, error } = await supabase
          .from('series')
          .select('id_n, tmdb_id, titulo, banner, ano, rating, descricao, genero, temporadas, episodios')
          .not('tmdb_id', 'is', null);

        if (error) {
          console.error('[useSeriesHero] Error:', error);
          setIsLoading(false);
          return;
        }

        // Enriquecer com backdrops do TMDB - usar TODAS as séries
        const seriesWithBackdrops = await Promise.all(
          (series as any[] || [])
            .filter(s => s.tmdb_id)
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

        // Fisher-Yates shuffle completo - sem limitações
        for (let i = formattedSeries.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [formattedSeries[i], formattedSeries[j]] = [formattedSeries[j], formattedSeries[i]];
        }

        // Início verdadeiramente aleatório - sem histórico que causa repetição
        const startIndex = formattedSeries.length > 0 
          ? Math.floor(Math.random() * formattedSeries.length) 
          : 0;

        setItems(formattedSeries);
        setCurrentIndex(startIndex);

        // Pre-carregar próxima imagem
        if (formattedSeries[startIndex + 1]) {
          preloadImage(formattedSeries[startIndex + 1].backdrop);
          setNextItem(formattedSeries[startIndex + 1]);
        }

      } catch (error) {
        console.error('[useSeriesHero] Error:', error);
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

  // Rotação automática a cada 7 segundos - aleatória verdadeira
  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        // Selecionar próxima série aleatoriamente (evitando repetir a atual)
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * items.length);
        } while (nextIndex === prev && items.length > 1);
        
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
