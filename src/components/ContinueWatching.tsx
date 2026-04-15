import React from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContinueWatchingItem {
  id: string;
  title: string;
  poster: string;
  banner?: string;
  backdrop?: string;
  type: 'movie' | 'series';
  progress: number;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface ContinueWatchingProps {
  items: ContinueWatchingItem[];
  onRemove?: (id: string, type: 'movie' | 'series', episodeId?: string) => void;
}

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({ 
  items, 
  onRemove 
}) => {
  // Limitar a apenas 3 capas
  const limitedItems = items.slice(0, 3);
  
  if (limitedItems.length === 0) return null;

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">
          Continuar Assistindo
        </h2>
        
        <div className="grid grid-cols-3 gap-4 max-w-3xl">
          {limitedItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative"
            >
              <Link 
                to={item.type === 'movie' 
                  ? `/movie/${item.id}` 
                  : `/series/${item.id}${item.episodeId ? `?episode=${item.episodeId}` : ''}`
                }
                className="block aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 relative"
              >
                {/* Banner/Backdrop Image - melhor para widescreen */}
                <img
                  src={item.banner || item.backdrop || item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                
                {/* Progress % Badge - canto superior direito */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">
                  {item.progress}%
                </div>
                
                {/* Progress Bar Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                  <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-white font-medium">
                      {item.progress}% assistido
                    </span>
                    {item.episodeNumber && (
                      <span className="text-xs text-gray-300">
                        E{item.episodeNumber}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Play Icon on Hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
              </Link>
              
              {/* Title and Remove Button */}
              <div className="mt-2 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm text-white font-medium break-words whitespace-normal leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  {item.episodeNumber && (
                    <p className="text-xs text-gray-400">
                      Episódio {item.episodeNumber}
                      {item.seasonNumber && ` • T${item.seasonNumber}`}
                    </p>
                  )}
                </div>
                
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(item.id, item.type, item.episodeId);
                    }}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remover da lista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContinueWatching;
