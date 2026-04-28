import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchTmdbDetailsWithBackdrop, tmdbImageUrl } from '@/services/tmdb';

interface CinemaHeroItem {
  id: string;
  tmdbId?: string;
  title: string;
  backdrop: string;
  poster: string;
  year: number;
  rating: string;
  duration?: string;
  description: string;
  country?: string;
  contentRating?: string;
  genre: string[];
}

interface UseCinemaHeroReturn {
  currentItem: CinemaHeroItem | null;
  nextItem: CinemaHeroItem | null;
  isLoading: boolean;
  queue: string[];
}

const CINEMA_HERO_SHOWN_KEY = 'cinema_hero_shown_ids';
const CINEMA_LAST_START_KEY = 'cinema_hero_last_start';

export function useCinemaHero(): UseCinemaHeroReturn {
  const [items, setItems] = useState<CinemaHeroItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [nextItem, setNextItem] = useState<CinemaHeroItem | null>(null);
  const preloadedImages = useRef<Set<string>>(new Set());

  // Buscar filmes aleatórios com backdrops do TMDB - com proteção contra loop
  const isFetchingRef = useRef(false);
  
  useEffect(() => {
    if (isFetchingRef.current) return; // Evitar chamadas duplicadas
    
    const fetchMovies = async () => {
      isFetchingRef.current = true;
      setIsLoading(true);
      try {
        const { data: movies, error } = await supabase
          .from('cinema')
          .select('id, tmdb_id, titulo, poster, backdrop, banner, year, rating, description, category, genero')
          .not('tmdb_id', 'is', null)
          .limit(30);

        if (error) {
          console.error('[useCinemaHero] Error:', error);
          setIsLoading(false);
          return;
        }

        // DEBUG: Log dos dados brutos do Supabase
        console.log('[useCinemaHero] Raw movies count:', movies?.length || 0);
        if (movies && movies.length > 0) {
          console.log('[useCinemaHero] First movie raw:', {
            id: movies[0].id,
            titulo: movies[0].titulo,
            poster: movies[0].poster,
            backdrop: movies[0].backdrop,
            banner: movies[0].banner,
            tmdb_id: movies[0].tmdb_id
          });
        }

        // Enriquecer com backdrops do TMDB
        const moviesWithBackdrops = await Promise.all(
          (movies as any[] || [])
            .filter(m => m.tmdb_id)
            .slice(0, 20)
            .map(async (m: any) => {
              try {
                const tmdbData = await fetchTmdbDetailsWithBackdrop(m.tmdb_id, 'movie');
                const backdropPath = tmdbData?.backdrop_path;
                
                // DEBUG: Log do processo de imagem
                console.log(`[useCinemaHero] Processando filme ${m.titulo}:`, {
                  tmdb_id: m.tmdb_id,
                  backdropPath,
                  dbBackdrop: m.backdrop,
                  dbBanner: m.banner,
                  dbPoster: m.poster?.substring(0, 50)
                });
                
                // Fallback hierarchy: TMDB backdrop -> DB backdrop -> DB banner -> poster
                const dbBackdropPath = m.backdrop || m.banner;
                let finalBackdropUrl = '';
                
                if (backdropPath) {
                  finalBackdropUrl = tmdbImageUrl(backdropPath, 'original');
                } else if (dbBackdropPath) {
                  finalBackdropUrl = tmdbImageUrl(dbBackdropPath, 'original');
                } else if (m.poster) {
                  finalBackdropUrl = m.poster.startsWith('http') ? m.poster : tmdbImageUrl(m.poster, 'original');
                }
                
                console.log(`[useCinemaHero] URL final backdrop: ${finalBackdropUrl.substring(0, 80)}...`);
                
                return {
                  id: `cinema-${m.id}`,
                  tmdbId: m.tmdb_id,
                  title: m.titulo,
                  backdrop: finalBackdropUrl,
                  poster: m.poster ? (m.poster.startsWith('http') ? m.poster : tmdbImageUrl(m.poster, 'w500')) : '',
                  year: parseInt(m.year) || 0,
                  rating: m.rating || 'N/A',
                  duration: tmdbData?.runtime ? `${Math.floor(tmdbData.runtime / 60)}h ${tmdbData.runtime % 60}min` : '',
                  description: m.description || tmdbData?.overview || '',
                  country: tmdbData?.origin_country?.[0] || tmdbData?.production_countries?.[0]?.iso_3166_1 || '',
                  contentRating: tmdbData?.content_rating || '',
                  genre: m.category ? m.category.split(',').map((g: string) => g.trim()) : 
                         m.genero ? m.genero.split(',').map((g: string) => g.trim()) : [],
                };
              } catch (err) {
                console.error(`[useCinemaHero] Erro ao processar filme ${m.titulo}:`, err);
                // Retornar filme com dados mínimos em caso de erro
                return {
                  id: `cinema-${m.id}`,
                  tmdbId: m.tmdb_id,
                  title: m.titulo,
                  backdrop: m.poster || '',
                  poster: m.poster || '',
                  year: parseInt(m.year) || 0,
                  rating: m.rating || 'N/A',
                  duration: '',
                  description: m.description || '',
                  country: '',
                  contentRating: '',
                  genre: m.category ? m.category.split(',').map((g: string) => g.trim()) : 
                         m.genero ? m.genero.split(',').map((g: string) => g.trim()) : [],
                };
              }
            })
        );

        const formattedMovies: CinemaHeroItem[] = moviesWithBackdrops;

        // Fisher-Yates shuffle
        for (let i = formattedMovies.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [formattedMovies[i], formattedMovies[j]] = [formattedMovies[j], formattedMovies[i]];
        }

        // Recuperar histórico
        const shownIds = JSON.parse(sessionStorage.getItem(CINEMA_HERO_SHOWN_KEY) || '[]');
        const lastStart = sessionStorage.getItem(CINEMA_LAST_START_KEY);

        let availableItems = formattedMovies;
        if (shownIds.length > 0 && shownIds.length < formattedMovies.length) {
          availableItems = formattedMovies.filter(item => !shownIds.includes(item.id));
        }

        if (availableItems.length === 0) {
          availableItems = formattedMovies;
          sessionStorage.removeItem(CINEMA_HERO_SHOWN_KEY);
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
          sessionStorage.setItem(CINEMA_LAST_START_KEY, availableItems[startIndex].id);
        }

        setItems(availableItems);
        setCurrentIndex(startIndex);

        // Pre-carregar próxima imagem
        if (availableItems[startIndex + 1]) {
          preloadImage(availableItems[startIndex + 1].backdrop);
          setNextItem(availableItems[startIndex + 1]);
        }

      } catch (error) {
        console.error('[useCinemaHero] Error:', error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchMovies();
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
        const shownIds = JSON.parse(sessionStorage.getItem(CINEMA_HERO_SHOWN_KEY) || '[]');
        if (!shownIds.includes(currentItem.id)) {
          shownIds.push(currentItem.id);
          sessionStorage.setItem(CINEMA_HERO_SHOWN_KEY, JSON.stringify(shownIds));
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
