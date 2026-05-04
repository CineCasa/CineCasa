import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { tmdbImageUrl } from '@/services/tmdb';

interface Film {
  id: string;
  titulo: string;
  poster: string;
  year: string;
  rating: string;
  genre?: string;
}

interface CategoryFilmsProps {
  films: Film[];
  category: string;
}

const CategoryFilms: React.FC<CategoryFilmsProps> = ({ films, category }) => {
  if (!films || films.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nenhum filme encontrado na categoria {category}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {films.map((film) => (
        <Link
          key={film.id}
          to={`/details/movie/${film.id}`}
          className="group"
        >
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
            {film.poster ? (
              <img
                src={tmdbImageUrl(film.poster, 'w500')}
                alt={film.titulo}
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
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              {film.rating || 'N/A'}
            </div>
          </div>
          <p className="mt-2 text-sm font-medium truncate">{film.titulo}</p>
          <p className="text-xs text-gray-400">{film.year}</p>
        </Link>
      ))}
    </div>
  );
};

export default CategoryFilms;
