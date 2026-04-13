import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Film, Tv, Clock, Trash2, RefreshCw } from 'lucide-react';
import { useNewContentNotifications } from '@/hooks/useNewContentNotifications';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  icon?: string;
  type: string;
  data: {
    type: 'new_movie' | 'new_series' | 'new_episode' | 'recommendation' | 'continue_watching';
    contentId?: string;
    tmdbId?: number;
    contentType?: 'movie' | 'series';
  };
  created_at: string;
  read: boolean;
}

export const NotificationsPage: React.FC = () => {
  const { 
    notifications: newContentNotifications, 
    unreadCount, 
    markAsRead, 
    clearAllNotifications,
    isLoading,
    refetch 
  } = useNewContentNotifications();
  
  const { notifications: allNotifications, fetchNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<'new' | 'all'>('new');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Combinar todas as notificações
  const allCombinedNotifications = [
    ...newContentNotifications,
    ...(allNotifications || []).filter(n => n.type !== 'new_content')
  ];

  // Filtrar notificações baseado na aba ativa
  const filteredNotifications = activeTab === 'new' 
    ? newContentNotifications 
    : allCombinedNotifications;

  // Formatar data relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Agora há pouco' : `Há ${diffInMinutes} minutos`;
    } else if (diffInHours < 24) {
      return `Há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInDays < 7) {
      return `Há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Toggle seleção de notificação
  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Marcar múltiplas como lidas
  const markMultipleAsRead = async () => {
    for (const id of selectedNotifications) {
      await markAsRead(id);
    }
    setSelectedNotifications([]);
  };

  // Navegar para conteúdo
  const navigateToContent = (notification: NotificationItem) => {
    const { data } = notification;
    if (data.contentId && data.contentType) {
      const path = data.contentType === 'movie' ? 'cinema' : 'series';
      window.location.href = `/details/${path}/${data.contentId}`;
    }
  };

  // Recarregar notificações
  const handleRefresh = async () => {
    await refetch();
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="min-h-screen bg-black text-white pt-14 sm:pt-[70px] md:pt-[94px]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h1 className="text-lg sm:text-xl font-bold">Notificações</h1>
              {unreadCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-800 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-3 sm:mt-4">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg transition-colors ${
                activeTab === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="hidden sm:inline">Novos Conteúdos</span>
              <span className="sm:hidden">Novos</span>
              {unreadCount > 0 && (
                <span className="ml-1.5 sm:ml-2 bg-blue-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Todas
            </button>
          </div>
        </div>
      </div>

      {/* Ações em massa */}
      {selectedNotifications.length > 0 && (
        <div className="bg-gray-900 border-b border-gray-800 px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-xs sm:text-sm text-gray-300">
              {selectedNotifications.length} selecionada{selectedNotifications.length > 1 ? 's' : ''}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={markMultipleAsRead}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Marcar como lidas</span>
                <span className="sm:hidden">Lidas</span>
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className="px-2 sm:px-3 py-1 bg-gray-700 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Notificações */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-400" />
            <span className="ml-2 text-sm sm:text-base text-gray-400">Carregando notificações...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-400 mb-2">
              Nenhuma notificação
            </h3>
            <p className="text-sm text-gray-500 px-4">
              {activeTab === 'new' 
                ? 'Nenhum novo conteúdo adicionado nas últimas 12 horas'
                : 'Você não tem notificações'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-gray-900 border rounded-lg p-3 sm:p-4 transition-all hover:bg-gray-800 ${
                  !notification.read ? 'border-blue-500' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleSelection(notification.id)}
                    className="mt-0.5 sm:mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />

                  {/* Ícone */}
                  <div className="flex-shrink-0">
                    {notification.data?.type === 'new_movie' && (
                      <Film className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    )}
                    {notification.data?.type === 'new_series' && (
                      <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    )}
                    {(notification.data?.type === 'new_episode' ||
                      notification.data?.type === 'recommendation' ||
                      notification.data?.type === 'continue_watching') && (
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm sm:text-base font-semibold truncate ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                        <div className="flex items-center flex-wrap gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                          <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <span className="bg-blue-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded">
                              Nova
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        {notification.data?.contentId && (
                          <button
                            onClick={() => navigateToContent(notification)}
                            className="p-1 rounded hover:bg-gray-700 transition-colors"
                            title="Ver conteúdo"
                          >
                            <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          </button>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 rounded hover:bg-gray-700 transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Limpar todas */}
        {filteredNotifications.length > 0 && (
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800">
            <button
              onClick={clearAllNotifications}
              className="w-full py-2.5 sm:py-3 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Limpar todas as notificações</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
