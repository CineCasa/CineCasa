import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ContentItem } from "@/data/content";
import YouTubePlayer from "./YouTubePlayer";
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
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true); // Mostrar imediatamente

  const handleNavigateToDetails = () => {
    if (item.isComingSoon) return;
    const typePath = item.id.includes("series") ? "series" : "cinema";
    // Extract numeric ID from prefixed IDs like "cinema-123" or "series-456"
    const numericId = parseInt(item.id.split('-').pop() || '');
    const id = numericId || item.tmdbId || item.id;
    navigate(`/details/${typePath}/${id}`);
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
      onKeyDown={handleKeyDown}
      onClick={handleNavigateToDetails}
      tabIndex={0}
      role="button"
      aria-label={`${item.title} - ${item.type === 'movie' ? 'Filme' : 'Série'}`}
      className="content-card relative flex-shrink-0 
        w-[calc(50vw-12px)] 
        sm:w-[calc((100vw-32px-16px)/3)] 
        md:w-[calc((100vw-64px-48px)/4)] 
        lg:w-[calc((100vw-96px-96px)/5)] 
        xl:w-[calc((100vw-128px-128px)/6)] 
        aspect-[2/3] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-xl cursor-pointer scroll-m-4
        border border-white/5
        z-0
      "
    >
      {/* BASE PORTRAIT IMAGE */}
      <div 
        onClick={handleNavigateToDetails}
        className="w-full h-full rounded-xl overflow-hidden bg-secondary shadow-lg transition-all duration-300">
        {isVisible ? (
          <img
            src={item.image || item.poster || `https://placehold.co/300x450/1a1a1a/666666?text=${encodeURIComponent(item.title || 'Sem+Título')}`}
            alt={item.title}
            className="w-full h-full object-cover animate-in fade-in duration-500"
            loading="lazy"
            onError={(e) => {
              // Fallback se a imagem falhar ao carregar
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/300x450/1a1a1a/666666?text=${encodeURIComponent(item.title || 'Sem+Título')}`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-secondary animate-pulse" />
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

      {isPlayerOpen && item && (
        <YouTubePlayer 
          url={item.type === "series" 
            ? (item.identificadorArchive?.startsWith("http") ? item.identificadorArchive : item.identificadorArchive ? `https://archive.org/embed/${item.identificadorArchive}` : '')
            : (item.url || '')} 
          title={item.title || "Sem título"}
          poster={item.poster || ""}
          contentType={(item.type as 'movie' | 'series') || 'movie'}
          contentId={item.id || ""}
          onClose={() => setIsPlayerOpen(false)} 
        />
      )}
    </div>
  );
};
}

export default ContentCard;
