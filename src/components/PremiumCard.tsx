import React from 'react';
import { motion } from 'framer-motion';

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
  onClick?: () => void;
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
  onClick,
  'data-navigable': dataNavigable,
  'data-nav-row': dataNavRow,
  'data-nav-col': dataNavCol,
  tabIndex
}) => {
  // Validar poster URL
  const validPoster = isValidPosterUrl(poster) ? poster : `https://picsum.photos/seed/${id || title || 'default'}/300/450.jpg`;
  
  return (
    <motion.div
      className="premium-card cursor-pointer group w-full"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={tabIndex ?? 0}
      role="button"
      aria-label={`Ver detalhes de ${title}`}
      whileHover={{ y: -4, scale: 1.05 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      data-navigable={dataNavigable}
      data-nav-row={dataNavRow}
      data-nav-col={dataNavCol}
    >
      <div className="relative aspect-[2/3] sm:aspect-[3/4] overflow-hidden rounded-xl border border-white/5 transition-all duration-300 group-hover:border-[#00E5FF]/50 group-hover:shadow-[0_0_25px_rgba(0,229,255,0.3)]">
        {/* Imagem do Poster */}
        <img
          src={validPoster}
          alt={title}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            console.log('❌ Erro ao carregar poster:', poster);
            console.log('🎭 Item:', { id, title, poster, type });
            // Fallback para uma imagem estática
            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/fallback-${id || title}/300/450.jpg`;
          }}
        />

        {/* Tags - sempre visíveis, não apenas no hover */}
        {isNew && !isComingSoon && (
          <div className="content-tag">
            {year || 'NOVO'}
          </div>
        )}

        {isComingSoon && (
          <div className="coming-soon-tag">
            EM BREVE
          </div>
        )}

        {/* Barra de Progresso Neon */}
        {progress > 0 && !isComingSoon && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-[#00E5FF] transition-all duration-500"
              style={{ 
                width: `${progress}%`,
                boxShadow: '0 0 10px rgba(0, 229, 255, 0.8), 0 0 20px rgba(0, 229, 255, 0.4)'
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PremiumCard;
