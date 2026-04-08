import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface PlayerItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  videoUrl?: string;
  poster?: string;
  year?: string;
  seriesId?: string;
  episodeId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  duration?: number;
}

interface PlayerContextType {
  isPlayerOpen: boolean;
  setIsPlayerOpen: (open: boolean) => void;
  currentItem: PlayerItem | null;
  openPlayer: (item: PlayerItem) => void;
  closePlayer: () => void;
  saveProgress?: (currentTime: number, duration: number) => void;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<PlayerItem | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    
    if (isPlayerOpen) {
      root.classList.add('player-active');
    } else {
      root.classList.remove('player-active');
    }
  }, [isPlayerOpen]);

  const openPlayer = (item: PlayerItem) => {
    setCurrentItem(item);
    setIsPlayerOpen(true);
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    setCurrentItem(null);
  };

  return (
    <PlayerContext.Provider value={{ isPlayerOpen, setIsPlayerOpen, currentItem, openPlayer, closePlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};
