import { useState, useEffect, useRef } from "react";
import { Search, Bell, User, Menu, X, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const navItems = [
  { label: "Início", path: "/" },
  { label: "Cinema", path: "/cinema" },
  { label: "Séries", path: "/series" },
  { label: "Tv ao Vivo", path: "/tv-live" },
  { label: "Filmes Kids", path: "/kids-movies" },
  { label: "Séries Kids", path: "/kids-series" },
  { label: "Meus Favoritos", path: "/favorites" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim()) {
      navigate(`/search?q=${encodeURIComponent(val)}`);
    } else if (location.pathname === "/search") {
      navigate("/");
    }
  };

  const handleNavKeyDown = (e: React.KeyboardEvent, index: number) => {
    const items = document.querySelectorAll('.nav-link-item');
    if (e.key === "ArrowRight") {
      (items[index + 1] as HTMLElement)?.focus();
    } else if (e.key === "ArrowLeft") {
      (items[index - 1] as HTMLElement)?.focus();
    } else if (e.key === "ArrowDown") {
      // Pular para o primeiro card de conteúdo
      const firstCard = document.querySelector('[tabindex="0"]') as HTMLElement;
      firstCard?.focus();
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 font-sans ${
        scrolled ? "bg-[#0f171e] shadow-xl border-b border-white/5" : "bg-gradient-to-b from-[#0f171e]/90 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12 h-16 sm:h-20">
        {/* Logo and Main Nav Desktop */}
        <div className="flex items-center gap-6 md:gap-10">
          {/* Mobile menu toggle (Left side on Prime Video) */}
          <button
            className="p-1 -ml-1 text-white/80 hover:text-white transition-colors lg:hidden focus-visible rounded-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <Link to="/" className="flex flex-col items-start leading-none group">
            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-[#00A8E1] group-hover:text-white transition-colors">
              CINECASA
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-white/50 tracking-widest uppercase">
              Entretenimento e lazer
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-6">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="relative">
                  <Link 
                    to={item.path}
                    onKeyDown={(e) => handleNavKeyDown(e, idx)}
                    className={`nav-link-item text-[17px] font-semibold transition-colors px-2 py-1 rounded-md focus-visible ${
                      isActive ? "text-white" : "text-[#aaaaaa] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute -bottom-[22px] left-0 right-0 h-1 bg-white rounded-t-md" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4 text-[#aaaaaa]">
          {/* Search */}
          <div className="flex items-center border border-transparent hover:border-white/20 hover:bg-white/5 rounded-full transition-all px-1 sm:px-2 py-1 focus-within:border-white/40 focus-within:bg-white/5">
            {searchOpen && (
              <input
                autoFocus
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Busca"
                className="bg-transparent text-sm sm:text-base text-white placeholder:text-[#aaaaaa] px-2 py-1 w-28 sm:w-48 outline-none"
                onBlur={() => {
                  if (!searchQuery) {
                    setTimeout(() => setSearchOpen(false), 200);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearchOpen(false);
                  }
                }}
              />
            )}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-white/80 hover:text-white transition-colors rounded-full focus-visible"
            >
              <Search size={22} />
            </button>
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="user-menu-btn p-2 text-white/80 hover:text-white transition-colors rounded-full focus-visible flex items-center gap-2"
            >
              <User size={26} />
              <span className="hidden sm:inline text-xs truncate max-w-[100px] text-white/60">
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

      {/* Mobile Menu Slide-down Prime Style */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#19232b] absolute top-[100%] left-0 w-full shadow-2xl border-b border-white/5">
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
