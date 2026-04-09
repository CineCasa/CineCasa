import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Smartphone,
  Monitor,
  Settings,
  Bell,
  BellOff,
  Battery,
  BatteryCharging
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import { useServiceWorker } from '@/hooks/useServiceWorker';

interface PWAStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  compact?: boolean;
}

export function PWAStatusIndicator({
  className = '',
  showDetails = true,
  position = 'top-right',
  compact = false,
}: PWAStatusIndicatorProps) {
  const { pwaInfo, getDeviceInfo, getCapabilities } = usePWA();
  const { isOnline, hasOfflineContent, cacheStats } = useOfflineContent();
  const { swInfo, applyUpdate } = useServiceWorker();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  const deviceInfo = getDeviceInfo();
  const capabilities = getCapabilities();

  // Monitorar bateria
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
        
        battery.addEventListener('chargingchange', () => {
          setIsCharging(battery.charging);
        });
      });
    }
  }, []);

  // Atualizar timestamp de sincronização
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync(Date.now());
    }, 60000); // Atualizar a cada minuto

    return () => clearInterval(interval);
  }, []);

  // Obter classes de posicionamento
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 transition-all duration-300';
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  // Formatar tempo desde última sincronização
  const formatLastSync = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  // Obter status geral
  const getStatusColor = () => {
    if (swInfo.updateAvailable) return 'text-orange-500';
    if (!isOnline) return 'text-red-500';
    if (hasOfflineContent) return 'text-green-500';
    return 'text-blue-500';
  };

  const getStatusIcon = () => {
    if (swInfo.updateAvailable) return <Download className="w-4 h-4" />;
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (hasOfflineContent) return <CheckCircle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (swInfo.updateAvailable) return 'Atualização disponível';
    if (!isOnline) return 'Offline';
    if (hasOfflineContent) return 'Offline ativo';
    return 'Online';
  };

  if (compact) {
    return (
      <div className={`${getPositionClasses()} ${className}`}>
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className={`flex items-center gap-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-xs font-medium">{getStatusText()}</span>
          </div>
          
          {batteryLevel !== null && (
            <div className="flex items-center gap-1 text-gray-500">
              {isCharging ? (
                <BatteryCharging className="w-3 h-3" />
              ) : (
                <Battery className="w-3 h-3" />
              )}
              <span className="text-xs">{batteryLevel}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${getPositionClasses()} ${className}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
            
            {pwaInfo.isInstalled && (
              <div className="flex items-center gap-1 text-blue-500">
                {deviceInfo.isMobile ? (
                  <Smartphone className="w-3 h-3" />
                ) : (
                  <Monitor className="w-3 h-3" />
                )}
                <span className="text-xs">PWA</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {batteryLevel !== null && (
              <div className="flex items-center gap-1 text-gray-500">
                {isCharging ? (
                  <BatteryCharging className="w-3 h-3" />
                ) : (
                  <Battery className="w-3 h-3" />
                )}
                <span className="text-xs">{batteryLevel}%</span>
              </div>
            )}
            
            <Settings 
              className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            />
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && showDetails && (
          <div className="border-t border-gray-200 p-3 space-y-3">
            {/* Status da Conexão */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conexão</span>
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span className="text-sm text-green-600">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-red-500" />
                    <span className="text-sm text-red-600">Offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Status do Service Worker */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service Worker</span>
              <div className="flex items-center gap-1">
                {swInfo.enabled ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-sm text-green-600">Ativo</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-sm text-red-600">Inativo</span>
                  </>
                )}
              </div>
            </div>

            {/* Atualização Disponível */}
            {swInfo.updateAvailable && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Atualização</span>
                <button
                  onClick={applyUpdate}
                  className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Atualizar</span>
                </button>
              </div>
            )}

            {/* Conteúdo Offline */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conteúdo Offline</span>
              <div className="flex items-center gap-1">
                {hasOfflineContent ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-sm text-green-600">
                      {cacheStats.totalItems} itens
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-500">Nenhum</span>
                  </>
                )}
              </div>
            </div>

            {/* Notificações */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Notificações</span>
              <div className="flex items-center gap-1">
                {capabilities.notifications ? (
                  <>
                    <Bell className="w-3 h-3 text-green-500" />
                    <span className="text-sm text-green-600">Ativas</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-500">Bloqueadas</span>
                  </>
                )}
              </div>
            </div>

            {/* Última Sincronização */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sincronização</span>
              <span className="text-sm text-gray-500">
                {formatLastSync(lastSync)}
              </span>
            </div>

            {/* Informações do Dispositivo */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div>Dispositivo: {deviceInfo.platform}</div>
                <div>Tipo: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</div>
                <div>Modo: {pwaInfo.isStandalone ? 'PWA' : 'Browser'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente simplificado para status rápido
export function QuickPWAStatus() {
  const { pwaInfo } = usePWA();
  const { isOnline } = useOfflineContent();
  const { swInfo } = useServiceWorker();

  const getStatusColor = () => {
    if (swInfo.updateAvailable) return 'bg-orange-500';
    if (!isOnline) return 'bg-red-500';
    if (pwaInfo.isInstalled) return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-600">
        {swInfo.updateAvailable ? 'Atualização' : 
         !isOnline ? 'Offline' : 
         pwaInfo.isInstalled ? 'PWA' : 'Browser'}
      </span>
    </div>
  );
}

export default PWAStatusIndicator;
