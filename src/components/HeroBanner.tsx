import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import { fetchTmdbDetails, getTmdbTrailerUrl, tmdbImageUrl } from "@/services/tmdb";
import VideoJSPlayer from "./VideoJSPlayer";
import { useAuth } from "./AuthProvider";

interface HeroBannerProps {
  filterCategory?: string;
}

// Helper function to convert country code to flag emoji
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode) return '🌍';
  const code = countryCode.toUpperCase();
  if (code.length > 2) {
    const countryMap: Record<string, string> = {
      'USA': 'US', 'UNITED STATES': 'US', 'ESTADOS UNIDOS': 'US',
      'UK': 'GB', 'UNITED KINGDOM': 'GB', 'REINO UNIDO': 'GB',
      'BRAZIL': 'BR', 'BRASIL': 'BR',
      'FRANCE': 'FR', 'FRANÇA': 'FR',
      'GERMANY': 'DE', 'ALEMANHA': 'DE',
      'ITALY': 'IT', 'ITÁLIA': 'IT',
      'SPAIN': 'ES', 'ESPANHA': 'ES',
      'JAPAN': 'JP', 'JAPÃO': 'JP',
      'CHINA': 'CN',
      'KOREA': 'KR', 'SOUTH KOREA': 'KR',
      'INDIA': 'IN',
      'MEXICO': 'MX', 'MÉXICO': 'MX',
      'ARGENTINA': 'AR',
      'CANADA': 'CA',
      'AUSTRALIA': 'AU',
      'RUSSIA': 'RU', 'RÚSSIA': 'RU',
    };
    const mappedCode = countryMap[code];
    if (!mappedCode) return '🌍';
    return String.fromCodePoint(...[...mappedCode].map(c => 127397 + c.charCodeAt(0)));
  }
  return String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
};

const HeroBanner = ({ filterCategory }: HeroBannerProps) => {
  console.log('[HeroBanner] Component mounted, filterCategory:', filterCategory);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const { data: categories, isLoading, error } = useSupabaseContent();
  const trailerTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Debug: log categories data
  useEffect(() => {
    console.log('[HeroBanner] Categories data:', { 
      categoriesCount: categories?.length || 0, 
      isLoading, 
      error: error?.message || null,
      categoryIds: categories?.map(c => c.id) || []
    });
  }, [categories, isLoading, error]);

  const normalizedFilter = filterCategory?.toLowerCase().trim();
  
  // Pegar todos os itens disponíveis sem limitação - memoizado para não recalcular
  const allItems = useMemo(() => {
    console.log('[HeroBanner] Calculating allItems, filterCategory:', filterCategory, 'normalizedFilter:', normalizedFilter);
    console.log('[HeroBanner] Available categories:', categories?.map(c => ({ id: c.id, title: c.title, itemsCount: c.items.length })));
    
    const items = filterCategory 
      ? categories?.filter(cat => {
          const matches = normalizedFilter === "cinema" ? cat.id.startsWith("cinema-") :
                         normalizedFilter === "séries" ? cat.id.startsWith("series-") :
                         normalizedFilter === "filmes infantis" ? cat.id === "kids-movies" :
                         normalizedFilter?.startsWith("séries infant") ? cat.id === "kids-series" :
                         cat.title.toLowerCase().includes(normalizedFilter!);
          console.log('[HeroBanner] Checking category:', cat.id, 'matches:', matches);
          return matches;
        }).flatMap(cat => cat.items) || []
      : categories?.flatMap(cat => cat.items) || [];
    
    console.log('[HeroBanner] allItems count:', items.length);
    return items;
  }, [categories, filterCategory, normalizedFilter]);

  // Estado para armazenar itens embaralhados - recalculado a cada montagem do componente
  const [heroItems, setHeroItems] = useState<any[]>([]);

  // Embaralhar itens aleatoriamente sempre que allItems mudar ou componente montar
  useEffect(() => {
    if (allItems.length === 0) {
      setHeroItems([]);
      return;
    }

    // Fisher-Yates shuffle para embaralhamento verdadeiramente aleatório
    const shuffled = [...allItems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setHeroItems(shuffled);
    console.log('[HeroBanner] Items shuffled randomly:', shuffled.length, 'items');
  }, [allItems]);

  // Iniciar em posição aleatória para não começar sempre pela mesma capa
  const [current, setCurrent] = useState(0);

  // Definir posição inicial aleatória quando heroItems carregar
  useEffect(() => {
    if (heroItems.length > 0) {
      const randomStart = Math.floor(Math.random() * heroItems.length);
      setCurrent(randomStart);
      console.log('[HeroBanner] Starting at random position:', randomStart, 'of', heroItems.length);
    }
  }, [heroItems.length]);

  const [currentHeroData, setCurrentHeroData] = useState<any>(null);


  useEffect(() => {
    if (heroItems.length === 0) return;
    
    setShowTrailer(false);
    setTrailerUrl(null);
    setCurrentHeroData(null);
    if (trailerTimeout.current) clearTimeout(trailerTimeout.current);

    const hero = heroItems[current];
    
    const loadDetails = async () => {
      // 1. Priorizar trailer do Supabase
      if (hero.trailer) {
        setTrailerUrl(hero.trailer);
        trailerTimeout.current = setTimeout(() => {
          setShowTrailer(true);
        }, 100);
        
        // Buscar metadados do TMDB se necessário
        if (hero.tmdbId) {
          const type = hero.id.includes("series") ? "tv" : "movie";
          const data = await fetchTmdbDetails(hero.tmdbId, type);
          if (data) setCurrentHeroData(data);
        }
      } else if (hero.tmdbId) {
        // 2. Fallback para TMDB
        const type = hero.id.includes("series") ? "tv" : "movie";
        const data = await fetchTmdbDetails(hero.tmdbId, type);
        if (data) {
          setCurrentHeroData(data);
          const url = getTmdbTrailerUrl(data.videos);
          if (url) {
            setTrailerUrl(url);
            trailerTimeout.current = setTimeout(() => {
              setShowTrailer(true);
            }, 100);
          }
        }
      }
    };

    loadDetails();

    return () => {
      if (trailerTimeout.current) clearTimeout(trailerTimeout.current);
    };
  }, [current, heroItems.length]);

  useEffect(() => {
    if (heroItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroItems.length);
    }, 10000); // Tempo reduzido para melhor experiência
    return () => clearInterval(timer);
  }, [heroItems.length]);

  // Show skeleton placeholder during loading for faster perceived performance
  if (isLoading || heroItems.length === 0) {
    return (
      <section className="relative w-full h-[70vh] sm:aspect-video sm:max-h-[85vh] bg-gradient-to-br from-gray-900 to-black animate-pulse">
        {/* Skeleton shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
      </section>
    );
  }

  // Safety check: ensure current index is valid
  const safeIndex = current % heroItems.length;
  const hero = heroItems[safeIndex];

  // Additional safety: show skeleton instead of loading text
  if (!hero) {
    return (
      <section className="relative w-full h-[70vh] sm:aspect-video sm:max-h-[85vh] bg-gradient-to-br from-gray-900 to-black animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />
      </section>
    );
  }

  // Debug logging
  console.log('[HeroBanner] Current hero:', {
    id: hero.id,
    title: hero.title,
    backdrop: hero.backdrop,
    image: hero.image,
    poster: hero.poster,
    currentHeroData: currentHeroData?.backdrop_path
  });

  // Ensure we have a valid image source
  const imageSource = currentHeroData?.backdrop_path 
    ? tmdbImageUrl(currentHeroData.backdrop_path, "original") 
    : (hero.backdrop || hero.image || hero.poster || "");
  
  const goTo = (dir: number) =>
    setCurrent((prev) => (prev + dir + heroItems.length) % heroItems.length);

  return (
    <section 
      className="hero-banner relative w-full aspect-video max-h-[80vh] overflow-hidden"
      onClick={(e) => console.log('[HeroBanner] Section clicked at:', e.clientX, e.clientY, 'target:', e.target)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={hero.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 pointer-events-none"
        >
          {showTrailer && trailerUrl ? (
            <div className="absolute inset-0 scale-[1.3] pointer-events-none" style={{ pointerEvents: 'none' }}>
              <iframe
                src={trailerUrl.includes("?") 
                  ? `${trailerUrl}&autoplay=1&mute=0&controls=0&loop=1&playsinline=1&origin=${window.location.origin}&widget_referrer=${window.location.href}&volume=100` 
                  : `${trailerUrl}?autoplay=1&mute=0&controls=0&loop=1&playsinline=1&origin=${window.location.origin}&widget_referrer=${window.location.href}&volume=100`}
                className="w-full h-full object-cover pointer-events-none"
                style={{ pointerEvents: 'none' }}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
                frameBorder="0"
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
              />
            </div>
          ) : (
            <>
              {imageSource ? (
                <img
                  src={imageSource}
                  alt={hero.title}
                  className="w-full h-full object-cover object-center"
                  style={{ 
                    objectPosition: 'center center',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  loading="eager"
                  onError={(e) => {
                    console.error('[HeroBanner] Image failed to load:', imageSource);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-gray-600 text-lg">{hero.title}</span>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 gradient-hero-bottom z-[1] pointer-events-none" />
      <div className="absolute inset-0 gradient-hero-left z-[1] pointer-events-none" />

      {/* Content - Metadados e descrição apenas */}
      <div className="absolute bottom-[12%] sm:bottom-[20%] left-0 px-3 sm:px-4 md:px-8 lg:px-12 max-w-2xl z-30 pointer-events-none w-full sm:w-auto pr-4 sm:pr-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id + "-content"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pointer-events-none"
          >
            <p className="text-[10px] sm:text-xs md:text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1.5 sm:gap-2 text-shadow-premium flex-wrap">
              <span className="text-primary">Novo</span>
              <span className="hidden sm:inline">•</span>
              <span>{hero.year}</span>
              <span className="text-[#ffff5c]">{hero.rating}</span>
            </p>
            <h2 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-[900] text-white mb-3 sm:mb-4 leading-[1.2] sm:leading-[1.1] drop-shadow-2xl text-shadow-premium line-clamp-2">
              {hero.title}
            </h2>
            <p className="text-sm sm:text-base md:text-[clamp(0.9rem,1.5vw,1.4rem)] text-white/90 mb-4 sm:mb-8 line-clamp-2 md:line-clamp-3 max-w-2xl drop-shadow-md text-shadow-premium leading-[1.3] sm:leading-[1.4]">
              {hero.description}
            </p>
            
            {/* Metadados */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-300 mb-4 flex-wrap">
              {/* Nota TMDB */}
              {hero.rating && hero.rating !== "N/A" && (
                <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap font-semibold">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>
                  </svg>
                  {hero.rating}
                </span>
              )}
              {/* País com Bandeira */}
              {hero.country && (
                <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap flex items-center gap-1">
                  {getCountryFlag(hero.country)} {hero.country}
                </span>
              )}
              {/* Ano */}
              {hero.year && parseInt(hero.year) > 0 && (
                <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                  {hero.year}
                </span>
              )}
              {/* Duração */}
              {hero.duration && (
                <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                  ⏱️ {hero.duration}
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>


      {isPlayerOpen && hero && (
        <VideoJSPlayer 
          url={(() => {
            const videoUrl = hero.type === "series" 
              ? (hero.identificadorArchive?.startsWith("http") ? hero.identificadorArchive : hero.identificadorArchive ? `https://archive.org/embed/${hero.identificadorArchive}` : null)
              : (hero.url || trailerUrl || null);
            console.log('[HeroBanner] VideoJSPlayer URL:', videoUrl);
            return videoUrl || "";
          })()} 
          title={hero.title || "Sem título"}
          poster={hero.poster || ""}
          onClose={() => {
            console.log('[HeroBanner] Fechando player');
            setIsPlayerOpen(false);
          }} 
        />
      )}

      {/* Shadow Overlays (Vignette) */}
      <div className="absolute inset-0 bg-black/20 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] z-[2] pointer-events-none" />

    </section>
  );
};

export default HeroBanner;
