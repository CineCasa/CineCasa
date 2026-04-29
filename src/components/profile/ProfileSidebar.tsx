import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Film, 
  Tv, 
  Compass, 
  List, 
  PlayCircle, 
  Heart, 
  User, 
  CreditCard, 
  Shield, 
  Bell, 
  Monitor, 
  Crown,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  section?: string;
}

const mainMenuItems: MenuItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Início', path: '/' },
  { icon: <Film className="w-5 h-5" />, label: 'Filmes', path: '/movies' },
  { icon: <Tv className="w-5 h-5" />, label: 'Séries', path: '/series' },
  { icon: <Compass className="w-5 h-5" />, label: 'Explorar', path: '/explore' },
  { icon: <List className="w-5 h-5" />, label: 'Minha Lista', path: '/watchlist' },
  { icon: <PlayCircle className="w-5 h-5" />, label: 'Assistidos', path: '/history' },
  { icon: <Heart className="w-5 h-5" />, label: 'Favoritos', path: '/favorites' },
];

const accountMenuItems: MenuItem[] = [
  { icon: <User className="w-5 h-5" />, label: 'Perfil', path: '/profile', section: 'CONTA' },
  { icon: <CreditCard className="w-5 h-5" />, label: 'Assinatura', path: '/subscription' },
  { icon: <Shield className="w-5 h-5" />, label: 'Segurança', path: '/security' },
  { icon: <Bell className="w-5 h-5" />, label: 'Notificações', path: '/notifications' },
  { icon: <Monitor className="w-5 h-5" />, label: 'Dispositivos', path: '/devices' },
];

const settingsMenuItems: MenuItem[] = [
  { icon: <PlayCircle className="w-5 h-5" />, label: 'Reprodução', path: '/settings/playback', section: 'CONFIGURAÇÕES' },
  { icon: <Film className="w-5 h-5" />, label: 'Legendas', path: '/settings/subtitles' },
  { icon: <Globe className="w-5 h-5" />, label: 'Idioma', path: '/settings/language' },
  { icon: <Shield className="w-5 h-5" />, label: 'Controle Parental', path: '/settings/parental' },
  { icon: <Lock className="w-5 h-5" />, label: 'Privacidade', path: '/settings/privacy' },
  { icon: <Accessibility className="w-5 h-5" />, label: 'Acessibilidade', path: '/settings/accessibility' },
];

import { Globe, Accessibility, Lock } from 'lucide-react';

interface ProfileSidebarProps {
  isPremium?: boolean;
  onLogout?: () => void;
}

export function ProfileSidebar({ isPremium = false, onLogout }: ProfileSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const renderMenuItem = (item: MenuItem) => (
    <motion.button
      key={item.path}
      onClick={() => navigate(item.path)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
        isActive(item.path) 
          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border-l-2 border-cyan-500"
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className={cn(
        "transition-colors",
        isActive(item.path) ? "text-cyan-400" : "group-hover:text-white"
      )}>
        {item.icon}
      </span>
      {!isCollapsed && (
        <span className="font-medium text-sm">{item.label}</span>
      )}
    </motion.button>
  );

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#0a0a0f]/95 backdrop-blur-xl border-r border-white/5 z-50",
        "flex flex-col overflow-hidden transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-3"
          animate={{ opacity: isCollapsed ? 0 : 1 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <PlayCircle className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                CINECASA
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Entretenimento e Lazer
              </p>
            </div>
          )}
        </motion.div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight className={cn("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} />
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-4 space-y-1">
        {/* Main Menu */}
        <div className="px-3 space-y-1">
          {mainMenuItems.map(renderMenuItem)}
        </div>

        {/* Account Section */}
        <div className="mt-6 px-3">
          {!isCollapsed && (
            <h3 className="px-4 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
              CONTA
            </h3>
          )}
          <div className="space-y-1">
            {accountMenuItems.map(renderMenuItem)}
          </div>
        </div>

        {/* Settings Section */}
        <div className="mt-6 px-3">
          {!isCollapsed && (
            <h3 className="px-4 text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
              CONFIGURAÇÕES
            </h3>
          )}
          <div className="space-y-1">
            {settingsMenuItems.map(renderMenuItem)}
          </div>
        </div>
      </div>

      {/* Premium Card */}
      {!isCollapsed && !isPremium && (
        <div className="p-4">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 p-4 border border-cyan-500/30"
            whileHover={{ scale: 1.02 }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-cyan-400">CINECASA PREMIUM</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Assine agora e tenha acesso ilimitado.
              </p>
              <button 
                onClick={() => navigate('/subscription')}
                className="w-full py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-sm font-medium text-white hover:from-cyan-400 hover:to-blue-400 transition-all"
              >
                Ver planos
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Logout */}
      <div className="p-4 border-t border-white/5">
        <motion.button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
            "text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all",
            isCollapsed && "justify-center"
          )}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium text-sm">Sair</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
}

export default ProfileSidebar;
