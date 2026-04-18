import { ReactNode } from 'react';
import { useNewEpisodeDetector, useRecommendationEngine, useContinueWatchingReminder } from '@/hooks/useNotificationEngine';

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  // Inicializar detectores de notificação
  useNewEpisodeDetector();
  useRecommendationEngine();
  useContinueWatchingReminder();

  // REMOVED: Service Worker registration - now handled by sw.js only
  // to prevent conflicts between multiple service workers

  return <>{children}</>;
}

export default NotificationProvider;
