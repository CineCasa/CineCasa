import { ReactNode, useEffect } from 'react';
import { useNewEpisodeDetector, useRecommendationEngine, useContinueWatchingReminder } from '@/hooks/useNotificationEngine';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Inicializar detectores de notificação
  useNewEpisodeDetector();
  useRecommendationEngine();
  useContinueWatchingReminder();

  // Registrar service worker para notificações push
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('[NotificationProvider] Service Worker registrado:', registration);
        })
        .catch(error => {
          console.error('[NotificationProvider] Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  return <>{children}</>;
}

export default NotificationProvider;
