import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Trash2, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  AlertCircle, 
  HardDrive,
  Activity,
  Zap,
  Shield,
  Globe,
  Clock,
  BarChart3
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import { useServiceWorker } from '@/hooks/useServiceWorker';

export function PWADashboard() {
  const { pwaInfo, installPWA, addToHomeScreen, getCapabilities, getDeviceInfo } = usePWA();
  const { 
    cacheStats, 
    clearAllCache, 
    updateSettings, 
    isOnline, 
    hasOfflineContent,
    cacheUsagePercentage,
    isNearLimit
  } = useOfflineContent();
  const { 
    swInfo, 
    applyUpdate, 
    getCacheInfo, 
    clearAllCaches: clearSWCaches,
    getOfflineCapabilities,
    totalCacheSize,
    cacheCount
  } = useServiceWorker();

  const [activeTab, setActiveTab] = useState<'overview' | 'cache' | 'capabilities' | 'device'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Atualizar informações
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await getCacheInfo();
      // Forçar atualização do Service Worker
      if (swInfo.controller) {
        swInfo.controller.postMessage({ type: 'CACHE_UPDATE' });
      }
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Formatar tamanho do cache
  const formatCacheSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(2);
    
    return `${size} ${sizes[i]}`;
  };

  // Obter informações do dispositivo
  const deviceInfo = getDeviceInfo();
  const capabilities = getCapabilities();
  const offlineCapabilities = getOfflineCapabilities();

  const tabs = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'cache',
      label: 'Cache',
      icon: <HardDrive className="w-4 h-4" />,
    },
    {
      id: 'capabilities',
      label: 'Capacidades',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'device',
      label: 'Dispositivo',
      icon: <Smartphone className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PWA Dashboard</h1>
                <p className="text-sm text-gray-500">Progressive Web App Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Status de Conexão */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">Offline</span>
                  </>
                )}
              </div>

              {/* Botão de Atualização */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Visão Geral */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Status da PWA */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-900">Instalada</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {pwaInfo.isInstalled ? 'Sim' : 'Não'}
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-900">Modo</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {pwaInfo.isStandalone ? 'Standalone' : 'Browser'}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-900">Performance</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {pwaInfo.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-900">Cache</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">
                    {formatCacheSize(totalCacheSize)}
                  </p>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {!pwaInfo.isInstalled && pwaInfo.canInstall && (
                    <button
                      onClick={installPWA}
                      className="flex items-center gap-2 p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Instalar PWA</span>
                    </button>
                  )}

                  <button
                    onClick={clearAllCache}
                    className="flex items-center gap-2 p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Limpar Cache</span>
                  </button>

                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Atualizar SW</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cache */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              {/* Estatísticas do Cache */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Uso Total</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCacheSize(totalCacheSize)}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Caches</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {cacheCount}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Uso</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {cacheUsagePercentage.toFixed(1)}%
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {isNearLimit ? 'Cheio' : 'OK'}
                  </div>
                </div>
              </div>

              {/* Detalhes do Cache */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes do Cache</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Nome</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Tamanho</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Última Modificação</th>
                        <th className="text-left p-3 text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cacheInfo.map((cache, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-3 text-sm text-gray-900">{cache.name}</td>
                          <td className="p-3 text-sm text-gray-900">
                            {cache.size ? formatCacheSize(cache.size) : 'N/A'}
                          </td>
                          <td className="p-3 text-sm text-gray-900">
                            {cache.lastModified 
                              ? new Date(cache.lastModified).toLocaleString()
                              : 'N/A'
                            }
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => clearSWCaches(cache.name)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Capacidades */}
          {activeTab === 'capabilities' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Capacidades do Navegador</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(capabilities).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    {value ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Capacidades Offline */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Capacidades Offline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(offlineCapabilities).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {value ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dispositivo */}
          {activeTab === 'device' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Informações do Dispositivo</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Agent</label>
                    <p className="text-sm text-gray-900 break-all">{deviceInfo.userAgent}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Plataforma</label>
                    <p className="text-sm text-gray-900">{deviceInfo.platform}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Idioma</label>
                    <p className="text-sm text-gray-900">{deviceInfo.language}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tipo</label>
                    <div className="flex items-center gap-2 mt-1">
                      {deviceInfo.isMobile && <Smartphone className="w-4 h-4 text-gray-500" />}
                      {deviceInfo.isTablet && <Monitor className="w-4 h-4 text-gray-500" />}
                      {deviceInfo.isDesktop && <Monitor className="w-4 h-4 text-gray-500" />}
                      <span className="text-sm text-gray-900">
                        {deviceInfo.isMobile ? 'Mobile' : 
                         deviceInfo.isTablet ? 'Tablet' : 
                         deviceInfo.isDesktop ? 'Desktop' : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hardware</label>
                    <p className="text-sm text-gray-900">
                      CPU Cores: {deviceInfo.hardwareConcurrency || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-900">
                      Memória: {deviceInfo.deviceMemory ? `${deviceInfo.deviceMemory}GB` : 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-gray-900">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PWADashboard;
