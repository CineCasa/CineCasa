import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Star, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BannerItem {
  id: string;
  tmdbId: string;
  title: string;
  description: string;
  year: string;
  rating: string;
  genre: string;
  backdrop: string;
  country?: string;
  type: 'movie' | 'series';
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

  // Shuffle array (Fisher-Yates)
  const shuffleArray = useCallback((array: BannerItem[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Buscar dados do Supabase
  useEffect(() => {
    const fetchBanners = async () => {
      setIsLoading(true);
      try {
        let allItems: BannerItem[] = [];

        if (pageType === 'home' || pageType === 'movies') {
          // Buscar filmes com qualquer imagem (poster, banner ou backdrop)
          const { data: movies, error: moviesError } = await supabase
            .from('cinema')
            .select('id, tmdb_id, titulo, overview, year, rating, genre, poster, banner, backdrop, country')
            .or('poster.not.is.null,banner.not.is.null,backdrop.not.is.null')
            .or('poster.neq.,banner.neq.,backdrop.neq.');

          if (moviesError) throw moviesError;

          const movieItems = (movies as any[] || [])
            .filter((m: any) => {
              // Aceita qualquer filme que tenha pelo menos uma imagem
              const hasBackdrop = m.backdrop && m.backdrop.trim() !== '';
              const hasBanner = m.banner && m.banner.trim() !== '';
              const hasPoster = m.poster && m.poster.trim() !== '';
              return hasBackdrop || hasBanner || hasPoster;
            })
            .map((m: any) => {
              // Hierarquia de fallback: backdrop → banner → poster
              const imageUrl = (m.backdrop && m.backdrop.trim() !== '')
                ? m.backdrop
                : (m.banner && m.banner.trim() !== '')
                  ? m.banner
                  : m.poster;

              return {
                id: m.id,
                tmdbId: m.tmdb_id,
                title: m.titulo || 'Sem título',
                description: m.overview || m.description || '',
                year: m.year || '',
                rating: m.rating || '',
                genre: m.genre || '',
                backdrop: imageUrl, // Sempre terá um valor válido
                country: m.country,
                type: 'movie' as const
              };
            });

          allItems = [...allItems, ...movieItems];
        }

        if (pageType === 'home' || pageType === 'series') {
          // Buscar séries com qualquer imagem (poster, banner ou backdrop)
          const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('id, tmdb_id, titulo, overview, year, rating, genre, poster, banner, backdrop, country')
            .or('poster.not.is.null,banner.not.is.null,backdrop.not.is.null')
            .or('poster.neq.,banner.neq.,backdrop.neq.');

          if (seriesError) throw seriesError;

          const seriesItems = (series as any[] || [])
            .filter((s: any) => {
              // Aceita qualquer série que tenha pelo menos uma imagem
              const hasBackdrop = s.backdrop && s.backdrop.trim() !== '';
              const hasBanner = s.banner && s.banner.trim() !== '';
              const hasPoster = s.poster && s.poster.trim() !== '';
              return hasBackdrop || hasBanner || hasPoster;
            })
            .map((s: any) => {
              // Hierarquia de fallback: backdrop → banner → poster
              const imageUrl = (s.backdrop && s.backdrop.trim() !== '')
                ? s.backdrop
                : (s.banner && s.banner.trim() !== '')
                  ? s.banner
                  : s.poster;

              return {
                id: s.id,
                tmdbId: s.tmdb_id,
                title: s.titulo || 'Sem título',
                description: s.overview || s.description || '',
                year: s.year || '',
                rating: s.rating || '',
                genre: s.genre || '',
                backdrop: imageUrl, // Sempre terá um valor válido
                country: s.country,
                type: 'series' as const
              };
            });

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

  // Função para obter URL da bandeira
  const getFlagUrl = (countryCode?: string) => {
    if (!countryCode) return null;
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
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

  if (isLoading) {
    return (
      <div className={`relative w-full aspect-video bg-gradient-to-br from-gray-900 to-black animate-pulse ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>
    );
  }

  if (!currentItem) {
    console.log('[HeroBanner] No items available - showing fallback');
    return (
      <div className={`relative w-full aspect-[16/9] min-h-[320px] max-h-[680px] overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg">Nenhum banner disponível</p>
            <p className="text-sm mt-2">Adicione filmes/séries com backdrop no Supabase</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full aspect-[16/9] min-h-[320px] max-h-[680px] overflow-hidden ${className}`}>
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
          className="absolute inset-0"
        >
          <img
            src={currentItem.backdrop}
            alt={currentItem.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay Gradient - Lateral esquerdo */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

      {/* Overlay Gradient - Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-black via-black/50 to-transparent" />

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
                    src={getFlagUrl(currentItem.country) || ''}
                    alt={currentItem.country}
                    className="w-6 h-4 rounded object-cover shadow-sm"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                {currentItem.year && <span>{currentItem.year}</span>}
                {currentItem.genre && (
                  <span className="text-cyan-400">{currentItem.genre}</span>
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

              {/* Botões */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => handlePlay(currentItem)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#00d9ff] hover:bg-[#00b8d9] text-black font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:ring-offset-2 focus:ring-offset-black"
                >
                  <Play size={20} fill="currentColor" />
                  <span>Assistir agora</span>
                </button>

                <button
                  onClick={() => handleMyList(currentItem)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm border border-white/20 transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                >
                  <Plus size={20} />
                  <span>Minha lista</span>
                </button>

                <button
                  onClick={() => navigate(`/details/${currentItem.type === 'movie' ? 'cinema' : 'series'}/${currentItem.id}`)}
                  className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm border border-white/20 transition-all"
                >
                  <Info size={20} />
                </button>
              </div>
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
  );
};

export default HeroBanner;
