import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fetchTmdbMovie, fetchTmdbSeries, tmdbImageUrl, tmdbBannerUrl } from '@/services/tmdb';

interface BannerItem {
  id: string;
  tmdbId: string;
  title: string;
  description: string;
  year: string;
  rating: string;
  genre: string;
  backdrop: string;
  type: 'movie' | 'series';
  country?: string;
  ageRating?: string;
}

interface HeroBannerProps {
  pageType: 'home' | 'movies' | 'series';
  className?: string;
}

const ROTATION_INTERVAL = 12000; // 12 segundos

export const HeroBanner: React.FC<HeroBannerProps> = ({ pageType, className = '' }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showStickyNav, setShowStickyNav] = useState(false);
  const lastScrollY = useRef(0);

  // Shuffle array (Fisher-Yates)
  const shuffleArray = useCallback((array: BannerItem[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Buscar imagem do TMDB como último fallback
  const fetchTmdbImage = useCallback(async (tmdbId: string, type: 'movie' | 'series'): Promise<string | null> => {
    try {
      console.log(`[HeroBanner] Buscando imagem TMDB para ${type} ${tmdbId}`);
      const data = type === 'movie'
        ? await fetchTmdbMovie(tmdbId)
        : await fetchTmdbSeries(tmdbId);

      if (!data) return null;

      // Hierarquia TMDB: backdrop_path → poster_path
      const imagePath = data.backdrop_path || data.poster_path;
      if (imagePath) {
        // Usar tmdbBannerUrl para máxima qualidade (original)
        const imageUrl = tmdbBannerUrl(imagePath);
        console.log(`[HeroBanner] Imagem TMDB alta qualidade encontrada: ${imageUrl}`);
        return imageUrl;
      }
      return null;
    } catch (error) {
      console.error('[HeroBanner] Erro ao buscar imagem TMDB:', error);
      return null;
    }
  }, []);

  // Buscar dados do Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      try {
        let allItems: BannerItem[] = [];

        if (pageType === 'home' || pageType === 'movies') {
          // Buscar filmes com qualquer imagem (poster, banner ou backdrop)
          console.log('[HeroBanner] Buscando filmes do Supabase...');
          const { data: movies, error: moviesError } = await supabase
            .from('cinema')
            .select('id, tmdb_id, titulo, description, year, rating, category, poster')
            .not('poster', 'is', null');

          if (moviesError) {
            console.error('[HeroBanner] Erro ao buscar filmes:', moviesError);
            throw moviesError;
          }

          console.log(`[HeroBanner] Total de filmes retornados do Supabase: ${movies?.length || 0}`);

          // Processar filmes - buscar backdrop do TMDB para banner
          const moviePromises = (movies as any[] || [])
            .filter((m: any) => {
              // Inclui se tiver tmdb_id para buscar backdrop, ou poster local como fallback
              const hasTmdbId = !!m.tmdb_id;
              const hasLocalImage = (m.poster && m.poster.trim() !== '');
              const shouldInclude = hasTmdbId || hasLocalImage;
              if (!shouldInclude) {
                console.log(`[HeroBanner] Filme '${m.titulo}' ignorado - sem tmdb_id e sem imagem local`);
              }
              return shouldInclude;
            })
            .map(async (m: any) => {
              // Prioridade: backdrop do TMDB (melhor para banner)
              let imageUrl = null;
              let source = 'none';

              // SEMPRE buscar no TMDB primeiro para obter backdrop de alta qualidade
              if (m.tmdb_id) {
                console.log(`[HeroBanner] Filme '${m.titulo}' - buscando backdrop no TMDB (ID: ${m.tmdb_id})`);
                imageUrl = await fetchTmdbImage(m.tmdb_id, 'movie');
                if (imageUrl) {
                  source = 'tmdb';
                  console.log(`[HeroBanner] Filme '${m.titulo}' - backdrop TMDB encontrado`);
                }
              }

              // Fallback: usar poster local apenas se não conseguir do TMDB
              if (!imageUrl && m.poster && m.poster.trim() !== '') {
                imageUrl = m.poster;
                source = 'local';
                console.log(`[HeroBanner] Filme '${m.titulo}' - usando poster local como fallback`);
              }

              // Só retorna se conseguiu alguma imagem
              if (!imageUrl) {
                console.log(`[HeroBanner] Filme '${m.titulo}' - descartado (sem imagem)`);
                return null;
              }

              // Buscar metadados do TMDB para país e classificação
              let country = undefined;
              let ageRating = undefined;
              if (m.tmdb_id) {
                try {
                  const tmdbData = await fetchTmdbMovie(m.tmdb_id);
                  if (tmdbData) {
                    country = tmdbData.production_countries?.[0]?.iso_3166_1;
                    ageRating = tmdbData.adult ? '18+' : tmdbData.release_dates?.results?.[0]?.release_dates?.[0]?.certification;
                  }
                } catch (e) {
                  // Ignorar erro ao buscar metadados
                }
              }

              console.log(`[HeroBanner] Filme '${m.titulo}' - incluído (fonte: ${source})`);

              return {
                id: m.id,
                tmdbId: m.tmdb_id,
                title: m.titulo || 'Sem título',
                description: m.overview || m.description || '',
                year: m.year || '',
                rating: m.rating || '',
                genre: m.category || '',
                backdrop: imageUrl,
                type: 'movie' as const,
                country,
                ageRating
              };
            });

          const movieItems = (await Promise.all(moviePromises)).filter(Boolean) as BannerItem[];
          console.log(`[HeroBanner] Filmes com imagem válida: ${movieItems.length}`);
          allItems = [...allItems, ...movieItems];
        }

        if (pageType === 'home' || pageType === 'series') {
          // Buscar todas as séries
          const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('id_n, titulo, descricao, ano, tmdb_id, capa, poster, trailer, genero, classificacao, rating')
            .limit(100);

          if (seriesError) throw seriesError;

          console.log(`[HeroBanner] Total de séries retornadas do Supabase: ${series?.length || 0}`);

          // Processar séries com fallback assíncrono para TMDB
          const seriesPromises = (series as any[] || [])
            .filter((s: any) => {
              // Inclui se tiver imagem local OU tmdb_id para buscar
              const hasLocalImage = (s.capa && s.capa.trim() !== '') ||
                                   (s.poster && s.poster.trim() !== '');
              return hasLocalImage || s.tmdb_id;
            })
            .map(async (s: any) => {
              // Hierarquia de fallback local: capa → poster
              let imageUrl = (s.capa && s.capa.trim() !== '')
                ? s.capa
                : (s.poster && s.poster.trim() !== '')
                  ? s.poster
                  : null;

              // Se não tiver imagem local, buscar no TMDB
              if (!imageUrl && s.tmdb_id) {
                imageUrl = await fetchTmdbImage(s.tmdb_id, 'series');
              }

              // Só retorna se conseguiu alguma imagem
              if (!imageUrl) return null;

              // Buscar metadados do TMDB para país e classificação
              let country = undefined;
              let ageRating = undefined;
              if (s.tmdb_id) {
                try {
                  const tmdbData = await fetchTmdbSeries(s.tmdb_id);
                  if (tmdbData) {
                    country = tmdbData.production_countries?.[0]?.iso_3166_1;
                    ageRating = tmdbData.adult ? '18+' : tmdbData.content_ratings?.results?.[0]?.rating;
                  }
                } catch (e) {
                  // Ignorar erro ao buscar metadados
                }
              }

              return {
                id: s.id_n,
                tmdbId: s.tmdb_id,
                title: s.titulo || 'Sem título',
                description: s.descricao || '',
                year: s.ano?.toString() || '',
                rating: s.rating?.toString() || '',
                genre: s.genero || '',
                backdrop: imageUrl,
                type: 'series' as const,
                country,
                ageRating: s.classificacao
              };
            });

          const seriesItems = (await Promise.all(seriesPromises)).filter(Boolean) as BannerItem[];
          console.log(`[HeroBanner] Séries com imagem válida: ${seriesItems.length}`);
          allItems = [...allItems, ...seriesItems];
        }

        // Embaralhar itens
        const shuffled = shuffleArray(allItems);
        console.log(`[HeroBanner] Loaded ${shuffled.length} items for pageType=${pageType}`);
        setItems(shuffled);
        setCurrentIndex(0);
      } catch (error) {
        console.error('[HeroBanner] Erro ao carregar banners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [pageType, shuffleArray]);

  // Rotação automática
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => {
        const next = (prev + 1) % items.length;
        return next;
      });
    }, ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, [items.length]);

  // Efeito de scroll - esconde banner e mostra navbar sticky
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const bannerHeight = 600; // Altura aproximada do banner
      
      // Mostrar navbar sticky quando rolar além do banner
      setShowStickyNav(currentScrollY > bannerHeight * 0.5);
      
      // Esconder banner quando rolar além dele
      if (currentScrollY > bannerHeight * 0.8) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePlay = (item: BannerItem) => {
    navigate(`/details/${item.type === 'movie' ? 'cinema' : 'series'}/${item.id}`);
  };

  const handleMyList = async (item: BannerItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login necessário",
          description: "Faça login para adicionar à sua lista.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          content_id: item.id,
          content_type: item.type,
          titulo: item.title,
          poster: item.backdrop,
          banner: item.backdrop,
          rating: item.rating,
          year: item.year,
          genero: item.genre
        });

      if (error) throw error;

      toast({
        title: "Adicionado à lista",
        description: `${item.title} foi adicionado à sua lista.`,
      });
    } catch (error) {
      console.error('[HeroBanner] Erro ao adicionar à lista:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar à lista.",
        variant: "destructive"
      });
    }
  };

  // Variantes de animação
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const currentItem = items[currentIndex];

  console.log('[HeroBanner] Renderizando:', { isLoading, itemsCount: items.length, hasCurrentItem: !!currentItem, pageType });

  // Durante loading, mostrar skeleton
  if (isLoading) {
    return (
      <div className={`relative w-full aspect-[16/9] min-h-[320px] max-h-[680px] overflow-hidden z-20 bg-gradient-to-br from-gray-900 to-black animate-pulse ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>
    );
  }

  // Se não há dados, mostrar banner padrão
  if (!currentItem) {
    return (
      <div className={`relative w-full aspect-[16/9] overflow-hidden z-20 bg-gradient-to-br from-gray-900 via-black to-gray-800 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-white">CineCasa</h2>
            <p className="text-gray-400 mt-2">Sua plataforma de streaming</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Banner - 16:9 perfeito, responsivo para todas as telas */}
      <div
        className={`relative w-full z-20 ${className}`}
        style={{ aspectRatio: '16/9', minHeight: '300px', maxHeight: '85vh' }}
      >
        {/* Background Image com AnimatePresence */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentItem.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={currentItem.backdrop}
            alt={currentItem.title}
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: 'center 20%' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay Gradient - Lateral esquerdo - Escurecido 20% */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent" />

      {/* Overlay Gradient - Bottom fade - Escurecido 20% */}
      <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black via-black/60 to-transparent" />

      {/* Conteúdo */}
      <div className="absolute inset-0 flex items-end">
        <div className="w-full px-6 md:px-12 lg:px-16 pb-16 md:pb-20 max-w-[900px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-3"
            >
              {/* Título */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
                {currentItem.title}
              </h1>

              {/* Meta info */}
              <div className="flex items-center gap-3 flex-wrap text-sm md:text-base text-gray-200">
                {currentItem.country && (
                  <img
                    src={`https://flagcdn.com/w40/${currentItem.country.toLowerCase()}.png`}
                    alt={currentItem.country}
                    className="w-6 h-4 rounded object-cover shadow-sm"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                {currentItem.year && <span>{currentItem.year}</span>}
                {currentItem.genre && (
                  <span className="text-cyan-400">{currentItem.genre}</span>
                )}
                {currentItem.ageRating && (
                  <span className="flex items-center gap-1 bg-red-600/90 text-white px-2 py-0.5 rounded font-semibold text-xs">
                    {currentItem.ageRating}
                  </span>
                )}
                {currentItem.rating && (
                  <span className="flex items-center gap-1 bg-yellow-500/90 text-black px-2 py-0.5 rounded font-semibold">
                    <Star size={14} fill="currentColor" />
                    {currentItem.rating}
                  </span>
                )}
              </div>

              {/* Descrição - clamp a 2 linhas */}
              {currentItem.description && (
                <p className="text-gray-300 text-sm md:text-lg leading-relaxed line-clamp-2 drop-shadow-lg max-w-[600px]">
                  {currentItem.description}
                </p>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navegação lateral (opcional - só aparece no hover) */}
      {items.length > 1 && (
        <>
          {/* Indicadores de slide na parte inferior */}
          <div className="absolute bottom-6 right-6 md:right-12 flex items-center gap-2">
            <span className="text-white/60 text-sm font-medium">
              {currentIndex + 1} / {items.length}
            </span>
          </div>

          {/* Botões de navegação (invisíveis mas clicáveis nas bordas) */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-4"
            aria-label="Anterior"
          >
            <ChevronLeft size={40} className="text-white/80" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-4"
            aria-label="Próximo"
          >
            <ChevronRight size={40} className="text-white/80" />
          </button>
        </>
      )}
    </div>

      {/* Navbar Sticky - aparece quando banner some */}
      {showStickyNav && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-4"
        >
          <div className="max-w-[1920px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[#00d9ff] font-bold text-xl">◉ CINECASA</span>
              <nav className="hidden md:flex items-center gap-6 ml-8">
                <button onClick={() => navigate('/')} className="text-white hover:text-[#00d9ff] transition-colors">Início</button>
                <button onClick={() => navigate('/filmes')} className="text-white hover:text-[#00d9ff] transition-colors">Filmes</button>
                <button onClick={() => navigate('/series')} className="text-white hover:text-[#00d9ff] transition-colors">Séries</button>
                <button onClick={() => navigate('/favorites')} className="text-white hover:text-[#00d9ff] transition-colors">Favoritos</button>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/search')} 
                className="text-white hover:text-[#00d9ff] transition-colors"
              >
                Buscar
              </button>
              <button 
                onClick={() => navigate('/profile')} 
                className="text-white hover:text-[#00d9ff] transition-colors"
              >
                Perfil
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default HeroBanner;
