import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Bell } from 'lucide-react';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Film, path: '/filmes', label: 'Filmes' },
    { icon: Tv, path: '/series', label: 'Séries' },
    { icon: Bell, path: '/notifications', label: 'Notificações' },
  ];

  return (
    <nav className="fixed bottom-4 left-4 right-4 bg-black/90 backdrop-blur-lg border border-white/20 rounded-2xl md:hidden z-50 shadow-2xl">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ icon: Icon, path, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 rounded-xl ${
              location.pathname === path
                ? 'text-[#00d9ff] bg-white/10 scale-110'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
