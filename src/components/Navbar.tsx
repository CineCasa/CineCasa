import { useState, useEffect } from "react";
import { Search, Bell, User, Menu, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

          <Link to="/" className="text-2xl sm:text-3xl font-black tracking-tight text-[#00A8E1] hover:text-white transition-colors flex items-center min-w-max">
            STREAM<span className="text-white">+</span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="relative">
                  <Link 
                    to={item.path}
                    className={`text-[17px] font-semibold transition-colors px-2 py-1 rounded-md focus-visible ${
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

          <button className="p-2 text-white/80 hover:text-white transition-colors rounded-full focus-visible">
            <User size={26} />
          </button>
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
