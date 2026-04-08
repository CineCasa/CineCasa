import { useState, useEffect, useRef } from "react";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";
import { fetchTmdbDetails, getTmdbTrailerUrl, tmdbImageUrl } from "@/services/tmdb";
import { useNavigate } from "react-router-dom";
import NetflixPlayer from "./NetflixPlayer";

interface HeroBannerProps {
  filterCategory?: string;
}

const HeroBanner = ({ filterCategory }: HeroBannerProps) => {
  console.log('[HeroBanner] Component mounted, filterCategory:', filterCategory);
  const [current, setCurrent] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const { data: categories, isLoading } = useSupabaseContent();
  const trailerTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const navigate = useNavigate();

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
      <section className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh] min-h-[300px] max-h-[900px] bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Carregando...</span>
      </section>
    );
  }

  const hero = heroItems[current];
  const goTo = (dir: number) =>
    setCurrent((prev) => (prev + dir + heroItems.length) % heroItems.length);

  return (
    <section 
      className="relative w-full h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[70vh] xl:h-[75vh] min-h-[300px] max-h-[900px] overflow-hidden"
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
              className="w-full h-full object-cover object-center scale-105"
              loading="eager"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 gradient-hero-bottom z-[1] pointer-events-none" />
      <div className="absolute inset-0 gradient-hero-left z-[1] pointer-events-none" />

      {/* Content */}
      <div className="absolute bottom-[15%] sm:bottom-[20%] left-0 px-4 md:px-8 lg:px-12 max-w-2xl z-50 pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id + "-content"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pointer-events-auto"
          >
            <p className="text-xs sm:text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2 text-shadow-premium">
              <span className="text-primary">Novo</span>
              <span>• {hero.genre.join(" • ")}</span>
              <span>• {hero.year}</span>
              <span className="text-[#ffff5c]">{hero.rating}</span>
            </p>
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-[900] text-white mb-4 leading-[1.1] drop-shadow-2xl text-shadow-premium">
              {hero.title}
            </h2>
            <p className="text-[clamp(0.9rem,1.5vw,1.4rem)] text-white/90 mb-8 line-clamp-2 md:line-clamp-3 max-w-2xl drop-shadow-md text-shadow-premium leading-[1.4]">
              {hero.description}
            </p>
            <div className="flex gap-4 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[HeroBanner] BOTÃO ASSISTIR CLICADO!');
                  const hero = heroItems[current];
                  console.log('[HeroBanner] Hero selecionado:', hero);
                  if (!hero) {
                    console.error('[HeroBanner] Nenhum hero selecionado');
                    return;
                  }
                  const url = hero.type === "series" 
                    ? (hero.identificadorArchive?.startsWith("http") ? hero.identificadorArchive : hero.identificadorArchive ? `https://archive.org/embed/${hero.identificadorArchive}` : null)
                    : (hero.url || trailerUrl || null);
                  
                  if (!url) {
                    console.error('[HeroBanner] URL não disponível, navegando para detalhes');
                    navigate(`/details/${hero.id.includes("series") ? "series" : "cinema"}/${hero.tmdbId || hero.id}`);
                    return;
                  }
                  
                  console.log('[HeroBanner] Abrindo player com URL:', url);
                  setIsPlayerOpen(true);
                }}
                className="hero-action-btn flex items-center gap-3 font-bold text-white bg-primary hover:bg-primary/90 px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all z-[100] pointer-events-auto cursor-pointer relative"
                style={{ pointerEvents: 'auto' }}
              >
                <Play size={24} fill="currentColor" /> Assistir Agora
              </button>
              <button 
                onClick={() => {
                  const hero = heroItems[current];
                  console.log('[HeroBanner] Trailer clicado:', hero);
                  if (!hero) {
                    console.error('[HeroBanner] Nenhum hero selecionado');
                    return;
                  }
                  const type = hero.id.includes("series") ? "series" : "cinema";
                  const id = hero.tmdbId || hero.id;
                  console.log(`[HeroBanner] Navegando para: /details/${type}/${id}`);
                  navigate(`/details/${type}/${id}`);
                }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    (document.querySelector('[tabindex="0"]:not(.hero-action-btn):not(.nav-link-item)') as HTMLElement)?.focus();
                  }
                }}
                className="hero-action-btn flex items-center gap-3 btn-glow-secondary font-bold text-[clamp(0.9rem,1.2vw,1.1rem)] px-6 sm:px-8 py-3 sm:py-4 transition-transform z-50 focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-black outline-none relative"
              >
                <Play size={24} fill="currentColor" /> TRAILER
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {isPlayerOpen && (
        <NetflixPlayer 
          url={
            hero.type === "series" 
              ? (hero.identificadorArchive?.startsWith("http") ? hero.identificadorArchive : `https://archive.org/embed/${hero.identificadorArchive}`)
              : (hero.url || trailerUrl || "")
          } 
          title={hero.title} 
          historyItem={hero}
          onClose={() => setIsPlayerOpen(false)} 
        />
      )}

      {/* Shadow Overlays (Vignette) */}
      <div className="absolute inset-0 bg-black/20 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] z-[2] pointer-events-none" />

      {/* Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 left-4 sm:left-6 md:left-8 lg:left-12 flex gap-2 sm:gap-3 z-20 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
        {heroItems.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${
              i === current ? "w-6 sm:w-8 md:w-12 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "w-3 sm:w-4 md:w-6 bg-white/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
