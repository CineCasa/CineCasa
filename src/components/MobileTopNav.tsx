import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart, Clock, Monitor, User } from 'lucide-react';

export default function MobileTopNav() {
  const navigate = useNavigate();

  return (
    <nav
      className="fixed top-0 left-0 right-0 md:hidden z-[100]"
      style={{
        fontFamily: 'Inter, sans-serif',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'fixed',
        bottom: 'auto',
      }}
    >
      <div
        className="flex items-center justify-between px-4 h-14"
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 217, 255, 0.05)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 transition-transform duration-300 active:scale-95"
        >
          <img
            src="/logo.png"
            alt="CineCasa"
            className="h-8 w-auto"
          />
        </button>

        {/* Ícones de navegação */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/search')}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out active:scale-90"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--brand)';
              e.currentTarget.style.background = 'var(--brand-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Pesquisar"
          >
            <Search className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/favorites')}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out active:scale-90"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--brand)';
              e.currentTarget.style.background = 'var(--brand-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Favoritos"
          >
            <Heart className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/watchlist')}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out active:scale-90"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--brand)';
              e.currentTarget.style.background = 'var(--brand-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Ver depois"
          >
            <Clock className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/cinema-mode')}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out active:scale-90"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--brand)';
              e.currentTarget.style.background = 'var(--brand-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Modo cinema"
          >
            <Monitor className="w-5 h-5" strokeWidth={2} />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ease-out active:scale-90"
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--brand)';
              e.currentTarget.style.background = 'var(--brand-soft)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Perfil"
          >
            <User className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </nav>
  );
}
