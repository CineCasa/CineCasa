import { useEffect, useState } from 'react';
import { useHotReload } from '@/hooks/useHotReload';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdatesV2';
import { toast } from 'sonner';

interface UpdateBannerProps {
  message: string;
  type: 'info' | 'warning' | 'error';
  onAction?: () => void;
  actionText?: string;
}

function UpdateBanner({ message, type, onAction, actionText }: UpdateBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const bgColor = type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
  const textColor = 'text-white';

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${bgColor} ${textColor} px-4 py-3 shadow-lg transform transition-all duration-300`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse">
            {type === 'error' && '⚠️'}
            {type === 'warning' && '⚡'}
            {type === 'info' && '🔄'}
          </div>
          <span className="text-sm font-medium">{message}</span>
        </div>
        <div className="flex items-center space-x-2">
          {onAction && actionText && (
            <button
              onClick={onAction}
              className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
            >
              {actionText}
            </button>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export function HotReloadManager() {
  const { checkForUpdates, currentVersion } = useHotReload();
  const { isConnected } = useRealtimeUpdates();
  const [updateBanner, setUpdateBanner] = useState<{
    message: string;
    type: 'info' | 'warning' | 'error';
    onAction?: () => void;
    actionText?: string;
  } | null>(null);

  useEffect(() => {
    // Ouvir eventos de atualização em tempo real
    const handleRealtimeUpdate = (event: CustomEvent) => {
      const { version, force, message } = event.detail;
      
      if (force) {
        setUpdateBanner({
          message: message || 'Atualização crítica disponível',
          type: 'error',
          onAction: () => window.location.reload(),
          actionText: 'Atualizar Agora'
        });
      } else {
        setUpdateBanner({
          message: message || 'Nova atualização disponível',
          type: 'info',
          onAction: () => window.location.reload(),
          actionText: 'Recarregar'
        });
      }
    };

    const handleForceUpdateCheck = (event: CustomEvent) => {
      checkForUpdates();
    };

    const handleMaintenanceScheduled = (event: CustomEvent) => {
      const { title, message: maintenanceMessage, scheduledAt } = event.detail;
      
      setUpdateBanner({
        message: `${title}: ${maintenanceMessage}`,
        type: 'warning'
      });
    };

    const handleAppUpdated = (event: CustomEvent) => {
      console.log('[HotReloadManager] Aplicação atualizada:', event.detail);
      
      // Limpar banner de atualização
      setUpdateBanner(null);
      
      // Mostrar notificação de sucesso
      toast.success('Aplicação atualizada com sucesso!', {
        description: 'As últimas alterações já estão disponíveis.',
        duration: 3000
      });
    };

    window.addEventListener('realtime-update', handleRealtimeUpdate as EventListener);
    window.addEventListener('force-update-check', handleForceUpdateCheck as EventListener);
    window.addEventListener('maintenance-scheduled', handleMaintenanceScheduled as EventListener);
    window.addEventListener('app-updated', handleAppUpdated as EventListener);

    return () => {
      window.removeEventListener('realtime-update', handleRealtimeUpdate as EventListener);
      window.removeEventListener('force-update-check', handleForceUpdateCheck as EventListener);
      window.removeEventListener('maintenance-scheduled', handleMaintenanceScheduled as EventListener);
      window.removeEventListener('app-updated', handleAppUpdated as EventListener);
    };
  }, [checkForUpdates]);

  // Adicionar indicador de status
  useEffect(() => {
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'hot-reload-status';
    statusIndicator.className = 'fixed bottom-4 right-4 z-40 flex items-center space-x-2 px-3 py-2 bg-black bg-opacity-75 text-white text-xs rounded-full opacity-0 transition-opacity duration-300';
    statusIndicator.innerHTML = `
      <div class="w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} rounded-full animate-pulse"></div>
      <span>v${currentVersion || 'unknown'}</span>
    `;
    
    document.body.appendChild(statusIndicator);

    // Mostrar indicador em hover
    const showIndicator = () => {
      statusIndicator.style.opacity = '1';
    };
    
    const hideIndicator = () => {
      statusIndicator.style.opacity = '0';
    };

    statusIndicator.addEventListener('mouseenter', showIndicator);
    statusIndicator.addEventListener('mouseleave', hideIndicator);

    return () => {
      statusIndicator.removeEventListener('mouseenter', showIndicator);
      statusIndicator.removeEventListener('mouseleave', hideIndicator);
      document.body.removeChild(statusIndicator);
    };
  }, [isConnected, currentVersion]);

  return (
    <>
      {updateBanner && (
        <UpdateBanner
          message={updateBanner.message}
          type={updateBanner.type}
          onAction={updateBanner.onAction}
          actionText={updateBanner.actionText}
        />
      )}
    </>
  );
}
