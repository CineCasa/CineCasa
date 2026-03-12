import { useState } from "react";

interface PWADownloadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  deviceType: 'mobile' | 'tv';
}

const PWADownloadPopup = ({ isOpen, onClose, deviceType }: PWADownloadPopupProps) => {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      // Registrar Service Worker se não estiver registrado
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado:', registration);
      }

      // Mostrar prompt de instalação PWA
      const promptEvent = (window as any).deferredPrompt;
      if (promptEvent) {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log('Resultado da instalação:', outcome);
        (window as any).deferredPrompt = null;
        
        if (outcome === 'accepted') {
          // Instalação aceita, fechar popup após 2 segundos
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        // Fallback para instalação manual
        console.log('Prompt de instalação não disponível');
        // Mostrar instruções ou redirecionar para download manual
      }
    } catch (error) {
      console.error('Erro na instalação do PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleLater = () => {
    // Salvar preferência para mostrar depois
    localStorage.setItem('pwa_install_later', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#00A8E1] to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-black italic">CINECASA</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            CineCasa Entretenimento
          </h3>
          <p className="text-gray-400 text-sm">
            {deviceType === 'mobile' 
              ? "Tenha a melhor experiência no seu celular!" 
              : "Instale na sua Smart TV!"
            }
          </p>
        </div>

        {/* Benefícios */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span>Acesso rápido sem navegador</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span>Notificações de novos conteúdos</span>
          </div>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <span>Experiência otimizada</span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full bg-gradient-to-r from-[#00A8E1] to-blue-600 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,168,225,0.3)]"
          >
            {isInstalling ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Instalando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>📥</span>
                <span>Baixar Agora</span>
              </div>
            )}
          </button>

          <button
            onClick={handleLater}
            className="w-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white font-medium py-3 rounded-xl transition-colors"
          >
            Agora Não
          </button>
        </div>

        {/* Info adicional */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Grátis • Sem anúncios • Cancelamento a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
};

export default PWADownloadPopup;
