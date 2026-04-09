import React, { useState, useEffect } from 'react';
import { 
  WifiOff, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  X,
  Wifi,
  HardDrive,
  Clock,
  Film
} from 'lucide-react';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import { usePWA } from '@/hooks/usePWA';

interface OfflineBannerProps {
  className?: string;
  position?: 'top' | 'bottom';
  showClose?: boolean;
  autoHide?: boolean;
  showActions?: boolean;
}

export function OfflineBanner({
  className = '',
  position = 'top',
  showClose = true,
  autoHide = true,
  showActions = true,
}: OfflineBannerProps) {
  const { 
    isOnline, 
    hasOfflineContent, 
    cacheStats, 
    updateWatchProgress,
    getOfflineFavorites,
    cleanOldCache,
    clearAllCache
  } = useOfflineContent();
  
  const { pwaInfo, requestNotificationPermission } = usePWA();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<number>(Date.now());
  const [pendingActions, setPendingActions] = useState<number>(0);

  // Monitorar status de conexão
  useEffect(() => {
    if (!isOnline) {
      setIsVisible(true);
      setLastOnlineTime(Date.now());
    } else if (autoHide && isOnline) {
      // Esconder banner após 3 segundos online
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          setIsVisible(false);
          setIsClosing(false);
        }, 300);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, autoHide]);

  // Contar ações pendentes
  useEffect(() => {
    const countPendingActions = () => {
      // Verificar localStorage por ações não sincronizadas
      const pending = localStorage.getItem('pending-sync-actions');
      const count = pending ? JSON.parse(pending).length : 0;
      setPendingActions(count);
    };

    countPendingActions();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(countPendingActions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fechar banner manualmente
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  // Sincronizar quando voltar online
  const handleSync = async () => {
    if (!isOnline) return;

    try {
      // Sincronizar ações pendentes
      const pending = localStorage.getItem('pending-sync-actions');
      if (pending) {
        const actions = JSON.parse(pending);
        
        for (const action of actions) {
          try {
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action),
            });
          } catch (error) {
            console.error('Erro ao sincronizar ação:', error);
          }
        }
        
        localStorage.removeItem('pending-sync-actions');
        setPendingActions(0);
      }

      // Limpar cache antigo
      await cleanOldCache();
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  };

  // Solicitar notificações
  const handleEnableNotifications = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        // Mostrar notificação de teste
        new Notification('CineCasa', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
        });
      }
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
    }
  };

  // Formatar tempo offline
  const formatOfflineTime = () => {
    const now = Date.now();
    const diff = now - lastOnlineTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes} minutos`;
    if (hours < 24) return `${hours} horas`;
    return `${days} dias`;
  };

  // Não mostrar se estiver online e não houver ações pendentes
  if (!isVisible || (isOnline && !hasOfflineContent && pendingActions === 0)) {
    return null;
  }

  const getPositionClasses = () => {
    const baseClasses = `fixed left-0 right-0 z-50 transition-all duration-300 ${
      isClosing ? 'opacity-0 transform -translate-y-full' : 'opacity-100 transform translate-y-0'
    }`;
    
    return position === 'top' ? `${baseClasses} top-0` : `${baseClasses} bottom-0`;
  };

  const getBannerColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (pendingActions > 0) return 'bg-orange-500';
    if (hasOfflineContent) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className={getPositionClasses()}>
      <div className={`${getBannerColor()} text-white px-4 py-3 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Conteúdo Principal */}
          <div className="flex items-center gap-3 flex-1">
            {/* Ícone Principal */}
            <div className="flex-shrink-0">
              {!isOnline ? (
                <WifiOff className="w-5 h-5" />
              ) : pendingActions > 0 ? (
                <AlertCircle className="w-5 h-5" />
              ) : hasOfflineContent ? (
                <HardDrive className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </div>

            {/* Mensagem Status */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {!isOnline 
                  ? 'Você está offline' 
                  : pendingActions > 0 
                  ? `${pendingActions} ações pendentes de sincronização`
                  : hasOfflineContent 
                  ? 'Modo offline ativo'
                  : 'Conectado'
                }
              </p>
              
              {/* Detalhes Adicionais */}
              <div className="flex items-center gap-3 mt-1">
                {!isOnline && (
                  <span className="text-xs opacity-90">
                    Offline há {formatOfflineTime()}
                  </span>
                )}
                
                {hasOfflineContent && (
                  <span className="text-xs opacity-90">
                    {cacheStats.totalItems} itens disponíveis offline
                  </span>
                )}
                
                {isOnline && pendingActions > 0 && (
                  <span className="text-xs opacity-90">
                    Toque para sincronizar
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            {showActions && (
              <>
                {/* Sincronizar */}
                {isOnline && pendingActions > 0 && (
                  <button
                    onClick={handleSync}
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sincronizar</span>
                  </button>
                )}

                {/* Gerenciar Cache */}
                {hasOfflineContent && (
                  <button
                    onClick={() => {
                      if (confirm('Deseja limpar todo o cache offline?')) {
                        clearAllCache();
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Limpar Cache</span>
                  </button>
                )}

                {/* Ativar Notificações */}
                {!isOnline && pwaInfo.isInstalled && (
                  <button
                    onClick={handleEnableNotifications}
                    className="flex items-center gap-1 px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-xs"
                  >
                    <AlertCircle className="w-3 h-3" />
                    <span>Notificações</span>
                  </button>
                )}
              </>
            )}

            {/* Botão Fechar */}
            {showClose && (
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de Progresso (opcional) */}
        {pendingActions > 0 && isOnline && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-white/60 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}

// Componente simplificado para indicador offline
export function OfflineIndicator() {
  const { isOnline, hasOfflineContent } = useOfflineContent();
  const { pwaInfo } = usePWA();

  if (isOnline && !hasOfflineContent) return null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${
        !isOnline 
          ? 'bg-red-500 text-white' 
          : 'bg-blue-500 text-white'
      }`}>
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Offline</span>
          </>
        ) : (
          <>
            <HardDrive className="w-4 h-4" />
            <span className="text-sm font-medium">Offline</span>
          </>
        )}
      </div>
    </div>
  );
}

// Componente para conteúdo offline específico
export function OfflineContentInfo() {
  const { cacheStats, getOfflineFavorites, getCacheStats } = useOfflineContent();

  const favorites = getOfflineFavorites();
  const stats = getCacheStats();

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Film className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Conteúdo Offline</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Total de Itens</div>
          <div className="text-2xl font-bold text-gray-900">{cacheStats.totalItems}</div>
        </div>

        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Favoritos Offline</div>
          <div className="text-2xl font-bold text-gray-900">{favorites.length}</div>
        </div>

        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Uso de Cache</div>
          <div className="text-2xl font-bold text-gray-900">
            {cacheStats.usagePercentage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white rounded-lg p-3">
          <div className="text-sm text-gray-600 mb-1">Espaço Livre</div>
          <div className="text-2xl font-bold text-gray-900">
            {(cacheStats.freeSpace / (1024 * 1024)).toFixed(1)}MB
          </div>
        </div>
      </div>

      {/* Lista de favoritos */}
      {favorites.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Favoritos Disponíveis</h4>
          <div className="space-y-1">
            {favorites.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded-lg">
                <img 
                  src={item.poster} 
                  alt={item.title}
                  className="w-8 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.year}</p>
                </div>
              </div>
            ))}
            {favorites.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                +{favorites.length - 5} mais itens
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default OfflineBanner;
