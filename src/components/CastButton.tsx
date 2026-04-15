import React, { useState, useEffect } from 'react';
import { Cast, CastConnected, MonitorPlay, Airplay, X } from 'lucide-react';
import { useScreenCast } from '@/hooks/useScreenCast';
import { CastMediaInfo } from '@/services/screenCastService';
import { motion, AnimatePresence } from 'framer-motion';

interface CastButtonProps {
  mediaInfo?: CastMediaInfo;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const CastButton: React.FC<CastButtonProps> = ({ 
  mediaInfo,
  className = '',
  size = 'md',
  showLabel = false
}) => {
  const {
    isAvailable,
    isInitialized,
    devices,
    isConnected,
    isCasting,
    connect,
    disconnect,
    loadMedia,
    error
  } = useScreenCast();

  const [showDeviceList, setShowDeviceList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar mídia quando conectar
  useEffect(() => {
    if (isConnected && mediaInfo) {
      loadMedia(mediaInfo);
    }
  }, [isConnected, mediaInfo, loadMedia]);

  // Se não estiver disponível, não mostrar nada
  if (!isInitialized || !isAvailable) {
    return null;
  }

  const handleConnect = async (deviceId: string) => {
    setIsLoading(true);
    try {
      await connect(deviceId);
      setShowDeviceList(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'flex items-center gap-2 rounded-full transition-all duration-200';
    const sizeClasses = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3'
    };
    
    if (isConnected || isCasting) {
      return `${baseClasses} ${sizeClasses[size]} bg-green-500/20 text-green-400 hover:bg-green-500/30`;
    }
    return `${baseClasses} ${sizeClasses[size]} bg-white/10 text-white hover:bg-white/20`;
  };

  const getIcon = () => {
    if (isConnected || isCasting) {
      return <CastConnected size={getIconSize()} />;
    }
    return <Cast size={getIconSize()} />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botão principal */}
      <button
        onClick={() => {
          if (isConnected) {
            handleDisconnect();
          } else {
            setShowDeviceList(!showDeviceList);
          }
        }}
        className={getButtonClasses()}
        disabled={isLoading}
        title={isConnected ? 'Desconectar' : 'Transmitir para TV'}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <MonitorPlay size={getIconSize()} />
          </motion.div>
        ) : (
          getIcon()
        )}
        {showLabel && (
          <span className="text-sm font-medium hidden sm:inline">
            {isConnected ? 'Conectado' : 'Transmitir'}
          </span>
        )}
      </button>

      {/* Lista de dispositivos */}
      <AnimatePresence>
        {showDeviceList && !isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-64 bg-gray-900/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-medium text-white">Transmitir para</span>
              <button
                onClick={() => setShowDeviceList(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Lista de dispositivos */}
            <div className="p-2">
              {devices.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <MonitorPlay size={32} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-sm text-gray-400">
                    Nenhum dispositivo encontrado
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Certifique-se que sua TV está na mesma rede Wi-Fi
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {devices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => handleConnect(device.id)}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
                    >
                      {device.type === 'airplay' ? (
                        <Airplay size={20} className="text-blue-400" />
                      ) : (
                        <Cast size={20} className="text-gray-300" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {device.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {device.type === 'chromecast' ? 'Chromecast' : 'AirPlay'}
                        </p>
                      </div>
                      {device.status === 'connected' && (
                        <span className="text-xs text-green-400">Conectado</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer com dica */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/10">
              <p className="text-xs text-gray-500">
                💡 Dica: Use o mesmo Wi-Fi do seu celular e TV
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip de erro */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full right-0 mt-2 px-3 py-2 bg-red-500/90 text-white text-xs rounded-lg whitespace-nowrap"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default CastButton;
