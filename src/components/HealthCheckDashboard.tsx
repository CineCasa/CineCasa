import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Activity,
  Server,
  Database,
  Wifi,
  Shield,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  responseTime?: number;
  lastCheck: string;
  details?: string;
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    uptime?: number;
  };
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  uptime: number;
  requests: {
    total: number;
    success: number;
    error: number;
  };
}

export function HealthCheckDashboard() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<HealthCheck | null>(null);

  // Buscar dados de health check
  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/health/dashboard');
      const data = await response.json();
      
      setHealthChecks(data.checks || []);
      setSystemMetrics(data.metrics || null);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar dados de health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHealthData, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Buscar dados iniciais
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Obter cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'unhealthy': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Obter ícone baseado no status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'unhealthy': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  // Obter ícone para tipo de check
  const getCheckIcon = (name: string) => {
    if (name.includes('API') || name.includes('Application')) return <Server className="w-4 h-4" />;
    if (name.includes('Database')) return <Database className="w-4 h-4" />;
    if (name.includes('Redis') || name.includes('Cache')) return <Activity className="w-4 h-4" />;
    if (name.includes('Network') || name.includes('SSL')) return <Wifi className="w-4 h-4" />;
    if (name.includes('Security')) return <Shield className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  // Formatar tempo
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  // Formatar uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calcular status geral
  const getOverallStatus = () => {
    if (healthChecks.length === 0) return 'unknown';
    
    const hasUnhealthy = healthChecks.some(check => check.status === 'unhealthy');
    const hasWarning = healthChecks.some(check => check.status === 'warning');
    
    if (hasUnhealthy) return 'unhealthy';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  const overallStatus = getOverallStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando informações de saúde...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStatusColor(overallStatus)}`}>
                {getStatusIcon(overallStatus)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Health Check Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Status geral: <span className="font-medium">{overallStatus}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Última atualização</p>
                <p className="text-sm font-medium text-gray-900">
                  {lastUpdate.toLocaleTimeString('pt-BR')}
                </p>
              </div>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              
              <button
                onClick={fetchHealthData}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* System Metrics */}
        {systemMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">CPU</span>
                <Activity className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {systemMetrics.cpu.toFixed(1)}%
                </div>
                {systemMetrics.cpu > 80 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Memória</span>
                <Database className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {systemMetrics.memory.toFixed(1)}%
                </div>
                {systemMetrics.memory > 85 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Disco</span>
                <Server className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {systemMetrics.disk.toFixed(1)}%
                </div>
                {systemMetrics.disk > 90 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Uptime</span>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatUptime(systemMetrics.uptime)}
              </div>
            </div>
          </div>
        )}

        {/* Health Checks */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Health Checks</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {healthChecks.map((check, index) => (
              <div 
                key={index}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedCheck(check)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(check.status)}`}>
                      {getCheckIcon(check.name)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{check.name}</h3>
                      <p className="text-sm text-gray-500">
                        Última verificação: {formatTime(check.lastCheck)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {check.responseTime && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Response Time</p>
                        <p className="text-sm font-medium text-gray-900">
                          {check.responseTime}ms
                        </p>
                      </div>
                    )}
                    
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(check.status)}`}>
                      {getStatusIcon(check.status)}
                      <span>{check.status}</span>
                    </div>
                  </div>
                </div>
                
                {check.details && (
                  <div className="mt-3 text-sm text-gray-600">
                    {check.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Detalhes */}
        {selectedCheck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCheck.name} - Detalhes
                  </h3>
                  <button
                    onClick={() => setSelectedCheck(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCheck.status)}`}>
                      {getStatusIcon(selectedCheck.status)}
                      <span>{selectedCheck.status}</span>
                    </div>
                  </div>
                  
                  {selectedCheck.responseTime && (
                    <div>
                      <p className="text-sm text-gray-500">Response Time</p>
                      <p className="text-lg font-medium text-gray-900">
                        {selectedCheck.responseTime}ms
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Última Verificação</p>
                  <p className="text-gray-900">{formatTime(selectedCheck.lastCheck)}</p>
                </div>
                
                {selectedCheck.details && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Detalhes</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedCheck.details}
                      </pre>
                    </div>
                  </div>
                )}
                
                {selectedCheck.metrics && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Métricas</p>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCheck.metrics.cpu && (
                        <div>
                          <p className="text-sm text-gray-500">CPU</p>
                          <p className="text-lg font-medium text-gray-900">
                            {selectedCheck.metrics.cpu.toFixed(1)}%
                          </p>
                        </div>
                      )}
                      
                      {selectedCheck.metrics.memory && (
                        <div>
                          <p className="text-sm text-gray-500">Memória</p>
                          <p className="text-lg font-medium text-gray-900">
                            {selectedCheck.metrics.memory.toFixed(1)}%
                          </p>
                        </div>
                      )}
                      
                      {selectedCheck.metrics.disk && (
                        <div>
                          <p className="text-sm text-gray-500">Disco</p>
                          <p className="text-lg font-medium text-gray-900">
                            {selectedCheck.metrics.disk.toFixed(1)}%
                          </p>
                        </div>
                      )}
                      
                      {selectedCheck.metrics.uptime && (
                        <div>
                          <p className="text-sm text-gray-500">Uptime</p>
                          <p className="text-lg font-medium text-gray-900">
                            {formatUptime(selectedCheck.metrics.uptime)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthCheckDashboard;
