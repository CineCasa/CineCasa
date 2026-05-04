import React from 'react';
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
}

const LazyCard: React.FC<LazyCardProps> = ({ 
  id, 
  title, 
  poster, 
  year, 
  rating,
  type 
}) => {
  return (
    <Link
      to={`/details/${id}?type=${type}`}
      className="flex-shrink-0 w-[calc(20%-0.8rem)] min-w-[160px] max-w-[220px] group"
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
        {poster ? (
          <img
            src={poster.startsWith('http') ? poster : tmdbImageUrl(poster, 'w500')}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
        {rating && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
            {rating}
          </div>
        )}
      </div>
      <p className="mt-2 text-sm font-medium truncate text-white">{title}</p>
      {year && <p className="text-xs text-gray-400">{year}</p>}
    </Link>
  );
};

export default LazyCard;
