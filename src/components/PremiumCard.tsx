import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface PremiumCardProps {
  id: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  progress?: number;
  year?: string;
  rating?: string;
  isNew?: boolean;
  isComingSoon?: boolean;
  trailer?: string;
  onClick?: () => void;
  isAdult?: boolean;
  'data-navigable'?: string;
  'data-nav-row'?: string;
  'data-nav-col'?: string;
  tabIndex?: number;
}

// Função para validar URL de poster
const isValidPosterUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl === 'none' || lowerUrl === 'null' || lowerUrl === 'undefined') return false;
  if (lowerUrl.includes('none') || lowerUrl.includes('null') || lowerUrl.includes('undefined')) return false;
  return true;
};

// Função para processar URL do trailer com parâmetros de autoplay
const processTrailerUrl = (url: string): string => {
  if (!url) return '';
  
  // Se já tem parâmetros, adicionar os novos
  if (url.includes('?')) {
    // Remover parâmetros existentes que podem conflitar
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?autoplay=1&mute=0&controls=0&loop=1&playlist=${url.match(/embed\/([^?]+)/)?.[1] || ''}`;
  }
  
  // Para URLs do YouTube embed
  if (url.includes('youtube.com/embed') || url.includes('youtu.be')) {
    const videoId = url.match(/embed\/([^?]+)/)?.[1] || url.match(/youtu\.be\/([^?]+)/)?.[1] || '';
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${videoId}`;
  }
  
  return url;
};

const PremiumCard: React.FC<PremiumCardProps> = ({
  id,
  title,
  poster,
  type,
  progress = 0,
  year,
  rating,
  isNew = false,
  isComingSoon = false,
  trailer,
  onClick,
  isAdult = false,
  'data-navigable': dataNavigable,
  'data-nav-row': dataNavRow,
  'data-nav-col': dataNavCol,
  tabIndex
}) => {
  // Estados para controle do trailer
  const [isHovered, setIsHovered] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trailerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Validar poster URL
  const validPoster = isValidPosterUrl(poster) ? poster : `https://picsum.photos/seed/${id || title || 'default'}/300/450.jpg`;
  
  // Verificar se tem trailer válido (apenas para desktop lg:)
  const hasTrailer = trailer && trailer.trim() !== '';
  
  // Handler para mouse enter com delay de 200ms
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    
    // Delay de 200ms antes de mostrar o trailer (apenas desktop)
    hoverTimeoutRef.current = setTimeout(() => {
      if (hasTrailer) {
        setShowTrailer(true);
      }
    }, 200);
  }, [hasTrailer]);
  
  // Handler para mouse leave - limpar timeouts e esconder trailer
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setShowTrailer(false);
    
    // Limpar timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (trailerTimeoutRef.current) {
      clearTimeout(trailerTimeoutRef.current);
      trailerTimeoutRef.current = null;
    }
  }, []);
  
  // Processar URL do trailer
  const processedTrailerUrl = hasTrailer ? processTrailerUrl(trailer) : '';
  
  return (
    <motion.div
      className="premium-card cursor-pointer group w-full relative"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={tabIndex ?? 0}
      role="button"
      aria-label={`Ver detalhes de ${title}`}
      data-navigable={dataNavigable}
      data-nav-row={dataNavRow}
      data-nav-col={dataNavCol}
    >
      {/* Container do Card com efeito de expansão apenas em desktop (lg:) */}
      <div 
        className={`
          relative aspect-[2/3] sm:aspect-[3/4] overflow-hidden rounded-xl 
          border border-white/5 transition-all duration-300 
          ${isAdult ? 'capa-masked' : ''}
        `}
        style={{
          transformOrigin: 'center center',
        }}
      >
        {/* Overlay escuro para conteúdo adulto */}
        {isAdult && (
          <div className="absolute inset-0 bg-black/30 z-[5] pointer-events-none adult-overlay" />
        )}
        
        {/* Imagem do Poster - visível quando não há trailer */}
        <div 
          className={`
            absolute inset-0 transition-opacity duration-500
            ${showTrailer ? 'opacity-0' : 'opacity-100'}
          `}
        >
          <img
            src={validPoster}
            alt={title}
            className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${isAdult ? 'adult-poster' : ''}`}
            loading="lazy"
            onError={(e) => {
              console.log('❌ Erro ao carregar poster:', poster);
              console.log('🎭 Item:', { id, title, poster, type });
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/fallback-${id || title}/300/450.jpg`;
            }}
          />
        </div>

        {/* Trailer Embed - visível apenas no hover em desktop */}
        {hasTrailer && (
          <div 
            className={`
              absolute inset-0 transition-opacity duration-500
              ${showTrailer ? 'opacity-100 z-10' : 'opacity-0 z-0'}
              hidden lg:block /* Apenas desktop */
            `}
          >
            {showTrailer && (
              <iframe
                src={processedTrailerUrl}
                className="w-full h-full object-cover"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
                title={`${title} - Trailer`}
                frameBorder="0"
                loading="eager"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  inset: 0,
                }}
              />
            )}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default PremiumCard;
