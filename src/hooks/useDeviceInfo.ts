import { useState, useEffect } from 'react';

/**
 * Hook para obter o IP local do servidor em tempo real
 * Útil para compartilhar URLs com dispositivos móveis/Smart TV
 */
export const useServerIP = () => {
  const [serverIP, setServerIP] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const detectIP = async () => {
      try {
        // Método 1: Detectar pelo hostname/location
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          // Se em localhost, tentar descobrir IPs locais via API pública
          try {
            const response = await fetch('https://api.ipify.org?format=json', {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            // Isso dá IP público, não local. Vamos usar uma abordagem melhor.
          } catch (e) {
            // Se falhar, usar localhost
            setServerIP('localhost:5173');
          }
        } else if (hostname.includes('192.168') || hostname.includes('172.')) {
          // Se já é IP local, usar diretamente
          const port = window.location.port || '5173';
          setServerIP(`${hostname}:${port}`);
        } else {
          // Fallback para o hostname normal
          const port = window.location.port || '5173';
          setServerIP(`${hostname}:${port}`);
        }
      } catch (error) {
        console.error('Erro ao detectar IP:', error);
        setServerIP('localhost:5173');
      } finally {
        setIsLoading(false);
      }
    };

    detectIP();
  }, []);

  return { serverIP, isLoading };
};

/**
 * Hook para verificar se é dispositivo móvel
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /iPhone|iPad|iPod|Android|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

/**
 * Hook para obter a altura do banner ajustada para mobile
 */
export const useBannerHeight = () => {
  const isMobile = useIsMobile();
  
  // Reduz 60px em mobile (60vh - 60px = calc(60vh - 60px))
  // Mantém proporções em telas maiores
  const mobileHeight = 'h-[calc(60vh-60px)]';
  const desktopHeight = 'h-[60vh]';
  
  return isMobile ? mobileHeight : desktopHeight;
};
