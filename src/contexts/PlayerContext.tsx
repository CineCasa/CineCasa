import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

/**
 * EXTENSÕES:
 * - tmdbId + tmdbType → passa para VideoJSPlayer/YouTubePlayer para buscar thumbnails
 * - hasNextEpisode + onNextEpisode + nextEpisodeTitle → autoplay próximo episódio estilo Netflix
 * - openPlayer agora aceita o item completo incluindo callbacks
 */

export interface PlayerItem {
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
  // Preview de thumbnails
  tmdbId?: string;
  tmdbType?: 'movie' | 'tv';
  // Próximo episódio
  hasNextEpisode?: boolean;
  nextEpisodeTitle?: string;
  onNextEpisode?: () => void;
}

interface PlayerContextType {
  isPlayerOpen: boolean;
  setIsPlayerOpen: (open: boolean) => void;
  currentItem: PlayerItem | null;
  openPlayer: (item: PlayerItem) => void;
  closePlayer: () => void;
  isMiniPlayer: boolean;
  setIsMiniPlayer: (value: boolean) => void;
  toggleMiniPlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within a PlayerProvider');
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
      // Impede scroll do body enquanto player está aberto
      document.body.style.overflow = 'hidden';
    } else {
      root.classList.remove('player-active');
      document.body.style.overflow = '';
      setIsMiniPlayer(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPlayerOpen]);

  const openPlayer = useCallback((item: PlayerItem) => {
    setCurrentItem(item);
    setIsPlayerOpen(true);
    setIsMiniPlayer(false);
  }, []);

  const closePlayer = useCallback(() => {
    setIsPlayerOpen(false);
    setCurrentItem(null);
    setIsMiniPlayer(false);
  }, []);

  const toggleMiniPlayer = useCallback(() => {
    setIsMiniPlayer(prev => !prev);
  }, []);

  return (
    <PlayerContext.Provider value={{
      isPlayerOpen,
      setIsPlayerOpen,
      currentItem,
      openPlayer,
      closePlayer,
      isMiniPlayer,
      setIsMiniPlayer,
      toggleMiniPlayer,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
