import React, { useState, useEffect } from 'react';
import { X, Download, Wifi, WifiOff, Smartphone, Monitor, CheckCircle, Share2, Play, Heart } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  className?: string;
  showOnInstallable?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  autoHide?: boolean;
  delay?: number;
  smartTrigger?: boolean;
}

const PWAInstallPrompt = ({
  className = '',
  showOnInstallable = true,
  position = 'bottom-right',
  autoHide = true,
  delay = 5000,
  smartTrigger = true,
}: PWAInstallPromptProps) => {
  const { pwaInfo, installPWA, hideInstallPrompt, addToHomeScreen, shareContent } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  const [triggerReason, setTriggerReason] = useState<string>('');
  const [showBenefits, setShowBenefits] = useState(true);
  const [dismissCount, setDismissCount] = useState(0);

  // Detectar informações do dispositivo
  useEffect(() => {
    setUserAgent(navigator.userAgent);
    
    // Recuperar contador de dispensas
    const savedDismissCount = parseInt(localStorage.getItem('pwa-dismiss-count') || '0');
    setDismissCount(savedDismissCount);
  }, []);

  // Gatilhos inteligentes para mostrar o prompt
  useEffect(() => {
    if (!pwaInfo.canInstall || pwaInfo.isInstalled) return;

    const triggers = {
      // Gatilho baseado no tempo
      time: () => {
        const timer = setTimeout(() => {
          setTriggerReason('time');
          setIsVisible(true);
        }, delay);
        return timer;
      },
      
      // Gatilho baseado em engajamento
      engagement: () => {
        let sessionTime = 0;
        let pageViews = 0;
        
        const incrementTime = () => sessionTime += 1000;
        const trackPageView = () => pageViews += 1;
        
        const timeInterval = setInterval(incrementTime, 1000);
        
        // Track page views
        const observer = new MutationObserver(() => trackPageView());
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Mostrar após 2 minutos E 3 page views
        const checkTrigger = () => {
          if (sessionTime >= 120 && pageViews >= 3) {
            setTriggerReason('engagement');
            setIsVisible(true);
            clearInterval(timeInterval);
            observer.disconnect();
          }
        };
        
        const triggerInterval = setInterval(checkTrigger, 5000);
        
        return () => {
          clearInterval(timeInterval);
          clearInterval(triggerInterval);
          observer.disconnect();
        };
      },
      
      // Gatilho baseado em favoritos
      favorites: () => {
        const checkFavorites = () => {
          const favorites = localStorage.getItem('paixaofavs');
          if (favorites) {
            const favCount = JSON.parse(favorites).length;
            if (favCount >= 3) {
              setTriggerReason('favorites');
              setIsVisible(true);
            }
          }
        };
        
        // Verificar a cada 30 segundos
        const interval = setInterval(checkFavorites, 30000);
        return interval;
      },
      
      // Gatilho baseado em compartilhamento
      share: () => {
        const handleShareAttempt = () => {
          setTriggerReason('share');
          setIsVisible(true);
        };
        
        document.addEventListener('shareattempt', handleShareAttempt);
        return () => {
          document.removeEventListener('shareattempt', handleShareAttempt);
        };
      },
    };

    const cleanupFunctions: (() => void)[] = [];

    // Gatilho baseado no tempo (sempre ativo)
    if (showOnInstallable) {
      cleanupFunctions.push(triggers.time());
    }

    // Gatilhos inteligentes
    if (smartTrigger) {
      cleanupFunctions.push(triggers.engagement());
      cleanupFunctions.push(triggers.favorites());
      cleanupFunctions.push(triggers.share());
    }

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [pwaInfo.canInstall, pwaInfo.isInstalled, showOnInstallable, smartTrigger, delay]);

  // Auto-esconder após instalação
  useEffect(() => {
    if (pwaInfo.isInstalled && autoHide) {
      setIsVisible(false);
    }
  }, [pwaInfo.isInstalled, autoHide]);

  // Detectar tipo de dispositivo
  const getDeviceType = () => {
    const ua = userAgent.toLowerCase();
    
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (/windows/i.test(ua)) return 'windows';
    if (/mac/i.test(ua)) return 'mac';
    if (/linux/i.test(ua)) return 'linux';
    
    return 'unknown';
  };

  const deviceType = getDeviceType();
  const isMobile = /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());

  // Instalar PWA
  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      const success = await installPWA();
      if (success) {
        setIsVisible(false);
        setShowInstructions(false);
        
        // Analytics de instalação
        if ('gtag' in window) {
          (window as any).gtag('event', 'pwa_install', {
            device_type: deviceType,
            trigger_reason: triggerReason,
            dismiss_count: dismissCount,
          });
        }
      }
    } catch (error) {
      console.error('Erro na instalação:', error);
      setShowInstructions(true);
    } finally {
      setIsInstalling(false);
    }
  };

  // Dispensar prompt
  const handleDismiss = () => {
    setIsVisible(false);
    
    // Incrementar contador de dispensas
    const newCount = dismissCount + 1;
    setDismissCount(newCount);
    localStorage.setItem('pwa-dismiss-count', newCount.toString());
    
    // Salvar timestamp para não mostrar por um tempo
    const now = Date.now();
    localStorage.setItem('pwa-install-dismissed', now.toString());
    
    // Analytics de dispensa
    if ('gtag' in window) {
      (window as any).gtag('event', 'pwa_dismiss', {
        device_type: deviceType,
        trigger_reason: triggerReason,
        dismiss_count: newCount,
      });
    }
  };

  // Obter instruções específicas do dispositivo
  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'android':
        return {
          title: 'Como instalar no Android',
          steps: [
            '1. Toque no botão "Instalar" acima',
            '2. Confirme a instalação na janela que aparecer',
            '3. Aguarde o download completar',
            '4. Encontre o ícone do CineCasa na sua tela inicial',
          ],
          icon: <Smartphone className="w-6 h-6" />,
        };
      
      case 'ios':
        return {
          title: 'Como instalar no iOS',
          steps: [
            '1. Toque no ícone de compartilhamento (⎋)',
            '2. Role para baixo e toque em "Adicionar à Tela Inicial"',
            '3. Toque em "Adicionar" para confirmar',
            '4. Encontre o ícone do CineCasa na sua tela inicial',
          ],
          icon: <Smartphone className="w-6 h-6" />,
        };
      
      case 'desktop':
        return {
          title: 'Como instalar no Desktop',
          steps: [
            '1. Clique no botão "Instalar" acima',
            '2. Confirme a instalação na janela que aparecer',
            '3. Aguarde o download completar',
            '4. O aplicativo será instalado no seu computador',
          ],
          icon: <Monitor className="w-6 h-6" />,
        };
      
      default:
        return {
          title: 'Como instalar',
          steps: [
            '1. Clique no botão "Instalar" acima',
            '2. Siga as instruções do seu dispositivo',
            '3. Aguarde a instalação completar',
          ],
          icon: <Download className="w-6 h-6" />,
        };
    }
  };

  const instructions = getInstallInstructions();

  // Obter mensagem personalizada baseada no gatilho
  const getTriggerMessage = () => {
    switch (triggerReason) {
      case 'engagement':
        return 'Notamos que você está gostando do CineCasa! Instale para uma experiência melhor.';
      case 'favorites':
        return 'Você tem vários favoritos! Instale para acessá-los rapidamente.';
      case 'share':
        return 'Quer compartilhar? Instale o app para compartilhar mais facilmente!';
      case 'time':
        return 'Use o CineCasa offline! Instale nosso aplicativo.';
      default:
        return 'Instale nosso aplicativo para uma experiência melhor e acesso rápido!';
    }
  };

  // Posicionamento do prompt
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 p-4 rounded-2xl shadow-2xl border border-gray-200 bg-white max-w-sm transition-all duration-300';
    
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
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Instalar CineCasa</h3>
            <p className="text-xs text-gray-500">A melhor experiência de streaming</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Conteúdo Principal */}
      {!showInstructions ? (
        <div className="space-y-4">
          {/* Status de Conexão */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            {pwaInfo.isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-700">Offline</span>
              </>
            )}
          </div>

          {/* Mensagem Personalizada */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">{getTriggerMessage()}</p>
          </div>

          {/* Benefícios */}
          {showBenefits && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Benefícios:</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Acesso rápido pela tela inicial</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Funciona offline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Notificações push</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Interface nativa</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span>Compartilhamento fácil</span>
                </li>
              </ul>
            </div>
          )}

          {/* Botão de Instalação */}
          <button
            onClick={handleInstall}
            disabled={isInstalling || !pwaInfo.isOnline}
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isInstalling ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Instalando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Instalar Agora</span>
              </>
            )}
          </button>

          {/* Links de Ação */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowBenefits(!showBenefits)}
              className="flex-1 text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showBenefits ? 'Ocultar' : 'Ver'} benefícios
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="flex-1 text-center text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Como instalar manualmente →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Instruções Específicas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              {instructions.icon}
              <h4 className="font-semibold text-gray-900">{instructions.title}</h4>
            </div>
            
            <div className="space-y-2">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Informações do Dispositivo */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Dispositivo detectado:</strong> {deviceType}
              {!pwaInfo.isOnline && (
                <span className="block mt-1 text-red-600">
                  ⚠️ Você está offline. Conecte-se à internet para instalar.
                </span>
              )}
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowInstructions(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling || !pwaInfo.isOnline}
              className="flex-1 bg-primary text-white py-2 px-3 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Instalando...</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>Tentar Novamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAInstallPrompt;
