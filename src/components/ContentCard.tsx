import { useState, useRef, useEffect } from "react";
import { Play, Plus, ThumbsUp, Heart, Volume2, VolumeX, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContentItem } from "@/data/content";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTmdbDetails, getTmdbTrailerUrl } from "@/services/tmdb";
import NetflixPlayer from "./NetflixPlayer";
import { FavoriteButtonSimple } from "./FavoriteButton";
import { useAuth } from "@/components/AuthProvider";

interface ContentCardProps {
  item: ContentItem & { progress?: number, isComingSoon?: boolean };
  index: number;
  isLast?: boolean;
  showProgress?: boolean;
  rowIndex?: number;
  colIndex?: number;
}

const ContentCard = ({ item, index, isLast = false, showProgress = false, rowIndex, colIndex }: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(item.trailer || null);
  const [metadata, setMetadata] = useState<{ duration: string; rating: string } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  const trailerLoadTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  
  // Hooks do Supabase
  const { user } = useAuth();
  
  // Determinar tipo de conteúdo e ID
  const contentType = item.id.includes("series") ? "series" : "movie";
  const contentId = parseInt(item.id) || item.tmdbId || 0;

  const handleNavigateToDetails = () => {
    if (item.isComingSoon) return;
    const typePath = item.id.includes("series") ? "series" : "cinema";
    // Usar o ID do banco de dados (prioridade) em vez do tmdbId
    const id = item.id || item.tmdbId;
    navigate(`/details/${typePath}/${id}`);
  };

  useEffect(() => {
    // Carregar trailer e metadados imediatamente quando disponível
    if (item.tmdbId && !metadata) {
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
          // Sempre tentar carregar trailer
          const trailer = getTmdbTrailerUrl(data.videos);
          if (trailer) {
            setTrailerUrl(trailer);
          }
        }
      });
    }
    
    // Se já tem trailer no item, usar imediatamente
    if (item.trailer && !trailerUrl) {
      setTrailerUrl(item.trailer);
    }
  }, [item.tmdbId, item.id, item.trailer]);


  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovered(true);
      // Trailer delay reduzido para resposta mais rápida
      trailerLoadTimeout.current = setTimeout(() => setShowTrailer(true), 300);
    }, 100);
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
      handleNavigateToDetails();
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const row = containerRef.current?.closest('.row-scroll-container');
      const allCards = Array.from(row?.querySelectorAll('[tabindex="0"]') || []);
      const currentIndex = allCards.indexOf(containerRef.current!);
      let next = allCards[currentIndex + 1] as HTMLElement;
      
      if (!next) {
        next = allCards[0] as HTMLElement;
      }

      if (next) {
        next.focus();
        next.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const row = containerRef.current?.closest('.row-scroll-container');
      const allCards = Array.from(row?.querySelectorAll('[tabindex="0"]') || []);
      const currentIndex = allCards.indexOf(containerRef.current!);
      let prev = allCards[currentIndex - 1] as HTMLElement;

      if (prev) {
        prev.focus();
        prev.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      } else {
        const navLinks = document.querySelectorAll('.nav-link-item');
        (navLinks[0] as HTMLElement)?.focus();
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentRow = containerRef.current?.closest(".row-wrapper");
      let nextRow = currentRow?.nextElementSibling;
      while (nextRow && !nextRow.querySelector('[tabindex="0"]')) {
        nextRow = nextRow.nextElementSibling;
      }

      if (nextRow) {
        const rect = containerRef.current?.getBoundingClientRect();
        const allNextCards = Array.from(nextRow.querySelectorAll('[tabindex="0"]'));
        
        // Encontrar o card mais próximo horizontalmente
        const closest = allNextCards.reduce((prev, curr) => {
          const prevRect = (prev as HTMLElement).getBoundingClientRect();
          const currRect = (curr as HTMLElement).getBoundingClientRect();
          return Math.abs(currRect.left - rect!.left) < Math.abs(prevRect.left - rect!.left) ? curr : prev;
        }) as HTMLElement;

        if (closest) {
          closest.focus();
          closest.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        (document.querySelector('footer a') as HTMLElement)?.focus();
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentRow = containerRef.current?.closest(".row-wrapper");
      let prevRow = currentRow?.previousElementSibling;

      while (prevRow && !prevRow.querySelector('[tabindex="0"]')) {
        prevRow = prevRow.previousElementSibling;
      }

      if (prevRow) {
        const rect = containerRef.current?.getBoundingClientRect();
        const allPrevCards = Array.from(prevRow.querySelectorAll('[tabindex="0"]'));
        
        const closest = allPrevCards.reduce((prev, curr) => {
          const prevRect = (prev as HTMLElement).getBoundingClientRect();
          const currRect = (curr as HTMLElement).getBoundingClientRect();
          return Math.abs(currRect.left - rect!.left) < Math.abs(prevRect.left - rect!.left) ? curr : prev;
        }) as HTMLElement;

        if (closest) {
          closest.focus();
          closest.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        const heroBtns = document.querySelectorAll('.hero-action-btn');
        if (heroBtns.length > 0) {
          (heroBtns[0] as HTMLElement).focus();
        } else {
          const navLinks = document.querySelectorAll('.nav-link-item');
          (navLinks[0] as HTMLElement)?.focus();
        }
      }
    }

    if (e.key === "Escape") {
      setIsHovered(false);
    }
  };

  const getTransformOrigin = () => {
    const el = containerRef.current;
    if (!el) return "left center"; 
    
    const rect = el.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    if (rect.right > windowWidth - 150) return "right center";
    return "left center";
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-focusable="true"
      data-row={rowIndex}
      data-col={colIndex}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={(e) => {
        setIsHovered(true);
        // Scroll into view when focused (for keyboard navigation)
        e.currentTarget.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center', 
          inline: 'center' 
        });
      }}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      onClick={handleNavigateToDetails}
      tabIndex={0}
      role="button"
      aria-label={`${item.title} - ${item.type === 'movie' ? 'Filme' : 'Série'}`}
      className={`content-card relative flex-shrink-0 
        w-[calc(50vw-12px)] 
        sm:w-[calc((100vw-32px-16px)/3)] 
        md:w-[calc((100vw-64px-48px)/4)] 
        lg:w-[calc((100vw-96px-96px)/5)] 
        xl:w-[calc((100vw-128px-128px)/6)] 
        aspect-[2/3] transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-lg cursor-pointer scroll-m-4 ${
        isHovered ? "z-[99999]" : "z-0"
      }`}
    >
      {/* BASE PORTRAIT IMAGE */}
      <div 
        onClick={handleNavigateToDetails}
        className={`w-full h-full rounded-lg overflow-hidden bg-secondary shadow-lg transition-opacity duration-300 ${isHovered ? "opacity-0" : "opacity-100"} ${!item.isComingSoon && 'cursor-pointer hover:opacity-90'}`}>
        {isVisible ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover animate-in fade-in duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-secondary animate-pulse" />
        )}
        {item.isComingSoon && (
           <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg z-30">
             Em Breve
           </div>
        )}
        {!item.isComingSoon && (
          <FavoriteButtonSimple 
            item={{
              contentId: (item.tmdbId ? parseInt(String(item.tmdbId)) : null) || parseInt(item.id) || 0,
              contentType: item.id.includes("series") ? 'series' : 'movie',
              titulo: item.title,
              poster: item.poster,
              banner: item.banner,
              rating: item.rating,
              year: item.year?.toString(),
              genero: item.genre?.[0],
            }}
            userId={user?.id}
            className="top-2 right-2"
          />
        )}
        {showProgress && item.progress && item.progress > 0 && item.progress < 100 && (
           <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 z-20">
             <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-red-600 rounded-full transition-all duration-300"
                 style={{ width: `${item.progress}%` }}
               />
             </div>
             <div className="flex justify-between items-center mt-1">
               <span className="text-xs text-white font-medium">{item.progress}%</span>
               {item.episodeNumber && (
                 <span className="text-xs text-gray-300">E{item.episodeNumber}</span>
               )}
             </div>
           </div>
        )}
      </div>

      {/* EXPANDED STATE */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ scale: 1, opacity: 0, y: 0 }}
            animate={{ 
              scale: 1.25,
              opacity: 1,
              y: -10,
              width: "160%",
              height: "auto"
            }}
            exit={{ scale: 1, opacity: 0, y: 0, width: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{ 
              transformOrigin: getTransformOrigin(),
              zIndex: 100000,
            }}
            className="absolute top-0 left-0 bg-[#1b1b1b] rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/20 w-[160%] h-auto"
          >
            {/* TOP: MEDIA SECTION (VIDEO OR PHOTO) */}
            <div className={`relative w-full aspect-video overflow-hidden bg-black`}>
              {showTrailer && trailerUrl ? (
                <iframe
                  src={trailerUrl.includes("?") 
                    ? `${trailerUrl}&autoplay=1&mute=0&controls=1&loop=1&playsinline=1&origin=${window.location.origin}&widget_referrer=${window.location.href}&volume=100` 
                    : `${trailerUrl}?autoplay=1&mute=0&controls=1&loop=1&playsinline=1&origin=${window.location.origin}&widget_referrer=${window.location.href}&volume=100`}
                  className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  title={item.title}
                  frameBorder="0"
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                />
              ) : (
                <>
                  <img
                    src={item.backdrop || item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute bottom-4 left-4 z-10 right-4">
                    <h3 className="text-white font-black text-[24px] sm:text-[30px] drop-shadow-lg text-shadow-premium break-words whitespace-normal leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#141414] to-transparent" />
                </>
              )}
            </div>

            {/* BOTTOM: METADATA */}
            <div className="p-4 flex flex-col gap-3 bg-[#1b1b1b] border-t border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-[#ffff5c] font-black text-xs">
                  {metadata?.rating || item.rating} Relevante
                </span>
                <span className="text-white/60 text-xs font-bold">{item.year}</span>
                <span className="text-white/40 text-[10px] px-1.5 py-0.5 border border-white/20 rounded leading-none uppercase">
                  {item.rating}
                </span>
                {metadata?.duration && (
                  <span className="text-white/60 text-xs">{metadata.duration}</span>
                )}
              </div>

              <p className="text-white/80 text-[10px] sm:text-xs line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPlayerOpen && item && (
        <NetflixPlayer 
          url={(() => {
            const videoUrl = item.type === "series" 
              ? (item.identificadorArchive?.startsWith("http") ? item.identificadorArchive : item.identificadorArchive ? `https://archive.org/embed/${item.identificadorArchive}` : null)
              : (item.url || trailerUrl || null);
            console.log('[ContentCard] NetflixPlayer URL:', videoUrl);
            return videoUrl || "";
          })()} 
          title={item.title || "Sem título"} 
          historyItem={item}
          contentType={(item.type as 'movie' | 'series') || 'movie'}
          contentId={item.id || ""}
          onClose={() => {
            console.log('[ContentCard] Fechando player');
            setIsPlayerOpen(false);
          }} 
        />
      )}
    </div>
  );
};

export default ContentCard;
