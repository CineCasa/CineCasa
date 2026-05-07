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
    <nav
      className="fixed bottom-0 left-0 right-0 md:hidden z-[100]"
      style={{
        fontFamily: 'Inter, sans-serif',
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'fixed',
        top: 'auto',
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 217, 255, 0.2)',
        boxShadow: '0 -4px 20px rgba(0, 217, 255, 0.1)',
      }}
    >
      <div
        className="mx-4 mb-4 rounded-3xl"
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 217, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 217, 255, 0.2), 0 0 0 1px rgba(0, 217, 255, 0.1)',
        }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map(({ icon: Icon, path, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-out"
                style={{
                  color: isActive ? '#00D9FF' : 'rgba(255, 255, 255, 0.6)',
                  fontWeight: isActive ? '600' : '400',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  textShadow: isActive ? '0 0 20px rgba(0, 217, 255, 0.8)' : 'none',
                }}
              >
                <div
                  className="relative"
                  style={{
                    filter: isActive ? `drop-shadow(0 0 8px rgba(0, 217, 255, 0.8))` : 'none',
                  }}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] mt-1 leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
