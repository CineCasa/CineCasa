import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MOVIE_CATEGORIES } from '@/data/movieCategories';
import { ChevronRight } from 'lucide-react';

interface MenuFilmesProps {
  className?: string;
}

export const MenuFilmes: React.FC<MenuFilmesProps> = ({ className = '' }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className={`bg-black/95 border-b border-gray-800 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          <span className="text-gray-400 text-sm font-medium whitespace-nowrap mr-2 flex items-center">
            <ChevronRight className="w-4 h-4" />
            Filmes
          </span>
          
          {MOVIE_CATEGORIES.map((category) => {
            const isActive = currentPath === `/filmes/${category.slug}`;
            
            return (
              <Link
                key={category.id}
                to={`/filmes/${category.slug}`}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MenuFilmes;
