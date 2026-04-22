import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Home, PlaySquare, Monitor, Film, LogOut, Heart, Bell, Users, MonitorPlay } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from "@/hooks/useNotifications";
import { useCinemaMode } from "@/hooks/useCinemaMode";
interface PremiumNavbarProps {
  onSearch?: (query: string) => void;
  user?: any;
}

const PremiumNavbar: React.FC<PremiumNavbarProps> = ({ onSearch, user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { permission } = useNotifications();
  const { isCinemaMode, toggleCinemaMode } = useCinemaMode();

  const criarSalaWatchParty = () => {
    const roomId = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
    const url = `/watch.html?room=${roomId}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fechar dropdown ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!isProfileOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    // Usar setTimeout para evitar que o clique que abriu o dropdown também o feche
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isProfileOpen]);

  const navItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Film, label: 'Filmes', href: '/filmes-categorias' },
    { icon: PlaySquare, label: 'Séries', href: '/series-categorias' },
    { icon: Heart, label: 'Favoritos', href: '/favorites' },
  ];

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-[110] transition-all duration-300 backdrop-blur-md bg-black/40 ${
          isScrolled ? 'py-0' : 'py-0'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
          {/* Logo e Slogan */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col leading-none">
              <h1 className="text-xl font-bold text-primary tracking-wider font-titles leading-none m-0 p-0">
                CINECASA
              </h1>
              <p className="text-[10px] md:text-[14px] text-secondary tracking-normal font-body leading-none m-0 p-0 -mt-0.5 whitespace-nowrap">
                Entretenimento e Lazer
              </p>
            </div>
          </div>

          {/* Navegação Central */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.href)}
                className={`flex items-center space-x-2 transition-all duration-300 hover:text-[#00A8E1] ${
                  location.pathname === item.href ? 'text-[#00A8E1]' : 'text-secondary'
                }`}
              >
                <item.icon size={18} />
                <span className="font-medium font-buttons">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Direita - Pesquisa e Perfil */}
          <div className="flex items-center space-x-4">
            {/* Botão de Pesquisa */}
            <button
              onClick={() => navigate('/search')}
              className="p-2 rounded-full hover:bg-white/10 transition-all duration-300 text-secondary hover:text-accent"
              title="Pesquisar"
            >
              <Search size={20} />
            </button>

            {/* Botão de Notificações - Oculto em mobile */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Botão Modo Cinema */}
            <button
              onClick={toggleCinemaMode}
              className={`p-2 rounded-full hover:bg-white/10 transition-all duration-300 ${
                isCinemaMode ? 'text-accent bg-white/10' : 'text-secondary hover:text-accent'
              }`}
              title="Modo Cinema (Tecla C)"
            >
              <MonitorPlay size={20} />
            </button>

            {/* Perfil */}
            <div ref={profileDropdownRef} className="relative flex flex-row items-center space-x-2 profile-dropdown">
              {/* Botão Assistir Juntos */}
              <button
                onClick={criarSalaWatchParty}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-white/10 transition-all duration-300"
                title="Assistir Juntos"
              >
                <Users size={20} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(!isProfileOpen);
                }}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-white/10 transition-all duration-300"
              >
                <User size={20} />
              </button>

              {/* Dropdown Perfil */}
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 glass-navbar rounded-lg border border-white/10 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/10">
                    <p className="text-primary font-medium">Minha Conta</p>
                    <p className="text-secondary text-sm">usuario@cinecasa.com</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center space-x-2 p-2 rounded hover:bg-white/10 transition-all duration-300 text-secondary"
                    >
                      <User size={16} />
                      <span>Perfil</span>
                    </button>
                    <button 
                      onClick={() => navigate('/notifications')}
                      className="w-full flex items-center space-x-2 p-2 rounded hover:bg-white/10 transition-all duration-300 text-secondary"
                    >
                      <Bell size={16} />
                      <span>Notificações</span>
                    </button>
                    <button className="w-full flex items-center space-x-2 p-2 rounded hover:bg-white/10 transition-all duration-300 text-secondary">
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Pesquisa Global */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Atalho de Teclado */}
      <div className="hidden">
        <input
          type="text"
          className="sr-only"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
              e.preventDefault();
              setIsSearchOpen(true);
            }
            if (e.key === 'Escape' && isSearchOpen) {
              setIsSearchOpen(false);
            }
          }}
        />
      </div>
    </>
  );
};

export default PremiumNavbar;
