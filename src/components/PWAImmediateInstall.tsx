import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Smartphone, Monitor, CheckCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAImmediateInstallProps {
  className?: string;
}

export const PWAImmediateInstall: React.FC<PWAImmediateInstallProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Detectar tipo de dispositivo
    const ua = navigator.userAgent.toLowerCase();
    let detectedDevice: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown';
    
    if (/iphone|ipad|ipod/.test(ua)) {
      detectedDevice = 'ios';
    } else if (/android/.test(ua)) {
      detectedDevice = 'android';
    } else if (/windows|mac|linux/.test(ua)) {
      detectedDevice = 'desktop';
    }
    setDeviceType(detectedDevice);

    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Não mostrar se já estiver instalado
    if (isStandalone) return;

    // Verificar se o usuário já dispensou permanentemente
    const permanentlyDismissed = localStorage.getItem('pwa-install-permanently-dismissed');
    if (permanentlyDismissed === 'true') return;

    // Verificar se o usuário dispensou nas últimas 24 horas
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) return;
    }

    // MOSTRAR IMEDIATAMENTE ao abrir o sistema
    // Pequeno delay para garantir que a página carregou
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    // Capturar evento beforeinstallprompt (para Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verificar instalação
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(showTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deviceType === 'ios') {
      setShowInstructions(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsVisible(false);
      }
      
      setDeferredPrompt(null);
    } else {
      // Para desktop ou quando o prompt não está disponível
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  const handleNeverAskAgain = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-permanently-dismissed', 'true');
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  if (isInstalled) return null;

  const getDeviceInstructions = () => {
    switch (deviceType) {
      case 'ios':
        return {
          title: 'Instalar no iPhone/iPad',
          icon: <Share2 className="w-8 h-8 text-white" />,
          steps: [
            'Toque no botão Compartilhar no Safari',
            'Role para baixo e toque em "Adicionar à Tela de Início"',
            'Toque em "Adicionar" para confirmar',
          ]
        };
      case 'android':
        return {
          title: 'Instalar no Android',
          icon: <Smartphone className="w-8 h-8 text-white" />,
          steps: [
            'Toque no menu (3 pontos) no Chrome',
            'Selecione "Adicionar à tela inicial"',
            'Toque em "Adicionar" ou "Instalar"',
          ]
        };
      default:
        return {
          title: 'Instalar Aplicativo',
          icon: <Monitor className="w-8 h-8 text-white" />,
          steps: [
            'Clique no ícone de instalação na barra de endereço',
            'Ou use o menu do navegador (⋮)',
            'Selecione "Instalar CineCasa"',
          ]
        };
    }
  };

  const instructions = getDeviceInstructions();

  return (
    <>
      {/* POPUP PRINCIPAL - MOSTRA IMEDIATAMENTE */}
      <AnimatePresence>
        {isVisible && !showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER COM LOGO */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#00A8E1] to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#00A8E1]/30">
                  <img 
                    src="/logo.png" 
                    alt="CineCasa" 
                    className="w-14 h-14 object-contain"
                    onError={(e) => {
                      // Fallback se o logo não carregar
                      const target = e.target as HTMLImageElement;
                      target.src = '/logo.png'; // Fallback para logo padrão
                    }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Baixar CineCasa
                </h3>
                <p className="text-gray-400 text-sm">
                  Instale o aplicativo para uma experiência completa!
                </p>
              </div>

              {/* BENEFÍCIOS */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span>Acesso rápido pela tela inicial</span>
                </div>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span>Assista offline (conteúdo baixado)</span>
                </div>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span>Notificações de novidades</span>
                </div>
                <div className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <span>Interface otimizada para sua tela</span>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="space-y-3">
                <button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-[#00A8E1] to-blue-600 hover:from-[#00A8E1]/90 hover:to-blue-600/90 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(0,168,225,0.3)] flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar Agora</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white font-medium py-3 rounded-xl transition-colors text-sm"
                  >
                    Depois
                  </button>
                  <button
                    onClick={handleNeverAskAgain}
                    className="px-4 text-gray-500 hover:text-gray-400 transition-colors"
                    title="Não perguntar novamente"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* INFO ADICIONAL */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Grátis • Sem anúncios • Funciona em todos os dispositivos
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE INSTRUÇÕES */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={handleCloseInstructions}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E1] to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {instructions.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {instructions.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  Siga os passos abaixo para instalar
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <div className="w-8 h-8 bg-[#00A8E1]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00A8E1] font-bold text-sm">{index + 1}</span>
                    </div>
                    <p className="text-white text-sm">{step}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleCloseInstructions}
                className="w-full bg-[#00A8E1] hover:bg-[#00A8E1]/80 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PWAImmediateInstall;
