import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Settings, Play, Tv, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate, useLocation } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'new_episode' | 'recommendation' | 'continue_watching' | 'system';
  title: string;
  body: string;
  image?: string;
  read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

export function NotificationBell() {
  const { 
    isSupported, 
    permission, 
    isSubscribed,
    unreadCount,
    notifications,
    requestPermission,
    subscribe,
    markAsRead,
    fetchNotifications,
    clearAllNotifications
  } = useNotifications();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is on notifications page
  const isOnNotificationsPage = location.pathname === '/notifications';

  // Carregar notificações quando abrir o painel
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    // Em dispositivos móveis, navegar diretamente para a página de notificações
    if (window.innerWidth < 768) {
      navigate('/notifications');
      return;
    }

    if (!isSupported) return;

    // Se não tem permissão, solicitar
    if (permission === 'default') {
      const granted = await requestPermission();
      if (granted && !isSubscribed) {
        await subscribe();
      }
    }

    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    // Navegar baseado no tipo
    if (notification.data?.type === 'new_episode') {
      navigate(`/details/series/${notification.data.seriesId}`);
    } else if (notification.data?.type === 'recommendation') {
      navigate(`/details/cinema/${notification.data.contentId}`);
    } else if (notification.data?.type === 'continue_watching') {
      navigate(`/watch/${notification.data.contentId}`);
    }
    
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_episode':
        return <Tv className="w-5 h-5 text-blue-400" />;
      case 'recommendation':
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case 'continue_watching':
        return <Play className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR');
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="relative" ref={panelRef}>
      {/* Botão do Sino */}
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="Notificações"
      >
        <Bell 
          className={`w-5 h-5 md:w-6 md:h-6 transition-colors duration-300 ${
            unreadCount > 0 && !isOnNotificationsPage
              ? 'text-red-500 animate-bell-pulse' 
              : 'text-white'
          }`} 
        />
        
        {/* Badge de não lidas */}
        {unreadCount > 0 && !isOnNotificationsPage && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

      </button>

      {/* Painel de Notificações */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Notificações</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                    title="Marcar todas como lidas"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'all' 
                    ? 'text-white border-b-2 border-red-600' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'unread' 
                    ? 'text-white border-b-2 border-red-600' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Não lidas {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            {/* Lista de Notificações */}
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {activeTab === 'unread' 
                      ? 'Nenhuma notificação não lida'
                      : 'Nenhuma notificação ainda'
                    }
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Novos episódios e recomendações aparecerão aqui
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                      !notification.read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Ícone/Imagem */}
                      <div className="flex-shrink-0">
                        {notification.image ? (
                          <img
                            src={notification.image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-white' : 'text-gray-300'
                          } line-clamp-1`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                          {notification.body}
                        </p>
                        
                        {/* Indicador de não lida */}
                        {!notification.read && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full" />
                            <span className="text-xs text-red-400">Nova</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              <button
                onClick={() => {
                  navigate('/settings/notifications');
                  setIsOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <Settings className="w-4 h-4" />
                Configurações de Notificações
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
