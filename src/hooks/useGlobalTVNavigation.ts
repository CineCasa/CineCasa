import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook global para navegação por controle remoto em TV (Android TV, webOS, Tizen)
 * 
 * Este hook gerencia a navegação focada em toda a aplicação,
 * garantindo que funcione em todas as direções e elementos.
 */

// Seletor para elementos navegáveis
const NAVIGABLE_SELECTOR = '[data-navigable="true"], button:not([disabled]), a:not([disabled]), [role="button"]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

export function useGlobalTVNavigation() {
  const focusedElementRef = useRef<HTMLElement | null>(null);
  const isTVRef = useRef(false);
  const lastKeyTimeRef = useRef(0);
  const DEBOUNCE_MS = 150;

  // Detectar se é dispositivo TV
  useEffect(() => {
    const detectTV = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTV = /smart-tv|smarttv|android.*tv|aftb|aftt|aftm|tcl|tizen|webos|playstation|xbox|roku|firetv|google tv/i.test(userAgent);
      const isLargeScreen = window.innerWidth >= 1024;
      const hasNoTouch = !('ontouchstart' in window);
      
      isTVRef.current = isTV || (isLargeScreen && hasNoTouch);
      
      if (isTVRef.current) {
        document.body.classList.add('tv-navigation-active');
        console.log('[GlobalTVNavigation] Modo TV ativado');
      }
    };
    
    detectTV();
    window.addEventListener('resize', detectTV);
    return () => window.removeEventListener('resize', detectTV);
  }, []);

  // Obter todos os elementos navegáveis ordenados por posição
  const getNavigableElements = useCallback(() => {
    const elements = Array.from(document.querySelectorAll(NAVIGABLE_SELECTOR)) as HTMLElement[];
    
    // Ordenar por posição visual (top -> bottom, left -> right)
    return elements.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      
      // Mesma linha (tolerância de 50px)
      const sameRow = Math.abs(rectA.top - rectB.top) < 50;
      
      if (sameRow) {
        return rectA.left - rectB.left; // Ordenar da esquerda para direita
      }
      
      return rectA.top - rectB.top; // Ordenar de cima para baixo
    });
  }, []);

  // Encontrar o elemento mais próximo em uma direção
  const findNearestElement = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const current = focusedElementRef.current;
    if (!current) return null;
    
    const currentRect = current.getBoundingClientRect();
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const currentCenterY = currentRect.top + currentRect.height / 2;
    
    const elements = getNavigableElements();
    let nearest: HTMLElement | null = null;
    let minDistance = Infinity;
    
    elements.forEach(el => {
      if (el === current) return;
      
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let valid = false;
      let distance = Infinity;
      
      switch (direction) {
        case 'up':
          valid = centerY < currentCenterY && Math.abs(centerX - currentCenterX) < rect.width;
          distance = currentCenterY - centerY;
          break;
        case 'down':
          valid = centerY > currentCenterY && Math.abs(centerX - currentCenterX) < rect.width;
          distance = centerY - currentCenterY;
          break;
        case 'left':
          valid = centerX < currentCenterX && Math.abs(centerY - currentCenterY) < rect.height;
          distance = currentCenterX - centerX;
          break;
        case 'right':
          valid = centerX > currentCenterX && Math.abs(centerY - currentCenterY) < rect.height;
          distance = centerX - currentCenterX;
          break;
      }
      
      if (valid && distance < minDistance) {
        minDistance = distance;
        nearest = el;
      }
    });
    
    return nearest;
  }, [getNavigableElements]);

  // Navegar em uma direção
  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isTVRef.current) return;
    
    const nearest = findNearestElement(direction);
    if (nearest) {
      nearest.focus();
      nearest.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      focusedElementRef.current = nearest;
      
      // Adicionar classe visual de foco
      nearest.classList.add('tv-focus');
      setTimeout(() => nearest.classList.remove('tv-focus'), 200);
    }
  }, [findNearestElement]);

  // Ativar elemento focado
  const activate = useCallback(() => {
    const current = focusedElementRef.current;
    if (current) {
      current.click();
      
      // Disparar evento de clique programático
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      current.dispatchEvent(event);
    }
  }, []);

  // Voltar/Back
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    }
  }, []);

  // Handler de teclas
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isTVRef.current) return;
    
    const now = Date.now();
    if (now - lastKeyTimeRef.current < DEBOUNCE_MS) {
      event.preventDefault();
      return;
    }
    
    const key = event.key;
    let handled = false;
    
    switch (key) {
      case 'ArrowUp':
      case 'Up':
        handled = true;
        navigate('up');
        break;
      case 'ArrowDown':
      case 'Down':
        handled = true;
        navigate('down');
        break;
      case 'ArrowLeft':
      case 'Left':
        handled = true;
        navigate('left');
        break;
      case 'ArrowRight':
      case 'Right':
        handled = true;
        navigate('right');
        break;
      case 'Enter':
      case 'OK':
      case 'Select':
        handled = true;
        activate();
        break;
      case 'Escape':
      case 'Back':
      case 'Backspace':
        handled = true;
        goBack();
        break;
    }
    
    if (handled) {
      event.preventDefault();
      lastKeyTimeRef.current = now;
    }
  }, [navigate, activate, goBack]);

  // Handler para eventos de controle remoto específicos de TV
  const handleRemoteControl = useCallback((event: Event) => {
    if (!isTVRef.current) return;
    
    const customEvent = event as CustomEvent;
    const keyName = customEvent.detail?.keyName || customEvent.type;
    
    switch (keyName) {
      case 'moveUp':
        navigate('up');
        break;
      case 'moveDown':
        navigate('down');
        break;
      case 'moveLeft':
        navigate('left');
        break;
      case 'moveRight':
        navigate('right');
        break;
      case 'select':
        activate();
        break;
      case 'back':
        goBack();
        break;
    }
  }, [navigate, activate, goBack]);

  // Inicialização e listeners
  useEffect(() => {
    // Foco inicial no primeiro elemento navegável
    const setInitialFocus = () => {
      if (!isTVRef.current) return;
      
      const elements = getNavigableElements();
      if (elements.length > 0) {
        // Tentar focar no primeiro elemento visível
        const visibleElement = elements.find(el => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
        });
        
        const elementToFocus = visibleElement || elements[0];
        elementToFocus.focus();
        focusedElementRef.current = elementToFocus;
        console.log('[GlobalTVNavigation] Foco inicial definido');
      }
    };
    
    // Aguardar renderização completa
    const timer = setTimeout(setInitialFocus, 1000);
    
    // Adicionar listeners
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('moveUp', handleRemoteControl);
    window.addEventListener('moveDown', handleRemoteControl);
    window.addEventListener('moveLeft', handleRemoteControl);
    window.addEventListener('moveRight', handleRemoteControl);
    window.addEventListener('select', handleRemoteControl);
    window.addEventListener('back', handleRemoteControl);
    
    // Atualizar foco quando o foco mudar
    const handleFocus = (e: FocusEvent) => {
      focusedElementRef.current = e.target as HTMLElement;
    };
    document.addEventListener('focusin', handleFocus);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('moveUp', handleRemoteControl);
      window.removeEventListener('moveDown', handleRemoteControl);
      window.removeEventListener('moveLeft', handleRemoteControl);
      window.removeEventListener('moveRight', handleRemoteControl);
      window.removeEventListener('select', handleRemoteControl);
      window.removeEventListener('back', handleRemoteControl);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [handleKeyDown, handleRemoteControl, getNavigableElements]);

  return {
    isTV: isTVRef.current,
    navigate,
    activate,
    goBack
  };
}

export default useGlobalTVNavigation;
