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
      whileHover={{ y: -4, scale: 1.05 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      data-navigable={dataNavigable}
      data-nav-row={dataNavRow}
      data-nav-col={dataNavCol}
    >
      <div className="relative aspect-[2/3] sm:aspect-[3/4] overflow-hidden rounded-xl border border-white/5 transition-all duration-300 group-hover:border-[#00E5FF]/50 group-hover:shadow-[0_0_25px_rgba(0,229,255,0.3)]">
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

        {/* Botão Info/Mais - Estilo Glassmorphism */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/30 rounded-lg text-white text-sm font-medium hover:bg-white/20 hover:border-[#00E5FF]/50 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all duration-300 transform hover:scale-105"
          >
            Info/Mais
          </button>
        </div>

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
