import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallButtonProps {
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Verificar se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Não mostrar se já estiver instalado
    if (isStandalone) return;

    // Verificar se o usuário já dispensou
    const dismissed = localStorage.getItem('pwa-install-dismissed-v2');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDay = 24 * 60 * 60 * 1000;
      // Mostrar novamente após 1 dia
      if (Date.now() - dismissedTime < oneDay) {
        return;
      }
    }

    // Capturar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar imediatamente se não estiver instalado
    if (isIOSDevice && !isStandalone) {
      setTimeout(() => setIsVisible(true), 2000);
    }

    // Verificar instalação
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Mostrar após 3 segundos se houver engajamento
    const timer = setTimeout(() => {
      if (!isStandalone && !dismissed) {
        setIsVisible(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // Mostrar instruções para iOS
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
      // Tentar instalação manual via menu do navegador
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed-v2', Date.now().toString());
  };

  const handleCloseInstructions = () => {
    setShowInstructions(false);
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed-v2', Date.now().toString());
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Botão Flutuante Mobile */}
      <AnimatePresence>
        {isVisible && !showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-20 left-4 right-4 z-50 md:hidden ${className}`}
          >
            <div className="bg-gray-900/95 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#00A8E1] to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-sm">
                    Instalar CineCasa
                  </h3>
                  <p className="text-gray-400 text-xs truncate">
                    Acesse mais rápido, sem navegador
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInstall}
                    className="bg-[#00A8E1] hover:bg-[#00A8E1]/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isIOS ? 'Como?' : 'Instalar'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Desktop - Navbar */}
      <AnimatePresence>
        {isVisible && !showInstructions && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleInstall}
            className={`hidden md:flex items-center gap-2 bg-[#00A8E1]/20 hover:bg-[#00A8E1]/30 border border-[#00A8E1]/50 text-[#00A8E1] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${className}`}
          >
            <Download className="w-4 h-4" />
            <span>Instalar App</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal de Instruções iOS */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:hidden"
            onClick={handleCloseInstructions}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E1] to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Instalar no iPhone/iPad
                </h3>
                <p className="text-gray-400 text-sm">
                  Siga os passos abaixo para adicionar à tela inicial
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <p className="text-white text-sm">
                    Toque no botão <strong className="text-[#00A8E1]">Compartilhar</strong> no Safari
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">2</span>
                  </div>
                  <p className="text-white text-sm">
                    Role para baixo e toque em <strong className="text-[#00A8E1]">Adicionar à Tela de Início</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-400 font-bold">3</span>
                  </div>
                  <p className="text-white text-sm">
                    Toque em <strong className="text-[#00A8E1]">Adicionar</strong> no canto superior direito
                  </p>
                </div>
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

export default PWAInstallButton;
