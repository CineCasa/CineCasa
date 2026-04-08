import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface MovieNotification {
  id: string;
  titulo: string;
  poster?: string;
  categoria?: string;
  trailer_url?: string;
  video_url?: string;
  created_at: string;
}

interface NotificationContextType {
  notifications: MovieNotification[];
  addNotification: (movie: MovieNotification) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<MovieNotification[]>([]);

  const addNotification = useCallback((movie: MovieNotification) => {
    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(n => n.id === movie.id)) return prev;
      return [...prev, movie];
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
