import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeviceAccessProps {
  children: React.ReactNode;
}

const DeviceAccessManager = ({ children }: DeviceAccessProps) => {
  const { user, session, plan } = useAuth();

  useEffect(() => {
    if (!user || !session) return;

    const checkDeviceAccess = async () => {
      try {
        // Gerar fingerprint do dispositivo
        const fingerprint = await generateDeviceFingerprint();
        
        // Obter IP do usuário
        const ipAddress = await getUserIP();

        // Verificar limites do plano
        const limits = {
          basic: { maxDevices: 1, maxIPs: 1 },
          pro: { maxDevices: 2, maxIPs: 2 }
        };

        const currentLimits = limits[plan as keyof typeof limits] || limits.basic;

        // Usar SQL direto para evitar problemas de tipos
        const { data: devices, error } = await supabase
          .rpc('get_user_devices', { user_id_param: user.id });

        if (error) {
          console.error('Error checking devices:', error);
          return;
        }

        // Verificar se dispositivo já existe
        const deviceExists = devices?.some((device: any) => 
          device.device_fingerprint === fingerprint
        );

        if (!deviceExists) {
          // Contar dispositivos únicos
          const uniqueDevices = new Set(devices?.map((d: any) => d.device_fingerprint));
          const uniqueIPs = new Set(devices?.map((d: any) => d.ip_address));

          // Verificar limites
          if (uniqueDevices.size >= currentLimits.maxDevices) {
            toast.error(`Limite de dispositivos atingido. Plano ${plan} permite máximo ${currentLimits.maxDevices} dispositivo(s).`);
            await supabase.auth.signOut();
            return;
          }

          if (!uniqueIPs.has(ipAddress) && uniqueIPs.size >= currentLimits.maxIPs) {
            toast.error(`Limite de endereços IP atingido. Plano ${plan} permite máximo ${currentLimits.maxIPs} endereço(s) IP.`);
            await supabase.auth.signOut();
            return;
          }

          // Registrar novo dispositivo
          await registerNewDevice(user.id, fingerprint, ipAddress, navigator.userAgent);
        } else {
          // Atualizar última atividade
          await updateDeviceActivity(fingerprint);
        }

      } catch (error) {
        console.error('Error in device access check:', error);
      }
    };

    // Executar verificação inicial
    checkDeviceAccess();

    // Configurar verificação periódica
    const interval = setInterval(checkDeviceAccess, 5 * 60 * 1000); // A cada 5 minutos

    return () => clearInterval(interval);
  }, [user, session, plan]);

  // Funções auxiliares
  const generateDeviceFingerprint = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas ? canvas.toDataURL() : '',
    };
    
    return btoa(JSON.stringify(fingerprint));
  };

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  };

  const registerNewDevice = async (userId: string, fingerprint: string, ipAddress: string, userAgent: string) => {
    try {
      const { error } = await supabase
        .rpc('register_device_session_simple', {
          user_id_param: userId,
          device_fingerprint: fingerprint,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (error) {
        console.error('Error registering device:', error);
      } else {
        toast.success('Dispositivo registrado com sucesso');
      }
    } catch (error) {
      console.error('Error in registerNewDevice:', error);
    }
  };

  const updateDeviceActivity = async (fingerprint: string) => {
    try {
      // Buscar sessão pelo fingerprint
      const { data: sessions } = await supabase
        .rpc('get_user_devices', { user_id_param: user?.id });

      const currentSession = sessions?.find((s: any) => s.device_fingerprint === fingerprint);
      
      if (currentSession) {
        const { error } = await supabase
          .rpc('update_device_activity', { session_id_param: currentSession.id });

        if (error) {
          console.error('Error updating activity:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateDeviceActivity:', error);
    }
  };

  return <>{children}</>;
};

export default DeviceAccessManager;
