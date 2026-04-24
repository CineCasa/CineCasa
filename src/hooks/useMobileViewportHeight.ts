import { useEffect, useState } from 'react';

/**
 * Hook para corrigir a altura da viewport em dispositivos móveis
 * Resolve o problema da barra de navegação móvel que fica muito grande
 * quando a interface do usuário do navegador (barras de ferramentas) é ocultada/exibida
 */
export function useMobileViewportHeight() {
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const updateVh = () => {
      // Usar visualViewport para obter a altura real disponível
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      setVh(viewportHeight);
      
      // Definir uma variável CSS customizada para ser usada no CSS
      document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
      document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
    };

    // Atualizar na montagem
    updateVh();

    // Adicionar listeners para mudanças na viewport
    const handleResize = () => {
      // Debounce para evitar muitas atualizações
      requestAnimationFrame(updateVh);
    };

    // VisualViewport API é mais confiável para mobile
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // iOS Safari específico: atualizar quando o teclado aparece
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const handleVisibilityChange = () => {
        if (document.hidden) return;
        setTimeout(updateVh, 100);
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return vh;
}

export default useMobileViewportHeight;
