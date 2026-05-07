import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { tmdbImageUrl } from '@/services/tmdb';

interface LazyCardProps {
  id: string;
  title: string;
  poster: string;
  year?: string;
  rating?: string;
  type: 'movie' | 'series';
  index?: number;
  onClick?: () => void;
}

const LazyCard: React.FC<LazyCardProps> = ({ 
  id, 
  title, 
  poster, 
  type,
  onClick
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Mapear tipo para a rota correta (cinema para filmes, series para séries)
  const routeType = type === 'movie' ? 'cinema' : 'series';
  
  return (
    <Link
      to={`/details/${routeType}/${id}`}
      className="block w-full group"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 shadow-2xl shadow-black/60 group-hover:shadow-3xl group-hover:shadow-black/80 transition-all duration-300 group-hover:scale-105">
        {poster ? (
          <>
            {/* Loading placeholder */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center z-10">
                <div className="w-8 h-8 border-2 border-gray-500 border-t-[#00d9ff] rounded-full animate-spin"></div>
              </div>
            )}
            <img
              src={poster.startsWith('http') ? poster : tmdbImageUrl(poster, 'w500')}
              alt={title}
              className={`w-full h-full object-cover transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setIsLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>
    </Link>
  );
};

export default LazyCard;
