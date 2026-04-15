import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Heart, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from '@/components/AuthProvider';
import { useRatings } from "@/hooks/useRatings";
import { fetchTmdbDetails, getTmdbTrailerUrl, tmdbImageUrl } from "@/services/tmdb";
import { useNavigate } from "react-router-dom";
import NetflixPlayer from "./NetflixPlayer";
import { toast } from "sonner";

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
  const [current, setCurrent] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const { data: categories, isLoading } = useSupabaseContent();
  const trailerTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const normalizedFilter = filterCategory?.toLowerCase().trim();
  const filteredItems = filterCategory 
    ? categories?.filter(cat => {
        if (normalizedFilter === "cinema") return cat.id.startsWith("cinema-");
        if (normalizedFilter === "séries") return cat.id.startsWith("series-");
        if (normalizedFilter === "filmes infantis") return cat.id === "kids-movies";
        if (normalizedFilter?.startsWith("séries infant")) return cat.id === "kids-series";
        return cat.title.toLowerCase().includes(normalizedFilter!);
      }).flatMap(cat => cat.items) || []
    : categories?.flatMap(cat => cat.items.slice(0, 2)) || [];

  const heroItems = filteredItems.slice(0, 6);

  const [currentHeroData, setCurrentHeroData] = useState<any>(null);
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();
  const { isLiked, isDisliked, toggleRating } = useRatings();

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

  if (isLoading || heroItems.length === 0) {
    return (
      <section className="relative w-full h-[70vh] sm:aspect-video sm:max-h-[85vh] bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Carregando...</span>
      </section>
    );
  }

  const hero = heroItems[current];
  
  // Debug logging
  console.log('[HeroBanner] Current hero:', {
    id: hero.id,
    title: hero.title,
    backdrop: hero.backdrop,
    image: hero.image,
    currentHeroData: currentHeroData?.backdrop_path
  });
  
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
            <img
              src={currentHeroData?.backdrop_path ? tmdbImageUrl(currentHeroData.backdrop_path, "original") : (hero.backdrop || hero.image)}
              alt={hero.title}
              className="w-full h-full object-cover object-center"
              style={{ 
                objectPosition: 'center center',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              loading="eager"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 gradient-hero-bottom z-[1] pointer-events-none" />
      <div className="absolute inset-0 gradient-hero-left z-[1] pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-[12%] sm:bottom-[20%] left-0 px-3 sm:px-4 md:px-8 lg:px-12 max-w-2xl z-30 pointer-events-auto w-full sm:w-auto pr-4 sm:pr-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id + "-content"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pointer-events-auto"
          >
            <p className="text-[10px] sm:text-xs md:text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1.5 sm:gap-2 text-shadow-premium flex-wrap">
              <span className="text-primary">Novo</span>
              <span className="hidden sm:inline">•</span>
              <span className="truncate max-w-[120px] sm:max-w-none">{hero.genre.slice(0, 2).join(" • ")}</span>
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
              {/* Primeiro gênero */}
              {hero.genre && (
                <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                  {Array.isArray(hero.genre) ? hero.genre[0] : hero.genre}
                </span>
              )}
              {/* Duração */}
              {hero.duration && (
                <span className="bg-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                  ⏱️ {hero.duration}
                </span>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-nowrap items-center gap-2 sm:gap-3 overflow-x-auto">
              <button
                onClick={() => {
                  console.log('[HeroBanner] Botão Assistir clicado:', { hero, url: hero?.url, trailerUrl });
                  setIsPlayerOpen(true);
                }}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>Assistir</span>
              </button>
              <button
                onClick={() => setShowTrailer(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#FF0000] hover:bg-[#cc0000] text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Trailer</span>
              </button>
              
              {/* Ícones de interação - mesma linha */}
              <div className="w-px h-8 bg-white/20 mx-1 sm:mx-2 flex-shrink-0" />
              <button
                onClick={async () => {
                  if (!user) {
                    toast.error("Faça login para adicionar aos favoritos");
                    return;
                  }
                  if (!hero) return;
                  
                  const contentId = hero.id?.toString().split('-')[1] || hero.id;
                  const contentType = hero.id?.toString().startsWith('series') ? 'series' : 'movie';
                  
                  await toggleFavorite({
                    content_id: parseInt(contentId),
                    content_type: contentType,
                    titulo: hero.title,
                    poster: hero.image,
                    banner: hero.backdrop,
                    rating: hero.rating,
                    year: hero.year,
                    genero: Array.isArray(hero.genre) ? hero.genre[0] : hero.genre
                  });
                }}
                disabled={favLoading}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 flex-shrink-0 disabled:opacity-50"
                title={isFavorite(parseInt(hero?.id?.toString().split('-')[1] || '0'), hero?.id?.toString().startsWith('series') ? 'series' : 'movie') ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                <Heart 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isFavorite(parseInt(hero?.id?.toString().split('-')[1] || '0'), hero?.id?.toString().startsWith('series') ? 'series' : 'movie') ? 'fill-red-600 text-red-600' : 'text-white'}`} 
                />
              </button>
              <button
                onClick={async () => {
                  if (!user) { toast.error("Faça login para avaliar"); return; }
                  if (!hero) return;
                  const contentId = hero.id?.toString().split('-')[1] || hero.id;
                  const contentType = hero.id?.toString().startsWith('series') ? 'series' : 'movie';
                  await toggleRating({
                    content_id: contentId,
                    content_type: contentType,
                    titulo: hero.title,
                    poster: hero.image,
                    banner: hero.backdrop,
                    rating: hero.rating
                  }, 'like');
                }}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${isLiked(hero?.id?.toString().split('-')[1] || '', hero?.id?.toString().startsWith('series') ? 'series' : 'movie') ? 'bg-green-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                title="Gostei"
              >
                <ThumbsUp 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isLiked(hero?.id?.toString().split('-')[1] || '', hero?.id?.toString().startsWith('series') ? 'series' : 'movie') ? 'fill-green-500 text-green-500' : 'text-white'}`} 
                />
              </button>
              <button
                onClick={async () => {
                  if (!user) { toast.error("Faça login para avaliar"); return; }
                  if (!hero) return;
                  const contentId = hero.id?.toString().split('-')[1] || hero.id;
                  const contentType = hero.id?.toString().startsWith('series') ? 'series' : 'movie';
                  await toggleRating({
                    content_id: contentId,
                    content_type: contentType,
                    titulo: hero.title,
                    poster: hero.image,
                    banner: hero.backdrop,
                    rating: hero.rating
                  }, 'dislike');
                }}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${isDisliked(hero?.id?.toString().split('-')[1] || '', hero?.id?.toString().startsWith('series') ? 'series' : 'movie') ? 'bg-red-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                title="Não gostei"
              >
                <ThumbsDown 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isDisliked(hero?.id?.toString().split('-')[1] || '', hero?.id?.toString().startsWith('series') ? 'series' : 'movie') ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {isPlayerOpen && hero && (
        <NetflixPlayer 
          url={(() => {
            const videoUrl = hero.type === "series" 
              ? (hero.identificadorArchive?.startsWith("http") ? hero.identificadorArchive : hero.identificadorArchive ? `https://archive.org/embed/${hero.identificadorArchive}` : null)
              : (hero.url || trailerUrl || null);
            console.log('[HeroBanner] NetflixPlayer URL:', videoUrl);
            return videoUrl || "";
          })()} 
          title={hero.title || "Sem título"} 
          historyItem={hero}
          onClose={() => {
            console.log('[HeroBanner] Fechando player');
            setIsPlayerOpen(false);
          }} 
        />
      )}

      {/* Shadow Overlays (Vignette) */}
      <div className="absolute inset-0 bg-black/20 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] z-[2] pointer-events-none" />

      {/* Indicators */}
      <div className="absolute bottom-3 sm:bottom-6 md:bottom-8 lg:bottom-10 left-3 sm:left-6 md:left-8 lg:left-12 flex gap-1.5 sm:gap-3 z-20 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
        {heroItems.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={`h-0.5 sm:h-1 md:h-1.5 rounded-full transition-all duration-500 ${
              i === current ? "w-4 sm:w-8 md:w-12 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "w-2 sm:w-4 md:w-6 bg-white/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
