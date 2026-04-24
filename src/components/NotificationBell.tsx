import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate, useLocation } from 'react-router-dom';

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is on notifications page
  const isOnNotificationsPage = location.pathname === '/notifications';
  const hasUnreadNotifications = unreadCount > 0 && !isOnNotificationsPage;

  const handleBellClick = () => {
    navigate('/notifications');
  };

  return (
    <button
      onClick={handleBellClick}
      className={`relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
        isOnNotificationsPage || hasUnreadNotifications
          ? 'text-[#00E5FF] bg-[#00E5FF]/10 shadow-[0_0_15px_rgba(0,229,255,0.3)]' 
          : 'text-gray-400 hover:text-[#00E5FF] hover:bg-white/5 hover:shadow-[0_0_10px_rgba(0,229,255,0.2)]'
      }`}
      aria-label="Notificações"
    >
      <Bell 
        size={18}
        className={`transition-all duration-300 ${
          hasUnreadNotifications
            ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
            : ''
        }`} 
        strokeWidth={hasUnreadNotifications ? 2.5 : 2}
      />
      
      {/* Badge de não lidas - Vermelho Neon Pulsante */}
      {hasUnreadNotifications && (
        <span 
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse"
          style={{
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.8), 0 0 16px rgba(239, 68, 68, 0.4)',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
