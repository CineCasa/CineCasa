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
  resumeFrom?: number;
  contentId?: string;
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
  isMiniPlayer: boolean;
  setIsMiniPlayer: (value: boolean) => void;
  toggleMiniPlayer: () => void;
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
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    
    if (isPlayerOpen) {
      root.classList.add('player-active');
    } else {
      root.classList.remove('player-active');
      // Reset mini player when closing
      setIsMiniPlayer(false);
    }
  }, [isPlayerOpen]);

  const openPlayer = (item: PlayerItem) => {
    setCurrentItem(item);
    setIsPlayerOpen(true);
    setIsMiniPlayer(false);
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    setCurrentItem(null);
    setIsMiniPlayer(false);
  };

  const toggleMiniPlayer = () => {
    setIsMiniPlayer(prev => !prev);
  };

  return (
    <PlayerContext.Provider value={{ 
      isPlayerOpen, 
      setIsPlayerOpen, 
      currentItem, 
      openPlayer, 
      closePlayer,
      isMiniPlayer,
      setIsMiniPlayer,
      toggleMiniPlayer
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
