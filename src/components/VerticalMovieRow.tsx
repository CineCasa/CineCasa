import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface VerticalMovieRowProps {
  title: string;
  items: {
    id: string;
    title: string;
    poster: string;
    year?: string;
    rating?: string;
  }[];
  onCardClick: (item: any) => void;
}

export const VerticalMovieRow: React.FC<VerticalMovieRowProps> = ({ 
  title, 
  items, 
  onCardClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 5 items per page for Smart TV and large screens
  const itemsPerPage = 5;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  // Auto-scroll interval
  useEffect(() => {
    if (items.length <= itemsPerPage) return;
    
    const interval = setInterval(() => {
      if (!isTransitioning) {
        handleNext();
      }
    }, 5000); // Auto-scroll every 5 seconds
    
    return () => clearInterval(interval);
  }, [currentPage, isTransitioning, items.length]);
  
  const handleNext = useCallback(() => {
    if (isTransitioning || items.length <= itemsPerPage) return;
    
    setIsTransitioning(true);
    
    if (currentPage >= totalPages - 1) {
      // At last page, jump back to first instantly (loop behavior)
      setCurrentPage(0);
    } else {
      setCurrentPage(prev => prev + 1);
    }
    
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentPage, isTransitioning, totalPages, items.length, itemsPerPage]);
  
  const handlePrev = useCallback(() => {
    if (isTransitioning || items.length <= itemsPerPage) return;
    
    setIsTransitioning(true);
    setCurrentPage(prev => (prev > 0 ? prev - 1 : totalPages - 1));
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, totalPages, items.length, itemsPerPage]);
  
  // Keyboard navigation - only left arrow for Smart TV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleNext(); // Left scroll only
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);
  
  if (items.length === 0) return null;
  
  const visibleItems = items.slice(
    currentPage * itemsPerPage, 
    (currentPage + 1) * itemsPerPage
  );
  
  return (
    <div className="mb-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4 px-4 lg:px-8">
        <h2 className="text-xl lg:text-2xl font-bold text-white">{title}</h2>
        {items.length > itemsPerPage && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{currentPage + 1} / {totalPages}</span>
          </div>
        )}
      </div>
      
      {/* Movie Row Container */}
      <div 
        ref={containerRef}
        className="relative px-4 lg:px-8"
      >
        {/* Navigation Button - Left Only */}
        {items.length > itemsPerPage && (
          <button
            onClick={handleNext}
            className="absolute -left-2 lg:left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-all hover:scale-110"
            aria-label="Próximos filmes"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {/* Movies Grid - 5 items per row on large screens */}
        <div className="overflow-hidden">
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {visibleItems.map((item, index) => (
              <motion.div
                key={`${item.id}-${currentPage}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => onCardClick(item)}
              >
                {/* Poster Image */}
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <h3 className="text-white font-semibold text-sm truncate">{item.title}</h3>
                  {item.year && (
                    <span className="text-gray-300 text-xs">{item.year}</span>
                  )}
                </div>
                
                {/* Rating Badge */}
                {item.rating && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    {item.rating}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VerticalMovieRow;
