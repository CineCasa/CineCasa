import { useContinueWatching, ContinueWatchingItem } from "@/hooks/useContinueWatching";
import { useNavigate } from 'react-router-dom';
import { Play, X, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  onRemove: (id: string) => void;
  onPlay: (item: ContinueWatchingItem) => void;
}

const ContinueWatchingCard = ({ item, onRemove, onPlay }: ContinueWatchingCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const progressPct = item.progress || Math.round((item.currentTime / item.duration) * 100);
  const remainingTime = formatTime(Math.max(0, item.duration - item.currentTime));
  const totalDuration = formatTime(item.duration);
  
  // Formatar label de episódio
  const getEpisodeLabel = () => {
    if (item.contentType === 'series' && item.seasonNumber && item.episodeNumber) {
      return `S${String(item.seasonNumber).padStart(2, '0')}:E${String(item.episodeNumber).padStart(2, '0')}`;
    }
    return item.contentType === 'movie' ? 'Filme' : 'Série';
  };

  return (
    <div
      className="relative flex-shrink-0 w-[280px] md:w-[320px] group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Container com Glassmorphism - Landscape */}
      <div 
        className="relative rounded-xl overflow-hidden glass-card transition-all duration-300 hover:scale-105 hover:border-[#00E5FF]/50"
        style={{
          boxShadow: isHovered 
            ? '0 0 30px rgba(0, 229, 255, 0.3), 0 10px 40px rgba(0,0,0,0.4)' 
            : '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        {/* Background Image - Aspect Ratio 16:9 Landscape */}
        <div className="relative aspect-video overflow-hidden">
          {item.banner ? (
            <img
              src={item.banner}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-gray-500 text-sm">{item.title}</span>
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Botão Remover (X) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-500/80 text-white/70 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm"
          >
            <X size={14} />
          </button>

          {/* Botão Play Flutuante - Estilo Branco Sólido */}
          <button
            onClick={() => onPlay(item)}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          >
            <div className="w-14 h-14 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center shadow-lg transform hover:scale-110 transition-all duration-200">
              <Play size={24} className="text-black ml-0.5" fill="black" />
            </div>
          </button>

          {/* Barra de Progresso Neon na Base */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-[#00E5FF] transition-all duration-500"
              style={{ 
                width: `${progressPct}%`,
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.8), 0 0 20px rgba(0, 229, 255, 0.4)'
              }}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 space-y-1.5 bg-black/40">
          {/* Título e Tipo */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm truncate leading-tight content-title">
                {item.title}
              </h3>
              <p className="text-[#00E5FF] text-xs mt-0.5 font-medium">
                {getEpisodeLabel()}
              </p>
            </div>
            <span className="text-[#00E5FF] text-xs font-bold">{progressPct}%</span>
          </div>

          {/* Tempo Restante */}
          <div className="flex items-center gap-1.5 text-white/60 text-xs content-subtitle">
            <Clock size={12} className="text-[#00E5FF]" />
            <span>{formatTime(item.currentTime)} / {totalDuration}</span>
            <span className="text-white/40">•</span>
            <span className="text-[#00E5FF]/80">{remainingTime} restantes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContinueWatchingRow = () => {
  const { rawItems, isLoading, removeItem } = useContinueWatching();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Verificar se pode scrollar
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [rawItems]);

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = 340;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Handler para reproduzir
  const handlePlay = (item: ContinueWatchingItem) => {
    const route = item.contentType === 'movie' 
      ? `/movie/${item.contentId}`
      : `/series/${item.contentId}`;
    
    navigate(route, { 
      state: { 
        resumeFrom: item.currentTime,
        episodeId: item.episodeId,
        seasonNumber: item.seasonNumber,
        episodeNumber: item.episodeNumber
      }
    });
  };

  // Filtrar itens com progresso válido (entre 1% e 95%) e limitar a 5
  const validItems = rawItems
    .filter((item) => item.progress > 1 && item.progress < 95)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="px-4 md:px-12 py-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-white">Carregando continuar assistindo...</span>
        </div>
      </div>
    );
  }

  if (validItems.length === 0) {
    // SEMPRE mostrar a seção, mesmo sem itens - não retornar null
    console.log('[ContinueWatchingRow] Sem itens válidos - rawItems:', rawItems.length, 'isLoading:', isLoading);
    
    return (
      <section className="relative py-6 px-4 md:px-8 lg:px-12">
        {/* Header com Ícone Neon Relógio */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="section-title text-lg">CONTINUAR ASSISTINDO</h2>
            <Clock 
              size={20} 
              className="text-[#00E5FF]"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))' }}
            />
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-[#00E5FF]/50 to-transparent" />
        </div>
        
        {/* Mensagem quando não há conteúdo */}
        <div className="flex items-center justify-center py-8 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/50 text-sm">
            Nenhum conteúdo em progresso. Assista algo para vê-lo aqui!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-8 px-4 md:px-8 lg:px-12">
      {/* Header com Ícone Neon Relógio */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="section-title">CONTINUAR ASSISTINDO</h2>
          <Clock 
            size={24} 
            className="text-[#00E5FF]"
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.8))'
            }}
          />
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-[#00E5FF]/50 to-transparent" />
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Botão Scroll Esquerda */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-[#00E5FF]/20 text-white hover:text-[#00E5FF] backdrop-blur-sm border border-white/10 hover:border-[#00E5FF]/50 transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Cards Container - Horizontal Landscape */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {validItems.map((item) => (
            <ContinueWatchingCard
              key={item.id}
              item={item}
              onRemove={removeItem}
              onPlay={handlePlay}
            />
          ))}
        </div>

        {/* Botão Scroll Direita */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-[#00E5FF]/20 text-white hover:text-[#00E5FF] backdrop-blur-sm border border-white/10 hover:border-[#00E5FF]/50 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* CSS para esconder scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default ContinueWatchingRow;
