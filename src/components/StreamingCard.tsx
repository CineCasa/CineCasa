import React from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, ThumbsUp, Volume2, Info } from 'lucide-react';

interface StreamingCardProps {
  title: string;
  description: string;
  image: string;
  rating?: number;
  year?: number;
  duration?: string;
  quality?: string;
  onPlay?: () => void;
  onAddToList?: () => void;
  onMoreInfo?: () => void;
  className?: string;
}

const StreamingCard: React.FC<StreamingCardProps> = ({
  title,
  description,
  image,
  rating,
  year,
  duration,
  quality,
  onPlay,
  onAddToList,
  onMoreInfo,
  className = ''
}) => {
  return (
    <motion.div
      className={`streaming-card group cursor-pointer ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
    >
      {/* Card Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quality Badge */}
        {quality && (
          <div className="absolute top-2 right-2 streaming-badge">
            {quality}
          </div>
        )}
        
        {/* Play Button Overlay */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ scale: 0.8 }}
          whileHover={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.button
            onClick={onPlay}
            className="w-16 h-16 rounded-full bg-netflix-red/90 hover:bg-netflix-red flex items-center justify-center transition-colors duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </motion.button>
        </motion.div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-white font-semibold text-sm sm:text-base md:text-lg lg:text-xl line-clamp-2 group-hover:text-netflix-red transition-colors duration-200">
          {title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
          {year && <span>{year}</span>}
          {duration && <span>{duration}</span>}
          {rating && (
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{rating}%</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-3 mb-4 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default StreamingCard;
