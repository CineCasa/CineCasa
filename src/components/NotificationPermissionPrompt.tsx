import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationPermissionPromptProps {
  onClose: () => void;
}

export const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({ onClose }) => {
  const { permission, requestPermission } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Mostrar prompt apenas se permissão ainda não foi solicitada/denegada
    if (permission === 'default' && !isVisible) {
      // Aguardar um pouco antes de mostrar
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [permission, isVisible]);

  const handleAllow = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        setIsVisible(false);
        onClose();
      }
    } catch (error) {
      console.error('[NotificationPrompt] Erro ao solicitar permissão:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDeny = () => {
    setIsVisible(false);
    onClose();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-auto shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Ativar Notificações</h3>
              <p className="text-gray-400 text-sm">Receba alertas de novos conteúdos</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-gray-300 text-sm leading-relaxed">
              <p className="mb-2">
                <strong className="text-white">Fique por dentro de tudo novo!</strong>
              </p>
              <p>
                Receba notificações quando novos filmes e séries forem adicionados à plataforma, 
                além de lembretes de continuar assistindo e recomendações personalizadas.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <h4 className="text-white font-medium mb-3">Você receberá:</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Novos lançamentos de filmes e séries</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Conteúdos recomendados para você</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span>Lembretes para continuar assistindo</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>Atualizações dos seus favoritos</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-700">
          <button
            onClick={handleDeny}
            disabled={isRequesting}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Agora não
          </button>
          <button
            onClick={handleAllow}
            disabled={isRequesting}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
          >
            {isRequesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Solicitando...</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                <span>Ativar Notificações</span>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 text-center pt-3 border-t border-gray-800">
          <p>Você pode alterar essa configuração a qualquer momento nas configurações do navegador.</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
