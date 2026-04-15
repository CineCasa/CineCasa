import { useState, useEffect, useRef } from "react";
import { Search, Bell, User, Menu, X, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useSupabaseContent } from "@/hooks/useSupabaseContent";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Cinema", path: "/cinema" },
  { label: "Séries", path: "/series-categorias" },
  { label: "Filmes Kids", path: "/kids-movies" },
  { label: "Séries Kids", path: "/kids-series" },
  { label: "Meus Favoritos", path: "/favorites" },
];

const Navbar = () => {
  const { data: categories } = useSupabaseContent();
  const totalContentCount = categories?.reduce((acc, cat) => acc + cat.items.length, 0) || 0;
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{id: string | number; title: string; genre: string[]; description?: string; year?: number; image: string}[]>([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      // NÃO fechar a pesquisa ao clicar fora - manter aberta
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Função de busca global em tempo real
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchOpen(true); // Manter sempre aberto enquanto digita

    if (val.trim()) {
      // Buscar em todos os conteúdos
      const allItems = categories?.flatMap(cat => cat.items) || [];
      const results = allItems.filter(item => 
        item.title.toLowerCase().includes(val.toLowerCase()) ||
        item.genre.some(g => g.toLowerCase().includes(val.toLowerCase())) ||
        item.description?.toLowerCase().includes(val.toLowerCase()) ||
        item.year?.toString().includes(val)
      ).slice(0, 8); // Limitar a 8 resultados
      
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  // Função para manter busca aberta
  const handleSearchFocus = () => {
    setSearchOpen(true);
  };

  // Função para selecionar resultado
  const handleResultClick = (item: {id: string | number; title: string}) => {
    navigate(`/content/${item.id}`);
    setSearchQuery(item.title);
    setSearchOpen(false);
    setSearchResults([]);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNavKeyDown = (e: React.KeyboardEvent, index: number) => {
    const items = document.querySelectorAll('.nav-link-item');
    if (e.key === "ArrowRight") {
      (items[index + 1] as HTMLElement)?.focus();
    } else if (e.key === "ArrowLeft") {
      (items[index - 1] as HTMLElement)?.focus();
    } else    if (e.key === "ArrowDown") {
      e.preventDefault();
      // Tentar focar no Hero primeiro, se não houver, vai para o primeiro card
      const heroBtn = document.querySelector('.hero-action-btn') as HTMLElement;
      if (heroBtn) {
        heroBtn.focus();
      } else {
        const firstCard = document.querySelector('[tabindex="0"]:not(.nav-link-item)') as HTMLElement;
        firstCard?.focus();
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 font-sans ${
        scrolled ? "bg-[#0f171e] shadow-xl border-b border-white/5" : "bg-gradient-to-b from-[#0f171e]/90 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 h-14 sm:h-16 md:h-20">
        {/* Logo and Main Nav Desktop */}
        <div className="flex items-center gap-6 md:gap-10">
          {/* Mobile menu toggle - Shown only on mobile */}
          <button
            className="p-2 -ml-1 text-white/80 hover:text-white transition-colors lg:hidden focus-visible rounded-md active:scale-95"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {mobileMenuOpen ? <X size={24} className="sm:size-28" /> : <Menu size={24} className="sm:size-28" />}
          </button>

          <Link to="/" className="flex flex-col items-start leading-none group min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <img 
                src="/cinecasa-logo.png" 
                alt="CineCasa" 
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const textElement = target.nextElementSibling as HTMLElement;
                  if (textElement) textElement.style.display = 'block';
                }}
              />
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-black tracking-tighter text-[#00A8E1] group-hover:text-white transition-colors hidden sm:block" style={{display: 'none'}}>
                CINECASA
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] md:text-[14px] font-bold text-white/50 tracking-normal uppercase -mt-0.5 truncate max-w-[100px] sm:max-w-none">
              Entretenimento
            </span>
          </Link>

          {/* Centralized Content Counter - Hidden on very small screens */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 hidden md:flex flex-col items-center pointer-events-none">
            <span className="text-[10px] font-black text-[#00A8E1] uppercase tracking-[0.2em] opacity-80 whitespace-nowrap">
              Temos {totalContentCount} conteúdos
            </span>
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent via-[#00A8E1]/50 to-transparent mt-1" />
          </div>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-6 flex-1 justify-end">
            {navItems.filter(item => item.label !== "TV ao Vivo").map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="relative">
                  <Link 
                    to={item.path}
                    onKeyDown={(e) => handleNavKeyDown(e, idx)}
                    className={`nav-link-item text-[17px] font-semibold transition-colors px-2 py-1 rounded-md focus-visible ${
                      isActive ? "text-[#00A8E1]" : "text-[#aaaaaa] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-[22px] left-0 right-0 h-1 bg-[#00A8E1] rounded-t-md" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 text-[#aaaaaa]">
          {/* Search */}
          <div className="relative" ref={searchRef}>
            <div className="flex items-center border border-transparent hover:border-white/20 hover:bg-white/5 rounded-full transition-all px-2 sm:px-3 py-1.5 sm:py-2 focus-within:border-white/40 focus-within:bg-white/5">
              <Search 
                size={16} 
                className="sm:size-18 text-white/60 hover:text-white cursor-pointer transition-colors flex-shrink-0"
                onClick={handleSearchFocus}
              />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Buscar..."
                className="bg-transparent text-sm text-white placeholder:text-[#aaaaaa] px-2 py-0 w-20 sm:w-32 md:w-48 lg:w-64 outline-none"
              />
            </div>

            {/* Dropdown de Resultados em Tempo Real */}
            {(searchOpen && searchResults.length > 0) && (
              <div className="absolute top-full mt-2 right-0 w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => handleResultClick(item)}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-12 h-16 object-cover rounded"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium text-sm truncate">{item.title}</h4>
                        <p className="text-gray-400 text-xs truncate">{item.genre.join(", ")}</p>
                        <p className="text-gray-500 text-xs">{item.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-white/10 bg-[#0f0f0f]">
                  <p className="text-gray-400 text-xs text-center">
                    {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Mensagem quando não há resultados */}
            {(searchOpen && searchQuery && searchResults.length === 0) && (
              <div className="absolute top-full mt-2 right-0 w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl p-4 z-50">
                <p className="text-gray-400 text-sm text-center">
                  Nenhum resultado encontrado para "{searchQuery}"
                </p>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="user-menu-btn p-2 text-white/80 hover:text-white transition-colors rounded-full focus-visible flex items-center gap-1.5 sm:gap-2 active:scale-95"
              aria-label="Menu do usuário"
            >
              <User size={22} className="sm:size-26" />
              <span className="hidden sm:inline text-xs truncate max-w-[80px] md:max-w-[100px] text-white/60">
                {user?.email?.split('@')[0]}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#19232b] border border-white/10 rounded-lg shadow-2xl py-2 z-[60]">
                <div className="px-4 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Logado como</p>
                  <p className="text-xs text-white/80 truncate font-semibold">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 text-white/80 hover:text-white transition-colors flex items-center gap-3 text-sm"
                >
                  <LogOut size={16} />
                  Sair do Cinecasa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Slide-down Prime Style - Hidden on small devices */}
      {mobileMenuOpen && (
        <div className="md:lg:hidden lg:hidden bg-[#19232b] absolute top-[100%] left-0 w-full shadow-2xl border-b border-white/5">
          <ul className="flex flex-col p-2 gap-1 max-h-[70vh] overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`w-full text-left text-lg font-semibold px-4 py-3 rounded-lg transition-colors block ${
                      isActive ? "bg-white/10 text-white" : "text-[#aaaaaa] hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
