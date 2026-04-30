import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PremiumCard from './PremiumCard';

interface LazyCardProps {
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
  isAdult?: boolean;
  trailer?: string;
  onClick?: () => void;
  index: number;
}

const LazyCard: React.FC<LazyCardProps> = (props) => {
  const { index, ...cardProps } = props;
  const [isVisible, setIsVisible] = useState(true); // Mostrar imediatamente
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className="carousel-item"
      initial={{ opacity: 1, y: 0 }}
      animate={{ 
        opacity: 1, 
        y: 0 
      }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05 
      }}
    >
      <div 
        className="w-[calc(50vw-12px)] sm:w-40 md:w-48 lg:w-56 xl:w-64 2xl:w-72"
        data-navigable="true"
        data-nav-index={index}
      >
        <div className="lazy-card-content">
          <PremiumCard
            id={cardProps.id}
            title={cardProps.title}
            poster={cardProps.poster}
            type={cardProps.type}
            progress={cardProps.progress}
            year={cardProps.year}
            rating={cardProps.rating}
            isNew={cardProps.isNew}
            isComingSoon={cardProps.isComingSoon}
            isAdult={cardProps.isAdult}
            trailer={cardProps.trailer}
            onClick={cardProps.onClick}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LazyCard;
