import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Heart, Search, User } from 'lucide-react';

/**
 * TVNavbar - Componente de navegação otimizado para Smart TVs e Projetores
 * 
 * Características:
 * - Fonte escalada para visibilidade a 3 metros (padrão TV)
 * - Suporte a navegação por teclado/controle remoto
 * - Efeito neon ciano no menu ativo (cor do logo)
 * - Design "serigrafado" com fonte Montserrat bold
 * - Sticky em todas as páginas
 * - Responsivo para telas 1024px+
 */

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  label: string;
}

const navItems: NavItem[] = [
  { icon: Home, path: '/', label: 'Início' },
  { icon: Film, path: '/filmes', label: 'Filmes' },
  { icon: Tv, path: '/series', label: 'Séries' },
  { icon: Heart, path: '/favorites', label: 'Favoritos' },
  { icon: Search, path: '/search', label: 'Pesquisa' },
  { icon: User, path: '/profile', label: 'Perfil' },
];

export default function TVNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Determina qual item está ativo baseado na rota atual
  const isActive = useCallback((path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  }, [location.pathname]);

  // Encontra o índice do item ativo
  const getActiveIndex = useCallback((): number => {
    return navItems.findIndex(item => isActive(item.path));
  }, [isActive]);

  // Inicializa o foco no item ativo quando a página carrega
  useEffect(() => {
    const activeIdx = getActiveIndex();
    if (activeIdx !== -1) {
      setFocusedIndex(activeIdx);
    }
  }, [getActiveIndex, location.pathname]);

  // Navegação por teclado para controle remoto/TV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Só processa se a navbar estiver visível (telas > 1024px)
      if (window.innerWidth < 1024) return;

      const currentIndex = focusedIndex !== -1 ? focusedIndex : getActiveIndex();
      
      switch (e.key) {
        case 'ArrowRight':
        case 'Right':
          e.preventDefault();
          const nextIndex = currentIndex < navItems.length - 1 ? currentIndex + 1 : 0;
          setFocusedIndex(nextIndex);
          break;
        case 'ArrowLeft':
        case 'Left':
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : navItems.length - 1;
          setFocusedIndex(prevIndex);
          break;
        case 'Enter':
        case ' ':
          if (currentIndex !== -1) {
            e.preventDefault();
            navigate(navItems[currentIndex].path);
          }
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          navigate('/');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, getActiveIndex, navigate]);

  // Foca o elemento quando o índice muda
  useEffect(() => {
    if (focusedIndex !== -1 && navRef.current) {
      const buttons = navRef.current.querySelectorAll('.tv-nav-item');
      if (buttons[focusedIndex]) {
        (buttons[focusedIndex] as HTMLButtonElement).focus();
      }
    }
  }, [focusedIndex]);

  const handleNavClick = (path: string, index: number) => {
    setFocusedIndex(index);
    navigate(path);
  };

  return (
    <nav 
      ref={navRef}
      data-nav-region="navbar"
      className="tv-navbar-cinecasa"
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div className="tv-navbar-logo-container">
        <button 
          onClick={() => navigate('/')}
          className="tv-navbar-logo"
          data-navigable="true"
          aria-label="Ir para página inicial"
        >
          <img 
            src="/logo.png" 
            alt="CineCasa" 
            className="tv-navbar-logo-img"
          />
          <span className="tv-navbar-logo-text">CineCasa</span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="tv-navbar-menu" role="menubar">
        {navItems.map(({ icon: Icon, path, label }, index) => {
          const active = isActive(path);
          const isFocused = focusedIndex === index;
          
          return (
            <button
              key={path}
              onClick={() => handleNavClick(path, index)}
              className={`tv-nav-item ${active ? 'active' : ''} ${isFocused ? 'spatial-focus' : ''}`}
              data-navigable="true"
              role="menuitem"
              aria-current={active ? 'page' : undefined}
              tabIndex={isFocused ? 0 : -1}
            >
              <Icon className="tv-nav-icon" />
              <span className="tv-nav-label">{label}</span>
              {active && <span className="tv-nav-indicator" />}
            </button>
          );
        })}
      </div>

      {/* Espaçador para alinhamento */}
      <div className="tv-navbar-spacer" />
    </nav>
  );
}
