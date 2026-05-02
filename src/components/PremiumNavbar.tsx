import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Film, Tv, Compass, User } from 'lucide-react';

export default function PremiumNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Film, path: '/movies', label: 'Filmes' },
    { icon: Tv, path: '/series', label: 'Séries' },
    { icon: Compass, path: '/explore', label: 'Explorar' },
    { icon: User, path: '/profile', label: 'Perfil' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-b border-white/10 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/')}
            className="text-xl font-bold text-cyan-400"
          >
            CineCasa
          </button>
          <div className="flex items-center gap-6">
            {navItems.map(({ icon: Icon, path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex items-center gap-2 ${
                  location.pathname === path ? 'text-cyan-400' : 'text-gray-300 hover:text-white'
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
