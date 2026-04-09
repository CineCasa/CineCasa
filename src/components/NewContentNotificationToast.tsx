import React, { useState, useEffect } from 'react';
import { X, Film, Tv, Clock } from 'lucide-react';
import { useNewContentNotifications } from '@/hooks/useNewContentNotifications';

interface NewContentNotificationToastProps {
  className?: string;
}

export const NewContentNotificationToast: React.FC<NewContentNotificationToastProps> = ({ 
  className = '' 
}) => {
  const { notifications, unreadCount, markAsRead } = useNewContentNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  // Mostrar notificações não lidas e não dispensadas
  useEffect(() => {
    const unreadAndNotDismissed = notifications.filter(
      n => !n.read && !dismissedNotifications.includes(n.id)
    );

    // Mostrar apenas as 3 mais recentes
    const toShow = unreadAndNotDismissed.slice(0, 3).map(n => n.id);
    setVisibleNotifications(toShow);

    // Auto-remove após 8 segundos
    toShow.forEach(id => {
      const timer = setTimeout(() => {
        setVisibleNotifications(prev => prev.filter(nid => nid !== id));
      }, 8000);

      return () => clearTimeout(timer);
    });
  }, [notifications, dismissedNotifications]);

  const handleDismiss = (notificationId: string) => {
    setVisibleNotifications(prev => prev.filter(id => id !== notificationId));
    setDismissedNotifications(prev => [...prev, notificationId]);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    handleDismiss(notificationId);
  };

  const visibleNotificationItems = notifications.filter(n => 
    visibleNotifications.includes(n.id)
  );

  if (visibleNotificationItems.length === 0) return null;

  return (
    <div className={`fixed top-20 right-4 z-50 space-y-2 ${className}`}>
      {visibleNotificationItems.map((notification, index) => (
        <div
          key={notification.id}
          className={`
            bg-gray-900 border border-gray-700 rounded-lg shadow-2xl
            p-4 min-w-[320px] max-w-[400px]
            transform transition-all duration-500 ease-out
            animate-in slide-in-from-right fade-in
            hover:shadow-3xl
            ${index === 0 ? 'animate-pulse' : ''}
          `}
          style={{
            animationDelay: `${index * 100}ms`,
            animation: 'slideIn 0.5s ease-out',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              {notification.data?.contentType === 'movie' ? (
                <Film className="w-5 h-5 text-blue-400" />
              ) : (
                <Tv className="w-5 h-5 text-green-400" />
              )}
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {notification.data?.contentType === 'movie' ? 'Novo Filme' : 'Nova Série'}
              </span>
            </div>
            <button
              onClick={() => handleDismiss(notification.id)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="mb-3">
            <h4 className="text-white font-semibold text-sm mb-1 line-clamp-1">
              {notification.title}
            </h4>
            <p className="text-gray-300 text-xs line-clamp-2">
              {notification.body}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Agora há pouco</span>
            </div>
            <button
              onClick={() => handleMarkAsRead(notification.id)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
            >
              Marcar como lida
            </button>
          </div>

          {/* Barra de progresso */}
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b-lg animate-pulse"
               style={{
                 animation: 'shrink 8s linear forwards',
                 width: '100%',
               }}
          />
        </div>
      ))}

      {/* Contador de notificações restantes */}
      {unreadCount > visibleNotificationItems.length && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-center">
          <p className="text-xs text-gray-400">
            +{unreadCount - visibleNotificationItems.length} notificações
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
};

export default NewContentNotificationToast;
