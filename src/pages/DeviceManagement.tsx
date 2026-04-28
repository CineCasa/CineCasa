import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Smartphone, Tv, Trash2, LogOut, RefreshCw, CheckCircle, AlertTriangle, Loader2, ChevronLeft, Laptop } from 'lucide-react';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { UserDevice } from '@/services/DeviceService';
import type { DeviceType } from '@/utils/deviceFingerprint';

const getDeviceIcon = (type: DeviceType) => {
  switch (type) {
    case 'tv': return <Tv className="h-5 w-5" />;
    case 'mobile': return <Smartphone className="h-5 w-5" />;
    default: return <Monitor className="h-5 w-5" />;
  }
};

const getDeviceTypeLabel = (type: DeviceType) => {
  switch (type) {
    case 'tv': return 'Smart TV';
    case 'mobile': return 'Mobile';
    default: return 'Computador';
  }
};

export default function DeviceManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { devices, isLoading, error, refreshDevices, removeDevice, logoutOtherDevices, isCurrentDevice } = useDeviceManagement();
  const [deviceToRemove, setDeviceToRemove] = useState<UserDevice | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

  const handleRemove = async () => {
    if (!deviceToRemove) return;
    setIsRemoving(true);
    await removeDevice(deviceToRemove.device_id);
    setIsRemoving(false);
    setDeviceToRemove(null);
  };

  const handleLogoutOthers = async () => {
    setIsLoggingOutOthers(true);
    await logoutOtherDevices();
    setIsLoggingOutOthers(false);
  };

  const otherDevicesCount = devices.filter(d => !isCurrentDevice(d.device_id)).length;
  const currentDevice = devices.find(d => isCurrentDevice(d.device_id));
  const otherDevices = devices.filter(d => !isCurrentDevice(d.device_id));

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Card className="bg-[#1a1a1f] border-white/10">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">Faça login para gerenciar dispositivos</p>
            <Button onClick={() => navigate('/login')} className="mt-4">Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Gerenciar Dispositivos</h1>
            <p className="text-gray-400 text-sm">Controle onde sua conta está conectada</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="outline" onClick={refreshDevices} disabled={isLoading} className="bg-transparent border-white/20 text-white hover:bg-white/10">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {otherDevicesCount > 0 && (
            <Button variant="destructive" onClick={handleLogoutOthers} disabled={isLoggingOutOthers} className="bg-red-600 hover:bg-red-700">
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOutOthers ? 'Desconectando...' : `Desconectar outros (${otherDevicesCount})`}
            </Button>
          )}
        </div>

        {error && (
          <Card className="mb-6 bg-red-900/20 border-red-500/30">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}

        {currentDevice && (
          <Card className="mb-6 bg-green-900/10 border-green-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <CardTitle className="text-white text-lg">Dispositivo Atual</CardTitle>
              </div>
              <CardDescription className="text-gray-400">Você está usando este dispositivo agora</CardDescription>
            </CardHeader>
            <CardContent><DeviceCard device={currentDevice} isCurrent /></CardContent>
          </Card>
        )}

        <Card className="bg-[#1a1a1f] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Outros Dispositivos</CardTitle>
            <CardDescription className="text-gray-400">
              {otherDevicesCount === 0 ? 'Nenhum outro dispositivo conectado' : `${otherDevicesCount} dispositivo(s) conectado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : otherDevices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Laptop className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Seus outros dispositivos aparecerão aqui</p>
              </div>
            ) : (
              otherDevices.map(device => <DeviceCard key={device.id} device={device} onRemove={() => setDeviceToRemove(device)} />)
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deviceToRemove} onOpenChange={() => setDeviceToRemove(null)}>
        <DialogContent className="bg-[#1a1a1f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Remover Dispositivo</DialogTitle>
            <DialogDescription className="text-gray-400">
              Remover <strong>{deviceToRemove?.device_name}</strong>? O usuário será desconectado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setDeviceToRemove(null)} className="bg-transparent border-white/20">Cancelar</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isRemoving} className="bg-red-600 hover:bg-red-700">
              {isRemoving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Removendo...</> : <><Trash2 className="h-4 w-4 mr-2" />Remover</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeviceCard({ device, isCurrent = false, onRemove }: { device: UserDevice; isCurrent?: boolean; onRemove?: () => void }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg ${isCurrent ? 'bg-green-500/10' : 'bg-[#0f0f12]'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${isCurrent ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
          {getDeviceIcon(device.device_type)}
        </div>
        <div>
          <h3 className="text-white font-medium">{device.device_name}</h3>
          <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-400">
            <span>{getDeviceTypeLabel(device.device_type)}</span>
            {device.os && <span className="text-gray-600">• {device.os}</span>}
            {device.browser && <span className="text-gray-600">• {device.browser}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Ativo {new Date(device.last_active).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-gray-400 hover:text-red-400 hover:bg-red-500/20">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
