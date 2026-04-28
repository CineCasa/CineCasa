import { useCallback, useEffect, useRef, useState } from 'react';
import { deviceService, type UserDevice } from '@/services/DeviceService';
import { getOrCreateDeviceId } from '@/utils/deviceFingerprint';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface UseDeviceManagementReturn {
  devices: UserDevice[];
  currentDeviceId: string;
  isLoading: boolean;
  error: string | null;
  refreshDevices: () => Promise<void>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  logoutOtherDevices: () => Promise<number>;
  isCurrentDevice: (deviceId: string) => boolean;
}

export function useDeviceManagement(): UseDeviceManagementReturn {
  const { user } = useAuth();
  const userId = user?.id;
  const currentDeviceId = getOrCreateDeviceId();
  
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isFetching = useRef(false);
  const initialFetchDone = useRef(false);

  const fetchDevices = useCallback(async () => {
    if (!userId || isFetching.current) return;
    
    isFetching.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      const { devices: data, error: err } = await deviceService.getUserDevices(userId);
      
      if (err) {
        setError(err);
        console.error('[useDeviceManagement] Erro:', err);
      } else {
        setDevices(data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [userId]);

  // Fetch inicial
  useEffect(() => {
    if (userId && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchDevices();
    }
  }, [userId, fetchDevices]);

  // Refresh periódico a cada 2 minutos
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      fetchDevices();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [userId, fetchDevices]);

  const removeDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    if (!userId) return false;
    
    const success = await deviceService.removeDevice(deviceId, userId);
    
    if (success) {
      setDevices(prev => prev.filter(d => d.device_id !== deviceId));
      toast.success('Dispositivo removido com sucesso');
    } else {
      toast.error('Erro ao remover dispositivo');
    }
    
    return success;
  }, [userId]);

  const logoutOtherDevices = useCallback(async (): Promise<number> => {
    if (!userId) return 0;
    
    const count = await deviceService.logoutOtherDevices(currentDeviceId, userId);
    
    if (count > 0) {
      toast.success(`${count} dispositivo(s) desconectado(s)`);
      await fetchDevices(); // Refresh
    } else {
      toast.info('Nenhum outro dispositivo para desconectar');
    }
    
    return count;
  }, [userId, currentDeviceId, fetchDevices]);

  const isCurrentDevice = useCallback((deviceId: string): boolean => {
    return deviceId === currentDeviceId;
  }, [currentDeviceId]);

  return {
    devices,
    currentDeviceId,
    isLoading,
    error,
    refreshDevices: fetchDevices,
    removeDevice,
    logoutOtherDevices,
    isCurrentDevice,
  };
}

export default useDeviceManagement;
