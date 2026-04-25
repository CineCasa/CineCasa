import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que faz scroll automático para o topo (banner)
 * sempre que a rota muda
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll suave para o topo da página
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
    
    console.log('[ScrollToTop] Scrolled to top on route:', pathname);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
