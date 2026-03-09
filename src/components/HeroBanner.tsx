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
      // 1. Prioritize DB Trailer as requested
      if (hero.trailer) {
        trailerTimeout.current = setTimeout(() => {
          setTrailerUrl(hero.trailer);
          setShowTrailer(true);
        }, 300);
        
        // Still fetch TMDB details for metadata if missing
        if (hero.tmdbId) {
          const type = hero.id.includes("series") ? "tv" : "movie";
          const data = await fetchTmdbDetails(hero.tmdbId, type);
          if (data) setCurrentHeroData(data);
        }
      } else if (hero.tmdbId) {
        // 2. Fallback to TMDB lookup
        const type = hero.id.includes("series") ? "tv" : "movie";
        const data = await fetchTmdbDetails(hero.tmdbId, type);
        if (data) {
          setCurrentHeroData(data);
          const url = getTmdbTrailerUrl(data.videos);
          setTrailerUrl(url);
          
          trailerTimeout.current = setTimeout(() => {
            setShowTrailer(true);
          }, 300);
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
    }, 15000); // More time for trailers
    return () => clearInterval(timer);
  }, [heroItems.length]);

  if (isLoading || heroItems.length === 0) {
    return (
      <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Carregando...</span>
      </section>
    );
  }

  const hero = heroItems[current];
  const goTo = (dir: number) =>
    setCurrent((prev) => (prev + dir + heroItems.length) % heroItems.length);

  return (
    <section className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={hero.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {showTrailer && trailerUrl ? (
            <div className="absolute inset-0 scale-[1.3] pointer-events-none">
              <iframe
                src={`${trailerUrl}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`}
                className="w-full h-full object-cover"
                allow="autoplay; encrypted-media"
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
      <div className="absolute inset-0 gradient-hero-bottom z-[1]" />
      <div className="absolute inset-0 gradient-hero-left z-[1]" />

      {/* Content */}
      <div className="absolute bottom-[15%] sm:bottom-[20%] left-0 px-4 md:px-8 lg:px-12 max-w-2xl z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={hero.id + "-content"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-xs sm:text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2 text-shadow-premium">
              <span className="text-primary">Novo</span>
              <span>• {hero.genre.join(" • ")}</span>
              <span>• {hero.year}</span>
              <span className="text-[#ffff5c]">{hero.rating}</span>
            </p>
            <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-[900] text-white mb-4 leading-tight drop-shadow-2xl text-shadow-premium">
              {hero.title}
            </h2>
            <p className="text-[clamp(1rem,1.3vw,1.25rem)] text-white/90 mb-8 line-clamp-2 md:line-clamp-3 max-w-xl drop-shadow-md text-shadow-premium leading-[1.4]">
              {hero.description}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsPlayerOpen(true)}
                className="flex items-center gap-3 btn-glow-primary font-bold text-[clamp(0.9rem,1.2vw,1.1rem)] px-6 sm:px-8 py-3 sm:py-4 transition-transform z-10"
              >
                <Play size={24} fill="currentColor" /> Assistir Agora
              </button>
              <button 
                onClick={() => navigate(`/details/${hero.id.includes("series") ? "series" : "cinema"}/${hero.tmdbId || hero.id}`)}
                className="flex items-center gap-3 btn-glow-secondary font-bold text-[clamp(0.9rem,1.2vw,1.1rem)] px-6 sm:px-8 py-3 sm:py-4 transition-transform z-10"
              >
                <Info size={24} /> Mais Informações
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
      <div className="absolute inset-0 bg-black/20 shadow-[inset_0_0_200px_rgba(0,0,0,0.8)] z-[2]" />

      {/* Indicators */}
      <div className="absolute bottom-10 left-12 flex gap-3 z-20">
        {heroItems.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current ? "w-12 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "w-6 bg-white/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
