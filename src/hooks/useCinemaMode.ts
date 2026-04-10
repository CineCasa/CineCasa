import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'cinecasa-cinema-mode';

export function useCinemaMode() {
  const [isCinemaMode, setIsCinemaMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'true';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  let controlsTimeout: NodeJS.Timeout;

  const enterFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.log('Fullscreen not supported');
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.log('Error exiting fullscreen');
    }
  }, []);

  const enableCinemaMode = useCallback(() => {
    setIsCinemaMode(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    document.body.classList.add('cinema-mode');
    enterFullscreen();
  }, [enterFullscreen]);

  const disableCinemaMode = useCallback(() => {
    setIsCinemaMode(false);
    localStorage.setItem(STORAGE_KEY, 'false');
    document.body.classList.remove('cinema-mode');
    exitFullscreen();
    setShowControls(true);
  }, [exitFullscreen]);

  const toggleCinemaMode = useCallback(() => {
    if (isCinemaMode) {
      disableCinemaMode();
    } else {
      enableCinemaMode();
    }
  }, [isCinemaMode, enableCinemaMode, disableCinemaMode]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    if (isCinemaMode) {
      controlsTimeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isCinemaMode]);

  // Atalho de teclado (tecla C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        // Não ativar se estiver em input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        toggleCinemaMode();
      }
      // ESC sai do modo cinema
      if (e.key === 'Escape' && isCinemaMode) {
        disableCinemaMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCinemaMode, disableCinemaMode, isCinemaMode]);

  // Monitorar mouse para mostrar controles
  useEffect(() => {
    const handleMouseMove = () => {
      showControlsTemporarily();
    };

    if (isCinemaMode) {
      window.addEventListener('mousemove', handleMouseMove);
      showControlsTemporarily();
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(controlsTimeout);
    };
  }, [isCinemaMode, showControlsTemporarily]);

  return {
    isCinemaMode,
    isFullscreen,
    showControls,
    enableCinemaMode,
    disableCinemaMode,
    toggleCinemaMode,
    showControlsTemporarily,
  };
}
