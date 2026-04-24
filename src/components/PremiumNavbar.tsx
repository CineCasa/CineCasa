import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, User, Home, PlaySquare, Film, LogOut, Heart, Bell, Users, MonitorPlay, X, Mic, MicOff,
  Menu, Clapperboard, Sparkles, Tv
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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
    { icon: Film, label: 'Filmes', href: '/cinema' },
    { icon: Tv, label: 'Séries', href: '/series' },
    { icon: Sparkles, label: 'Favoritos', href: '/favorites' },
  ];

  // Focar input quando abrir pesquisa
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handler de submit da pesquisa
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Configurar reconhecimento de voz
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition ||
                             (window as any).SpeechRecognition ||
                             (window as any).mozSpeechRecognition ||
                             (window as any).msSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
        // Auto-submit após receber voz
        setTimeout(() => {
          if (transcript.trim()) {
            navigate(`/search?q=${encodeURIComponent(transcript.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
          }
        }, 500);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [navigate]);

  // Toggle reconhecimento de voz
  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Seu navegador não suporta pesquisa por voz. Use Chrome ou Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Erro ao iniciar reconhecimento:', err);
      }
    }
  };

  // Fechar pesquisa ao pressionar ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isSearchOpen, isMobileMenuOpen]);

  // Fechar menu mobile ao clicar fora
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-[110] transition-all duration-500 ease-out"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          backgroundColor: isScrolled ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)',
          borderBottom: '1px solid transparent',
          borderImage: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent) 1',
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16">
          {/* Logo e Slogan - Com Glow Effect */}
          <div className="flex items-center flex-shrink-0">
            <button 
              onClick={() => navigate('/')}
              className="flex flex-col leading-none group"
            >
              <h1 
                className="text-lg sm:text-xl font-black tracking-[0.2em] text-white leading-none transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                style={{
                  textShadow: '0 0 20px rgba(255,255,255,0.3), 0 0 40px rgba(0,229,255,0.1)',
                }}
              >
                CINECASA
              </h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400 tracking-[0.15em] font-light leading-none mt-0.5 uppercase">
                Entretenimento e Lazer
              </p>
            </button>
          </div>

          {/* Navegação Central - Estilo Neon */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <button
                  key={index}
                  onClick={() => navigate(item.href)}
                  className="relative group px-4 py-2"
                >
                  <div className={`flex items-center space-x-2 transition-all duration-300 ${
                    isActive ? 'text-[#00E5FF]' : 'text-gray-400'
                  }`}>
                    <item.icon 
                      size={18} 
                      className={`transition-all duration-300 ${
                        isActive 
                          ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' 
                          : 'group-hover:drop-shadow-[0_0_6px_rgba(0,229,255,0.5)] group-hover:text-[#00E5FF]'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`font-medium text-sm tracking-wide transition-all duration-300 ${
                      isActive 
                        ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' 
                        : 'group-hover:text-[#00E5FF] group-hover:drop-shadow-[0_0_4px_rgba(0,229,255,0.4)]'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  {/* Barra ativa neon */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent"
                      style={{ boxShadow: '0 0 10px #00E5FF, 0 0 20px #00E5FF' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  {/* Hover indicator */}
                  {!isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#00E5FF] opacity-0 group-hover:opacity-60 group-hover:w-6 transition-all duration-300" 
                      style={{ boxShadow: '0 0 6px #00E5FF' }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Direita - Pesquisa e Perfil - Ícones Padronizados */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Botão de Pesquisa - Estilo Neon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                isSearchOpen 
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                  : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)]'
              }`}
              title={isSearchOpen ? 'Fechar pesquisa' : 'Pesquisar'}
            >
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            {/* Botão de Notificações - Neon Badge */}
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Botão Modo Cinema */}
            <button
              onClick={toggleCinemaMode}
              className={`w-9 h-9 sm:w-10 sm:h-10 hidden sm:flex items-center justify-center rounded-full transition-all duration-300 ${
                isCinemaMode 
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                  : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)]'
              }`}
              title="Modo Cinema"
            >
              <MonitorPlay size={18} />
            </button>

            {/* Assistir Juntos */}
            <button
              onClick={criarSalaWatchParty}
              className="w-9 h-9 sm:w-10 sm:h-10 hidden md:flex items-center justify-center rounded-full text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)] transition-all duration-300"
              title="Assistir Juntos"
            >
              <Users size={18} />
            </button>

            {/* Perfil - Neon */}
            <div ref={profileDropdownRef} className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(!isProfileOpen);
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isProfileOpen 
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                    : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                }`}
              >
                <User size={18} />
              </button>

              {/* Dropdown Perfil - Glassmorphism */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-3 w-52 rounded-xl overflow-hidden z-50"
                    style={{
                      background: 'rgba(15, 23, 30, 0.95)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0, 229, 255, 0.2)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 229, 255, 0.1)',
                    }}
                  >
                    <div className="p-4 border-b border-white/10">
                      <p className="text-white font-medium text-sm">Minha Conta</p>
                      <p className="text-gray-400 text-xs truncate">usuario@cinecasa.com</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-300 hover:text-white text-sm"
                      >
                        <User size={16} className="text-[#00E5FF]" />
                        <span>Perfil</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/notifications');
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-300 hover:text-white text-sm"
                      >
                        <Bell size={16} className="text-[#00E5FF]" />
                        <span>Notificações</span>
                      </button>
                      <button 
                        onClick={() => navigate('/favorites')}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200 text-gray-300 hover:text-white text-sm"
                      >
                        <Heart size={16} className="text-[#00E5FF]" />
                        <span>Favoritos</span>
                      </button>
                      <div className="border-t border-white/10 mt-1 pt-1">
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-all duration-200 text-gray-300 hover:text-red-400 text-sm">
                          <LogOut size={16} />
                          <span>Sair</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Menu Mobile - Hamburger Neon */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 ml-1 ${
                isMobileMenuOpen 
                  ? 'bg-[#00E5FF]/20 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.4)]' 
                  : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5'
              }`}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Barra de Pesquisa - Integrada com Estilo Neon */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-0 right-0 z-[105] border-b border-[#00E5FF]/20"
            style={{
              top: '56px',
              background: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 229, 255, 0.1)',
            }}
          >
            <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto px-4 py-4">
              <div className="relative flex items-center">
                <div className="absolute left-4 text-gray-500">
                  <Search size={20} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar filmes, séries, atores..."
                  className="w-full bg-white/5 text-white placeholder-gray-500 pl-12 pr-24 py-3.5 rounded-full border border-white/10 focus:border-[#00E5FF] focus:outline-none transition-all duration-300 text-base"
                  style={{
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  }}
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition-all"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleVoiceSearch}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                        : 'hover:bg-white/10 text-gray-400'
                    }`}
                    title="Pesquisar por voz"
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>
              </div>
              {isListening && (
                <div className="mt-3 flex items-center justify-center gap-2 text-red-400 text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span>Ouvindo... Diga o nome do filme ou série</span>
                </div>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Mobile - Glassmorphism Neon */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 bottom-0 w-72 z-[120] p-6 pt-20"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderLeft: '1px solid rgba(0, 229, 255, 0.2)',
              boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5), -5px 0 20px rgba(0, 229, 255, 0.1)',
            }}
          >
            <div className="space-y-2">
              {navItems.map((item, index) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== '/' && location.pathname.startsWith(item.href));
                return (
                  <button
                    key={index}
                    onClick={() => {
                      navigate(item.href);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#00E5FF]/10 text-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.2)] border border-[#00E5FF]/30' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                <button
                  onClick={() => {
                    toggleCinemaMode();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isCinemaMode 
                      ? 'bg-[#00E5FF]/10 text-[#00E5FF]' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <MonitorPlay size={22} />
                  <span className="font-medium">Modo Cinema</span>
                </button>
                <button
                  onClick={() => {
                    criarSalaWatchParty();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-300"
                >
                  <Users size={22} />
                  <span className="font-medium">Assistir Juntos</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
