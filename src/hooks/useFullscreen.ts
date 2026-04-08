import { useEffect, useRef } from 'react';

interface UseFullscreenOptions {
  autoActivate?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export const useFullscreen = (options: UseFullscreenOptions = {}) => {
  const { autoActivate = true, onError, onSuccess } = options;
  const containerRef = useRef<HTMLElement>(null);
  const isActiveRef = useRef(false);

  const requestFullscreen = async (element?: HTMLElement) => {
    const target = element || containerRef.current || document.documentElement;
    
    if (isActiveRef.current) return true;

    try {
      console.log('📺 Solicitando fullscreen...');
      
      // Tentar diferentes métodos de fullscreen
      const fullscreenMethods = [
        () => target.requestFullscreen?.(),
        () => (target as any).webkitRequestFullscreen?.(),
        () => (target as any).mozRequestFullScreen?.(),
        () => (target as any).msRequestFullscreen?.(),
        () => document.documentElement.requestFullscreen?.()
      ];

      for (const method of fullscreenMethods) {
        try {
          await method();
          isActiveRef.current = true;
          console.log('✅ Fullscreen ativado com sucesso');
          onSuccess?.();
          return true;
        } catch (e) {
          continue;
        }
      }

      throw new Error('Nenhum método de fullscreen disponível');
    } catch (error) {
      console.error('❌ Falha ao ativar fullscreen:', error);
      onError?.(error as Error);
      return false;
    }
  };

  const exitFullscreen = async () => {
    if (!isActiveRef.current) return;

    try {
      console.log('📺 Saindo do fullscreen...');
      
      const exitMethods = [
        () => document.exitFullscreen?.(),
        () => (document as any).webkitExitFullscreen?.(),
        () => (document as any).mozCancelFullScreen?.(),
        () => (document as any).msExitFullscreen?.()
      ];

      for (const method of exitMethods) {
        try {
          await method();
          isActiveRef.current = false;
          console.log('✅ Fullscreen desativado');
          return true;
        } catch (e) {
          continue;
        }
      }
    } catch (error) {
      console.error('❌ Falha ao sair do fullscreen:', error);
      onError?.(error as Error);
      return false;
    }
  };

  const toggleFullscreen = async () => {
    if (isActiveRef.current) {
      return await exitFullscreen();
    } else {
      return await requestFullscreen();
    }
  };

  // Auto-ativar fullscreen
  useEffect(() => {
    if (autoActivate && !isActiveRef.current) {
      const timer = setTimeout(() => {
        requestFullscreen();
      }, 1000); // Pequeno delay para garantir que o DOM esteja pronto

      return () => clearTimeout(timer);
    }
  }, [autoActivate]);

  // Listener para mudanças de estado do fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      isActiveRef.current = isFullscreen;
      
      if (isFullscreen) {
        document.body.classList.add('fullscreen-active');
        onSuccess?.();
      } else {
        document.body.classList.remove('fullscreen-active');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return {
    containerRef,
    isActive: isActiveRef.current,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
};

export default useFullscreen;
