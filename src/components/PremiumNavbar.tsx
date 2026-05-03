import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Heart, Search, User } from 'lucide-react';

export default function PremiumNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'Início' },
    { icon: Film, path: '/filmes', label: 'Filmes' },
    { icon: Tv, path: '/series', label: 'Séries' },
    { icon: Heart, path: '/favorites', label: 'Favoritos' },
    { icon: Search, path: '/search', label: 'Pesquisa' },
    { icon: User, path: '/profile', label: 'Perfil' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-b border-white/10 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/')}
            className="text-xl font-bold text-[#E53935]"
          >
            CineCasa
          </button>
          <div className="flex items-center gap-6">
            {navItems.map(({ icon: Icon, path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-2 transition-colors ${
                  isActive(path) ? 'text-[#E53935]' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
