import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from './ContentCard';
import ContinueWatchingCard from './ContinueWatchingCard';
import HomeContentCard from './HomeContentCard';
import { ContentItem } from '@/data/content';

interface HomeSectionProps {
  title: string;
  items: ContentItem[];
  type: 'continue-watching' | 'releases' | 'personalized' | 'finance' | 'blackness' | 'romance' | 'trending' | 'kids' | 'top5' | 'oscar' | 'relaxing';
  onPlay: (item: ContentItem) => void;
  onAddToList: (item: ContentItem) => void;
  onMoreInfo: (item: ContentItem) => void;
}

const HomeSection: React.FC<HomeSectionProps> = ({
  title,
  items,
  type,
  onPlay,
  onAddToList,
  onMoreInfo
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // Simular progresso para continuar assistindo
  const getProgress = (item: ContentItem) => {
    if (type === 'continue-watching') {
      // Simular progresso aleatório entre 10-90%
      return Math.floor(Math.random() * 80) + 10;
    }
    return 0;
  };

  // Adicionar adesivo "Em breve" para conteúdo não disponível
  const getComingSoonBadge = (item: ContentItem) => {
    if (!item.url && !item.trailer) {
      return (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-10">
          Em Breve
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-8 md:mb-12">
      {/* Mobile: Título separado das capas */}
      <div className="flex items-center justify-between mb-6 md:mb-4 px-4 md:px-0">
        <h2 className="text-lg md:text-[30px] font-bold text-white">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex-shrink-0"
          >
            {type === 'continue-watching' ? (
              <div className="relative">
                {getComingSoonBadge(item)}
                <ContinueWatchingCard
                  item={item}
                  progress={getProgress(item)}
                  onPlay={() => onPlay(item)}
                  onAddToList={() => onAddToList(item)}
                  onMoreInfo={() => onMoreInfo(item)}
                />
              </div>
            ) : (
              <div className="relative">
                {getComingSoonBadge(item)}
                <HomeContentCard
                  content={item}
                  onPlay={() => onPlay(item)}
                  onAddToList={() => onAddToList(item)}
                  onMoreInfo={() => onMoreInfo(item)}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HomeSection;
