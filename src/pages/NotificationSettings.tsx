import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Tv, Sparkles, Play, AlertTriangle, Check, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    preferences,
    subscribe,
    unsubscribe,
    savePreferences,
    sendLocalNotification,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    await subscribe();
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    await unsubscribe();
    setIsLoading(false);
  };

  const handleTogglePreference = async (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    await savePreferences(newPreferences);
  };

  const handleTestNotification = async () => {
    const success = await sendLocalNotification({
      title: 'CineCasa',
      body: 'Esta é uma notificação de teste! 🎬',
      icon: '/icon-192x192.png',
      tag: 'test',
    });
    
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#000401] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Notificações</h1>
          <p className="text-gray-400">
            Configure como e quando você recebe notificações do CineCasa
          </p>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isSubscribed ? 'bg-green-500/20' : 'bg-gray-500/20'
              }`}>
                <Bell className={`w-6 h-6 ${
                  isSubscribed ? 'text-green-400' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isSubscribed ? 'Notificações Ativadas' : 'Notificações Desativadas'}
                </h3>
                <p className="text-sm text-gray-400">
                  {isSupported 
                    ? isSubscribed 
                      ? 'Você receberá notificações em tempo real'
                      : 'Ative para receber novidades e atualizações'
                    : 'Seu navegador não suporta notificações push'
                  }
                </p>
              </div>
            </div>

            {isSupported && (
              <button
                onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                disabled={isLoading || permission === 'denied'}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isSubscribed
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : permission === 'denied'
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isLoading 
                  ? 'Carregando...' 
                  : permission === 'denied'
                  ? 'Bloqueado'
                  : isSubscribed 
                    ? 'Desativar' 
                    : 'Ativar'
                }
              </button>
            )}
          </div>

          {permission === 'denied' && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-400">
                  Você bloqueou as notificações no navegador. Para ativar, vá em:
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Configurações do Navegador → Privacidade e Segurança → Notificações → CineCasa
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 rounded-xl p-6 mb-6"
        >
          <h3 className="text-xl font-semibold mb-6">Tipos de Notificações</h3>
          
          <div className="space-y-4">
            {/* Novos Episódios */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Tv className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium">Novos Episódios</h4>
                  <p className="text-sm text-gray-400">
                    Seja notificado quando sair um novo episódio das séries que você acompanha
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTogglePreference('newEpisodes')}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  preferences.newEpisodes ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preferences.newEpisodes ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Recomendações */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-medium">Recomendações</h4>
                  <p className="text-sm text-gray-400">
                    Receba sugestões personalizadas baseadas no seu histórico
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTogglePreference('recommendations')}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  preferences.recommendations ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preferences.recommendations ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Continue Assistindo */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium">Continue Assistindo</h4>
                  <p className="text-sm text-gray-400">
                    Lembre-se de terminar o que você começou a assistir
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTogglePreference('continueWatching')}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  preferences.continueWatching ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preferences.continueWatching ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-medium">Novidades e Promoções</h4>
                  <p className="text-sm text-gray-400">
                    Fique por dentro dos lançamentos e ofertas especiais
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleTogglePreference('marketing')}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  preferences.marketing ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  preferences.marketing ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Test Notification */}
        {isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold mb-4">Testar Notificações</h3>
            <p className="text-gray-400 mb-4">
              Envie uma notificação de teste para verificar se tudo está funcionando corretamente.
            </p>
            <button
              onClick={handleTestNotification}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                testSent
                  ? 'bg-green-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {testSent ? (
                <>
                  <Check className="w-5 h-5" />
                  Notificação Enviada!
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  Enviar Notificação de Teste
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Info Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          <p>
            As notificações são enviadas mesmo quando o aplicativo está fechado.
            <br />
            Você pode alterar essas configurações a qualquer momento.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default NotificationSettings;
