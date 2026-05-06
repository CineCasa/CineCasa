import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock } from 'lucide-react';
import { tmdbImageUrl } from '@/services/tmdb';

interface ContinueWatchingItem {
  id: string;
  contentId?: string;
  title: string;
  poster: string;
  banner?: string;
  backdrop?: string;
  type: 'movie' | 'series';
  progress: number;
  duration?: number;
  updatedAt?: string;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

interface ContinueWatchingProps {
  items: ContinueWatchingItem[];
  onRemove?: (id: string, type: string, episodeId?: string) => void;
}

const ContinueWatching: React.FC<ContinueWatchingProps> = ({ items, onRemove }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return null;
  }

  // Limitar a 5 itens
  const displayItems = items.slice(0, 5);

  // Bug #2 corrigido: navega para a página de detalhes em vez de /watch/ inexistente
  const handlePlay = (item: ContinueWatchingItem) => {
    const routeType = item.type === 'movie' ? 'cinema' : 'series';
    const id = item.contentId || item.id;
    navigate(`/details/${routeType}/${id}`);
  };

  const getPosterUrl = (poster: string) => {
    if (!poster) return '/placeholder-movie.jpg';
    if (poster.startsWith('http')) return poster;
    return tmdbImageUrl(poster, 'w342');
  };

  return (
    <div className="px-4 md:px-8 mb-6">
      <h2 className="text-lg md:text-xl font-semibold text-white mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#00d9ff]" />
        Continuar Assistindo
      </h2>
      <div className="grid grid-cols-5 gap-4">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="group cursor-pointer"
            onClick={() => handlePlay(item)}
          >
            {/* Poster */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
              {item.poster ? (
                <img
                  src={getPosterUrl(item.poster)}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                </div>
              </div>

              {/* Barra de progresso */}
              {item.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/80">
                  <div
                    className="h-full bg-[#00d9ff] transition-all duration-300"
                    style={{ width: `${Math.min(item.progress, 100)}%` }}
                  />
                </div>
              )}

              {/* Badge episódio */}
              {item.type === 'series' && item.episodeNumber && (
                <div className="absolute top-2 left-2 z-20">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-black/70 text-white">
                    T{item.seasonNumber || 1} E{item.episodeNumber}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs md:text-sm text-white font-medium line-clamp-2 leading-tight">
              {item.title}
            </p>
            {item.progress > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{Math.round(item.progress)}% assistido</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContinueWatching;
