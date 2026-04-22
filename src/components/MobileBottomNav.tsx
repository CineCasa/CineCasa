import { Home, Film, Tv, Heart, Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";

const navItems = [
  { label: "Início", path: "/", icon: Home },
  { label: "Filmes", path: "/cinema", icon: Film },
  { label: "Séries", path: "/series", icon: Tv },
  { label: "Favoritos", path: "/favorites", icon: Heart },
  { label: "Notificações", path: "/notifications", icon: Bell },
];

const MobileBottomNav = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/content/")) return null;

  const nav = (
    <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[999999] bg-[#0a0d15] border-t border-white/10 md:hidden">
      <div className="flex items-center justify-around h-14 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 no-underline ${
                isActive ? "text-[#00A8E1]" : "text-white/60"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
};

export default MobileBottomNav;
