import { Home, Clapperboard, PlaySquare, Heart, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

// Interface para os itens de navegação
interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { label: "HOME", path: "/", icon: Home },
  { label: "FILMES", path: "/cinema", icon: Clapperboard },
  { label: "SÉRIES", path: "/series", icon: PlaySquare, isCenter: true },
  { label: "FAVORITOS", path: "/favorites", icon: Heart },
  { label: "NOVIDADES", path: "/notifications", icon: Bell },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  // Check if user is on notifications page
  const isOnNotificationsPage = location.pathname === '/notifications';
  // Check if there are unread notifications
  const hasUnreadNotifications = unreadCount > 0 && !isOnNotificationsPage;

  // Ocultar em páginas de player ou conteúdo
  if (location.pathname.startsWith("/content/") || 
      location.pathname.startsWith("/watch") ||
      location.pathname.startsWith("/movie-details/") ||
      location.pathname.startsWith("/series-details/")) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const nav = (
    <>
      {/* Spacer para conteúdo não ficar atrás da barra */}
      <div className="md:hidden h-[calc(80px+env(safe-area-inset-bottom))]" />
      
      <nav 
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[9999] md:hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Container principal com glassmorphism */}
        <div className="mx-3 mb-3">
          <div
            className="relative flex items-center justify-between px-2 py-2 rounded-2xl"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 229, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 229, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isNotificationItem = item.path === '/notifications';

              // Item central (Séries) - Destaque especial
              if (item.isCenter) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative flex flex-col items-center justify-center -mt-6"
                  >
                    {/* Círculo externo glow */}
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                        active 
                          ? 'bg-gradient-to-br from-[#00E5FF] to-[#00A8E1]' 
                          : 'bg-gradient-to-br from-[#00E5FF]/80 to-[#00A8E1]/80'
                      }`}
                      style={{
                        boxShadow: active 
                          ? '0 0 30px rgba(0, 229, 255, 0.6), 0 0 60px rgba(0, 229, 255, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3)' 
                          : '0 4px 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.2)',
                      }}
                    >
                      {/* Anel externo pulsante quando ativo */}
                      {active && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            border: '2px solid rgba(0, 229, 255, 0.5)',
                          }}
                          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                      <Icon 
                        size={24} 
                        strokeWidth={2.5} 
                        className="text-black"
                      />
                    </motion.div>
                    <span 
                      className={`text-[9px] font-semibold mt-1 tracking-[0.1em] transition-all duration-300 ${
                        active ? 'text-[#00E5FF]' : 'text-white/60'
                      }`}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      {item.label}
                    </span>
                    {/* Traço indicador quando ativo */}
                    {active && (
                      <motion.div
                        layoutId="mobileNavIndicator"
                        className="absolute -bottom-1 w-8 h-0.5 bg-[#00E5FF] rounded-full"
                        style={{ boxShadow: '0 0 8px #00E5FF, 0 0 16px #00E5FF' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              }

              // Itens normais
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center flex-1 py-1"
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="relative"
                  >
                    <Icon 
                      size={22} 
                      strokeWidth={active ? 2.5 : 1.5}
                      className={`transition-all duration-300 ${
                        active 
                          ? 'text-[#00E5FF] drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' 
                          : isNotificationItem && hasUnreadNotifications
                            ? 'text-[#FF3131]'
                            : 'text-white/50'
                      }`}
                      style={{
                        filter: active ? 'drop-shadow(0 0 6px rgba(0, 229, 255, 0.8))' : 'none',
                      }}
                    />
                    
                    {/* Badge de notificações - Vermelho Neon */}
                    {isNotificationItem && hasUnreadNotifications && (
                      <span 
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-[#FF3131] text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse"
                        style={{
                          boxShadow: '0 0 8px #FF3131, 0 0 12px rgba(255, 49, 49, 0.6)',
                          fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}

                    {/* Traço brilhante acima do ícone ativo */}
                    {active && (
                      <motion.div
                        layoutId="mobileNavIndicator"
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent rounded-full"
                        style={{ boxShadow: '0 0 10px #00E5FF, 0 0 20px #00E5FF' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>

                  {/* Label */}
                  <span 
                    className={`text-[9px] font-medium mt-1 tracking-[0.08em] transition-all duration-300 ${
                      active 
                        ? 'text-[#00E5FF] drop-shadow-[0_0_4px_rgba(0,229,255,0.6)]' 
                        : isNotificationItem && hasUnreadNotifications
                          ? 'text-[#FF3131]/80'
                          : 'text-white/40'
                    }`}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Background preto puro atrás para garantir contraste */}
        <div 
          className="absolute inset-0 -z-10"
          style={{ background: '#000000' }}
        />
      </nav>
    </>
  );

  return createPortal(nav, document.body);
};

export default MobileBottomNav;
