import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ThumbsUp } from 'lucide-react';
import { tmdbImageUrl } from '@/services/tmdb';

interface BecauseYouWatchedItem {
  id: string;
  title: string;
  poster: string;
  year: string;
  rating: string;
  type: 'movie' | 'series';
  reason: string;
}

interface BecauseYouWatchedRowProps {
  genre: string;
  items: BecauseYouWatchedItem[];
}

export const BecauseYouWatchedRow: React.FC<BecauseYouWatchedRowProps> = ({ genre, items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ThumbsUp className="w-5 h-5" />
        Porque você assistiu {genre}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/details/${item.type}/${item.id}`}
            className="flex-shrink-0 w-40 group"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
              </div>
              <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                {item.rating}
              </div>
            </div>
            <p className="mt-2 text-sm font-medium truncate">{item.title}</p>
            <p className="text-xs text-gray-400">{item.year}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BecauseYouWatchedRow;
