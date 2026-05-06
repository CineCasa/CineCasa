import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, List, Film, User } from 'lucide-react';

export default function MobileTopNav() {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-b border-white/10 md:hidden z-[100]">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <img 
            src="/logo.png" 
            alt="CineCasa" 
            className="h-8 w-auto"
          />
        </button>

        {/* Ícones de navegação */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/search')}
            className="text-white hover:text-[#00d9ff] transition-colors"
            aria-label="Pesquisar"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/favorites')}
            className="text-white hover:text-[#00d9ff] transition-colors"
            aria-label="Favoritos"
          >
            <Heart className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="text-white hover:text-[#00d9ff] transition-colors"
            aria-label="Assistir depois"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/cinema-mode')}
            className="text-white hover:text-[#00d9ff] transition-colors"
            aria-label="Modo cinema"
          >
            <Film className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="text-white hover:text-[#00d9ff] transition-colors"
            aria-label="Perfil"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
