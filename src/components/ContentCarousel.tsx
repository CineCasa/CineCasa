import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import PremiumCard from './PremiumCard';
import LazyCard from './LazyCard';

interface ContentItem {
  id: string;
  tmdbId?: string;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  progress?: number;
  year?: string;
  rating?: string;
  isNew?: boolean;
  isComingSoon?: boolean;
}

interface ContentCarouselProps {
  title: string;
  items: ContentItem[];
  onCardClick?: (item: ContentItem) => void;
  isLoading?: boolean;
}

const ContentCarousel: React.FC<ContentCarouselProps> = ({
  title,
  items,
  onCardClick,
  isLoading = false
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-12">
      {/* Título da seção acima das capas */}
      <div className="flex items-center justify-between mb-6 px-4 sm:px-4 md:px-6">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white text-left max-w-4xl section-title font-titles">
          {title}
        </h2>
      </div>

      {/* Container do Carrossel */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="carousel-container px-2 sm:px-4 md:px-6"
        >
          {items.map((item, index) => {
            // Garantir que sempre tenha uma key válida
            const safeId = item.id || item.tmdbId || `${item.title}-${index}`;
            return (
              <LazyCard
                key={safeId}
                {...item}
                id={safeId}
                index={index}
                onClick={() => onCardClick?.(item)}
              />
            );
          })}

          {/* Cards Vazios para "Em Breve" - apenas se não houver itens e não estiver carregando */}
          {items.length === 0 && !isLoading && (
            <div className="flex items-center justify-center w-full py-8">
              <p className="text-white/60 text-center">Nenhum conteúdo encontrado</p>
            </div>
          )}

          {/* Estado de carregamento */}
          {isLoading && (
            <div className="flex items-center justify-center w-full py-8">
              <div className="w-8 h-8 border-2 border-[#00A8E1] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCarousel;
