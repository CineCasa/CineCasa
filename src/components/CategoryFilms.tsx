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
          </div>
        </Link>
      ))}
    </div>
  );
};

export default CategoryFilms;
