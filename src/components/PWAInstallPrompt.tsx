import React, { useState, useEffect } from 'react';
import { Download, X, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface PWAInstallPromptProps {
  onClose: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado como PWA
    const checkPWAInstallation = () => {
      // Verificar se está rodando como PWA
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone || 
                   document.referrer.includes('android-app://');
      
      // Verificar se já foi instalado anteriormente
      const hasInstalledBefore = localStorage.getItem('pwa-installed-cinecasa');
      
      setIsInstalled(isPWA || !!hasInstalledBefore);
      
      // Mostrar popup apenas se não estiver instalado E usuário estiver logado
      if (user && !isPWA && !hasInstalledBefore) {
        // Aguardar 3 segundos após login para mostrar o popup
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    if (user) {
      const cleanup = checkPWAInstallation();
      return cleanup;
    }
  }, [user]);

  const handleInstall = async () => {
    if (!window.deferredPrompt) {
      // Fallback: tentar instalação manual
      window.open('/manifest.json', '_blank');
      return;
    }

    try {
      setIsInstalling(true);
      
      // Mostrar prompt de instalação nativo
      const result = await window.deferredPrompt.prompt();
      
      if (result.outcome === 'accepted') {
        // Marcar como instalado
        localStorage.setItem('pwa-installed-cinecasa', 'true');
        setIsInstalled(true);
        setShowSuccess(true);
        
        // Esconder popup após sucesso
        setTimeout(() => {
          setIsVisible(false);
          onClose();
        }, 2000);
      } else {
        // Usuário recusou instalação
        localStorage.setItem('pwa-installed-cinecasa', 'declined');
        setIsVisible(false);
        onClose();
      }
      
      setIsInstalling(false);
      window.deferredPrompt = null;
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    // Marcar que usuário recusou (NÃO instalar por agora)
    localStorage.setItem('pwa-installed-cinecasa', 'dismissed');
    setIsVisible(false);
    onClose();
  };

  const handleLater = () => {
    // Usuário quer instalar depois
    setIsVisible(false);
    onClose();
  };

  // Não mostrar se já está instalado ou se não há usuário logado
  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-cyan-500/20">
        {/* Header com logo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src="/logo.png" 
                alt="CineCasa" 
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Instalar CineCasa</h3>
              <p className="text-gray-400 text-sm">Acesso rápido e offline</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo principal */}
        {showSuccess ? (
          <div className="text-center py-4">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h4 className="text-white font-semibold text-lg mb-2">Instalado com Sucesso!</h4>
            <p className="text-gray-400">CineCasa foi adicionado ao seu dispositivo</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Smartphone className="w-12 h-12 text-cyan-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-1">Acesso Rápido</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Instale o CineCasa no seu dispositivo para:
                </p>
                <ul className="text-gray-300 text-sm mt-2 space-y-1">
                  <li>• Acesso instantâneo pela tela inicial</li>
                  <li>• Funcionamento offline</li>
                  <li>• Notificações push nativas</li>
                  <li>• Experiência de app nativo</li>
                </ul>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                    <span>Instalando...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Instalar Agora</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleLater}
                disabled={isInstalling}
                className="px-6 py-3 rounded-xl font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Depois
              </button>
            </div>
          </>
        )}

        {/* Footer informativo */}
        {!showSuccess && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-500 text-xs text-center">
              Você pode fechar esta janela. O CineCasa já está disponível na sua tela inicial.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
