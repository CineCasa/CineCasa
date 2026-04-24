import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Home, PlaySquare, Monitor, Film, LogOut, Heart, Bell, Users, MonitorPlay, X, Mic, MicOff } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
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
    { icon: PlaySquare, label: 'Séries', href: '/series-categorias' },
    { icon: Heart, label: 'Favoritos', href: '/favorites' },
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
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isSearchOpen]);

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
            {/* Botão de Pesquisa - Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2 rounded-full hover:bg-white/10 transition-all duration-300 ${
                isSearchOpen ? 'text-accent bg-white/10' : 'text-secondary hover:text-accent'
              }`}
              title={isSearchOpen ? 'Fechar pesquisa' : 'Pesquisar'}
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
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

      {/* Barra de Pesquisa - Integrada abaixo da navbar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed left-0 right-0 z-[105] bg-[#0f171e]/95 backdrop-blur-md border-b border-white/10 shadow-lg"
            style={{ top: '56px' }}
          >
            <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-secondary">
                  <Search size={20} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar filmes, séries..."
                  className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg py-2"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary transition-all"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'hover:bg-white/10 text-secondary'
                  }`}
                  title="Pesquisar por voz"
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button
                  type="submit"
                  className="flex-shrink-0 px-6 py-2 bg-accent hover:bg-accent/80 text-white rounded-full font-medium transition-all"
                >
                  Buscar
                </button>
              </div>
              {isListening && (
                <div className="mt-2 flex items-center justify-center gap-2 text-red-400 text-sm">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span>Ouvindo...</span>
                </div>
              )}
            </form>
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
