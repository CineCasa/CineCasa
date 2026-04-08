import React from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Clock } from 'lucide-react';

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
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      data-navigable={dataNavigable}
      data-nav-row={dataNavRow}
      data-nav-col={dataNavCol}
    >
      <div className="relative aspect-[2/3] sm:aspect-[3/4] overflow-hidden rounded-lg">
        {/* Imagem do Poster */}
        <img
          src={poster || `https://picsum.photos/seed/${id || title || 'default'}/300/450.jpg`}
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

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Tags */}
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

        {/* Barra de Progresso */}
        {progress > 0 && !isComingSoon && (
          <div 
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
    </motion.div>
  );
};

export default PremiumCard;
