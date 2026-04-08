import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import StreamingCard from './StreamingCard';

interface StreamingRowProps {
  title: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
    rating?: number;
    year?: number;
    duration?: string;
    quality?: string;
  }>;
  onPlay?: (item: any) => void;
  onAddToList?: (item: any) => void;
  onMoreInfo?: (item: any) => void;
}

const StreamingRow: React.FC<StreamingRowProps> = ({
  title,
  items,
  onPlay,
  onAddToList,
  onMoreInfo
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const containerRef = React.useRef<HTMLDivElement>(null);

  const checkScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      setScrollPosition(scrollLeft);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300;
      const newScrollPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      
      containerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  React.useEffect(() => {
    checkScrollButtons();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, []);

  return (
    <div className="mb-12">
      {/* Row Title */}
      <div className="flex items-center justify-between mb-6 px-4 md:px-8">
        <motion.h2 
          className="text-2xl md:text-3xl font-bold text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {title}
        </motion.h2>
        
        {/* Navigation Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${
              canScrollLeft 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={canScrollLeft ? { scale: 1.1 } : {}}
            whileTap={canScrollLeft ? { scale: 0.9 } : {}}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          
          <motion.button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${
              canScrollRight 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={canScrollRight ? { scale: 1.1 } : {}}
            whileTap={canScrollRight ? { scale: 0.9 } : {}}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Cards Container */}
      <div className="relative">
        <motion.div
          ref={containerRef}
          className="streaming-carousel px-4 md:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex-shrink-0 w-64 md:w-72 lg:w-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: 0.1 * index,
                ease: "easeOut"
              }}
            >
              <StreamingCard
                title={item.title}
                description={item.description}
                image={item.image}
                rating={item.rating}
                year={item.year}
                duration={item.duration}
                quality={item.quality}
                onPlay={() => onPlay?.(item)}
                onAddToList={() => onAddToList?.(item)}
                onMoreInfo={() => onMoreInfo?.(item)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-r from-black/80 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-12 bg-gradient-to-l from-black/80 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
};

export default StreamingRow;
