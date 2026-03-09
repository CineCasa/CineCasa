import { useState, useRef, useEffect } from "react";
import { Play, Plus, ThumbsUp, Heart, Volume2, VolumeX, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContentItem } from "@/data/content";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTmdbDetails, getTmdbTrailerUrl } from "@/services/tmdb";
import NetflixPlayer from "./NetflixPlayer";

interface ContentCardProps {
  item: ContentItem & { progress?: number, isComingSoon?: boolean };
  index: number;
  isLast?: boolean;
  showProgress?: boolean;
}

const ContentCard = ({ item, index, isLast = false, showProgress = false }: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(item.trailer || null);
  const [metadata, setMetadata] = useState<{ duration: string; rating: string } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const trailerLoadTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleNavigateToDetails = () => {
    if (item.isComingSoon) return;
    const typePath = item.id.includes("series") ? "series" : "cinema";
    // If the item doesn't have a tmdbId, we might pass its ID
    navigate(`/details/${typePath}/${item.tmdbId || item.id}`);
  };

  useEffect(() => {
    if (isHovered && item.tmdbId && !metadata) {
      const type = item.id.includes("series") ? "tv" : "movie";
      fetchTmdbDetails(item.tmdbId, type).then((data) => {
        if (data) {
          const duration = type === "movie" 
            ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}min`
            : `${data.numberOf_seasons} Temporadas`;
          setMetadata({
            duration,
            rating: data.vote_average?.toFixed(1) || item.rating
          });
          if (!trailerUrl) {
            setTrailerUrl(getTmdbTrailerUrl(data.videos));
          }
        }
      });
    }
  }, [isHovered, item.tmdbId]);

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
      // Trailer delay of 1500ms as requested
      trailerLoadTimeout.current = setTimeout(() => setShowTrailer(true), 1500);
    }, 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    if (trailerLoadTimeout.current) clearTimeout(trailerLoadTimeout.current);
    setIsHovered(false);
    setShowTrailer(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isHovered) {
        setIsHovered(true);
      } else if (!item.isComingSoon) {
        setIsPlayerOpen(true);
      }
    }
    if (e.key === "Escape") {
      setIsHovered(false);
    }
  };

  const getTransformOrigin = () => {
    const el = containerRef.current;
    if (!el) return "left center"; // Default Prime Video style: expand from left to right
    
    const rect = el.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    // Se estiver muito perto da borda direita, expande para a esquerda para não sumir da tela
    if (rect.right > windowWidth - 150) return "right center";
    
    // Padrão Prime: Fixa a esquerda e cresce para a direita
    return "left center";
  };

  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`relative flex-shrink-0 
        w-[calc((100vw-32px-16px)/2)] 
        md:w-[calc((100vw-64px-48px)/3)] 
        lg:w-[calc((100vw-96px-96px)/5)] 
        aspect-[2/3] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-lg ${
        isHovered ? "z-[99999]" : "z-0"
      }`}
    >
      {/* BASE PORTRAIT IMAGE (Visible when NOT hovered) */}
      <div className={`w-full h-full rounded-lg overflow-hidden bg-secondary shadow-lg transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"}`}>
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {item.isComingSoon && (
           <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg z-30">
             Em Breve
           </div>
        )}
        {showProgress && item.progress && (
           <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50 overflow-hidden z-20">
              <div className="h-full bg-[var(--glow)] transition-all" style={{ width: `${item.progress}%` }} />
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 flex flex-col justify-end">
           <h3 className="text-sm font-bold text-white truncate drop-shadow-md">{item.title}</h3>
           <div className="flex items-center gap-2 mt-1">
              <span className="text-primary text-xs font-black drop-shadow-sm">{item.rating}</span>
              <span className="text-white/60 text-[10px] uppercase font-bold">{item.year}</span>
           </div>
        </div>
      </div>

      {/* EXPANDED STATE (Floating Overlay) */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ scale: 1, opacity: 0, y: 0 }}
            animate={{ 
              scale: 1.25, // Expansão mais agressiva estilo Prime Video
              opacity: 1,
              y: -10,
              width: "160%", // Aumenta a largura para simular o formato landscape (16:9) a partir do portrait
            }}
            exit={{ scale: 1, opacity: 0, y: 0, width: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ 
              transformOrigin: getTransformOrigin(),
              zIndex: 100000,
              aspectRatio: "16 / 9" // Força o formato de vídeo
            }}
            className="absolute top-0 left-0 bg-[#1b1b1b] rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/20"
          >
            {/* TOP: MEDIA SECTION (VIDEO OR PHOTO) - Preenche tudo se tiver trailer */}
            <div className={`relative w-full h-full overflow-hidden bg-black ${showTrailer ? "" : "aspect-video"}`}>
              {showTrailer && trailerUrl ? (
                <iframe
                  src={trailerUrl.includes("?") 
                    ? `${trailerUrl}&autoplay=1&controls=0&mute=0&loop=1&origin=${window.location.origin}` 
                    : `${trailerUrl}?autoplay=1&controls=0&mute=0&loop=1&origin=${window.location.origin}`}
                  className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  title={item.title}
                  frameBorder="0"
                />
              ) : (
                <>
                  <img
                    src={item.backdrop || item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 z-10">
                    <h3 className="text-white font-black text-sm drop-shadow-lg text-shadow-premium">{item.title}</h3>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#141414] to-transparent" />
                </>
              )}
            </div>

            {/* BOTTOM: METADATA SECTION (Only visible if NOT playing trailer) */}
            {!showTrailer && (
              <div className="p-4 flex flex-col gap-3 bg-[#1b1b1b]">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => !item.isComingSoon && setIsPlayerOpen(true)}
                      className={`p-2 rounded-full transition-colors ${item.isComingSoon ? "bg-white/30 text-white/50 cursor-not-allowed" : "bg-white text-black hover:bg-white/80"}`}
                    >
                      <Play size={16} fill="currentColor" />
                    </button>
                    <button className="p-2 rounded-full border border-white/40 text-white hover:bg-white/10 transition-colors">
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={handleNavigateToDetails}
                      className={`p-2 rounded-full border border-white/40 transition-colors ${item.isComingSoon ? "text-white/30 border-white/20 cursor-not-allowed" : "text-white hover:bg-white/10"}`}
                      title="Mais Informações"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[#ffff5c] font-black text-xs">
                    {metadata?.rating || item.rating} Relevante
                  </span>
                  <span className="text-white font-bold text-[10px] px-1.5 py-0.5 border border-white/40 rounded leading-none">
                    {item.rating}
                  </span>
                  <span className="text-white/60 text-xs">{item.year}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isPlayerOpen && (
        <NetflixPlayer 
          url={
            item.type === "series" 
              ? (item.identificadorArchive?.startsWith("http") ? item.identificadorArchive : `https://archive.org/embed/${item.identificadorArchive}`)
              : (item.url || trailerUrl || "")
          } 
          title={item.title} 
          historyItem={item}
          onClose={() => setIsPlayerOpen(false)} 
        />
      )}
    </div>
  );
};

export default ContentCard;
