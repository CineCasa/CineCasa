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
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BecauseYouWatchedRow;
