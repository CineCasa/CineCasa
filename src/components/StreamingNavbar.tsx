import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, User, Home, PlaySquare, Monitor, Film, Settings, LogOut } from 'lucide-react';

interface StreamingNavbarProps {
  onSearch?: (query: string) => void;
  user?: any;
}

const StreamingNavbar: React.FC<StreamingNavbarProps> = ({ onSearch, user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const navItems = [
    { icon: Home, label: 'Início', active: true },
    { icon: PlaySquare, label: 'Séries', active: false },
    { icon: Film, label: 'Filmes', active: false },
  ];

  return (
    <motion.nav
      className={`streaming-navbar ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Film className="w-8 h-8 text-netflix-red" />
          <span className="text-xl font-bold text-white">CineCasa</span>
        </motion.div>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  item.active 
                    ? 'bg-netflix-red text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4">
          <motion.div 
            className={`relative ${isSearchOpen ? 'w-64' : 'w-48'}`}
            initial={false}
            animate={{ width: isSearchOpen ? 256 : 192 }}
          >
            <form onSubmit={handleSearch} className="w-full">
              <input
                type="text"
                placeholder="Buscar filmes, séries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                className="streaming-input w-full pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </form>
          </motion.div>

          {/* Notifications */}
          <motion.button
            className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-netflix-red rounded-full"></span>
          </motion.button>

          {/* User Profile */}
          <div className="relative">
            <motion.button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="w-5 h-5" />
              <Settings className="w-4 h-4" />
            </motion.button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-48 streaming-modal-content"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-2">
                  {user ? (
                    <>
                      <div className="px-3 py-2 border-b border-gray-700">
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-gray-400 text-sm">Premium</p>
                      </div>
                      <button className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all">
                        Minha Conta
                      </button>
                      <button className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all">
                        Configurações
                      </button>
                      <button className="w-full text-left px-3 py-2 text-red-500 hover:text-red-400 hover:bg-gray-700 rounded transition-all flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-all">
                        Entrar
                      </button>
                      <button className="w-full text-left px-3 py-2 streaming-button">
                        Começar Gratuitamente
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default StreamingNavbar;
