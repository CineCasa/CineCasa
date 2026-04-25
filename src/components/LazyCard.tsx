import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PremiumCard from './PremiumCard';

interface LazyCardProps {
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
  index: number;
}

const LazyCard: React.FC<LazyCardProps> = (props) => {
  const { index, ...cardProps } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
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
        rootMargin: '100px', // Preload antes de entrar na tela
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0.3, 
        y: isVisible ? 0 : 20 
      }}
      transition={{ 
        duration: 0.5, 
        delay: isVisible ? index * 0.1 : 0 
      }}
    >
      <div className="w-[calc(50vw-12px)] sm:w-40 md:w-48 lg:w-56 xl:w-64 2xl:w-72">
        {isVisible ? (
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
              trailer={cardProps.trailer}
              onClick={cardProps.onClick}
            />
          </div>
        ) : (
          // Placeholder enquanto não está visível
          <div className="relative aspect-[2/3] rounded-xl bg-white/5 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LazyCard;
