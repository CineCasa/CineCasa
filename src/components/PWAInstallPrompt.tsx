import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  className?: string;
  showOnInstallable?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  delay?: number;
}

const PWAInstallPrompt = ({
  className = '',
  position = 'bottom-right',
  delay = 5000,
}: PWAInstallPromptProps) => {
  const { pwaInfo, installPWA } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Mostrar prompt após delay
  useEffect(() => {
    if (!pwaInfo.canInstall || pwaInfo.isInstalled) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [pwaInfo.canInstall, pwaInfo.isInstalled, delay]);

  // Handler para instalação
  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const result = await installPWA();
      
      if (result) {
        console.log('[PWA] Instalação iniciada');
        setIsVisible(false);
      } else {
        // Fallback: tentar usar o prompt do navegador diretamente
        const deferredPrompt = (window as any).deferredPrompt;
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            console.log('[PWA] Instalação aceita');
            setIsVisible(false);
          }
        }
      }
    } catch (error) {
      console.error('[PWA] Erro na instalação:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Handler para dispensar
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-dismiss-time', Date.now().toString());
  };

  // Posicionamento do prompt
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-[9999] p-5 rounded-2xl shadow-2xl bg-gradient-to-br from-gray-900 to-black border border-[#00A8E1]/30 max-w-sm transition-all duration-300';
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'center':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  // Não mostrar se já estiver instalado ou não for instalável
  if (!isVisible || pwaInfo.isInstalled || !pwaInfo.canInstall) {
    return null;
  }

  return (
    <div className={getPositionClasses()}>
      {/* Botão fechar */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      {/* Logo CineCasa */}
      <div className="flex justify-center mb-4">
        <img 
          src="/logo.png" 
          alt="CineCasa" 
          className="w-16 h-16 object-contain drop-shadow-lg"
        />
      </div>

      {/* Mensagem */}
      <p className="text-center text-white text-sm mb-5 leading-relaxed">
        Notamos que você está gostando do CineCasa, instale nosso aplicativo para uma melhor experiência!
      </p>

      {/* Botão Instalar */}
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className="w-full flex items-center justify-center gap-2 bg-[#00A8E1] hover:bg-[#00A8E1]/80 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00A8E1]/25"
      >
        <Download className="w-5 h-5" />
        {isInstalling ? 'Instalando...' : 'Instalar App'}
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
