import { useCallback, useEffect, useRef, useState } from 'react';

// Detectar se é dispositivo TV/Desktop
const isTVOrDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const isTVDevice = /smart-tv|smarttv|tizen|webos|playstation|xbox|roku|firetv|android tv/i.test(userAgent);
  const isLargeScreen = window.innerWidth >= 1024;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  const isAndroidTV = /android.*tv|aftb|aftt|aftm|tcl|google tv/i.test(userAgent);
  const isTizen = 'tizen' in window || /tizen/i.test(userAgent);
  const isWebOS = 'webOS' in window || 'PalmSystem' in window;
  const isTV = isTVDevice || isAndroidTV || isTizen || isWebOS || isLargeScreen || hasFinePointer;
  
  if (isTV) {
    console.log('[SpatialNavigation] TV/Desktop detectado:', { isAndroidTV, isTizen, isWebOS, isLargeScreen });
  }
  
  return isTV;
};

export function useSpatialNavigation(containerRef: React.RefObject<HTMLElement>, selector = '[data-navigable="true"]') {
  const [isEnabled, setIsEnabled] = useState(false);
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const elementsRef = useRef<HTMLElement[]>([]);
  const lastKeyTimeRef = useRef(0);
  const DEBOUNCE_MS = 150;

  // Detectar dispositivo
  useEffect(() => {
    const checkDevice = () => setIsEnabled(isTVOrDesktop());
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Atualizar lista de elementos
  const updateElements = useCallback(() => {
    if (!containerRef.current) return;
    elementsRef.current = Array.from(containerRef.current.querySelectorAll(selector)) as HTMLElement[];
  }, [containerRef, selector]);

  // Focar elemento
  const focusElement = useCallback((element: HTMLElement) => {
    if (!element) return;
    
    elementsRef.current.forEach(el => {
      el.classList.remove('spatial-focus');
      el.setAttribute('tabindex', '-1');
    });
    
    element.classList.add('spatial-focus');
    element.setAttribute('tabindex', '0');
    element.focus({ preventScroll: true });
    setFocusedElement(element);
    
    // Scroll suave
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }, []);

  // Encontrar próximo elemento
  const findNextElement = useCallback((direction: string): HTMLElement | null => {
    if (!focusedElement || elementsRef.current.length === 0) return null;
    
    const currentRect = focusedElement.getBoundingClientRect();
    const currentCenterX = currentRect.left + currentRect.width / 2;
    const currentCenterY = currentRect.top + currentRect.height / 2;
    
    let bestElement: HTMLElement | null = null;
    let bestScore = Infinity;
    
    elementsRef.current.forEach((element) => {
      if (element === focusedElement) return;
      
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let isValid = false;
      let distance = 0;
      let alignment = 0;
      
      switch (direction) {
        case 'up':
          isValid = centerY < currentCenterY;
          distance = currentCenterY - centerY;
          alignment = Math.abs(centerX - currentCenterX);
          break;
        case 'down':
          isValid = centerY > currentCenterY;
          distance = centerY - currentCenterY;
          alignment = Math.abs(centerX - currentCenterX);
          break;
        case 'left':
          isValid = centerX < currentCenterX;
          distance = currentCenterX - centerX;
          alignment = Math.abs(centerY - currentCenterY);
          break;
        case 'right':
          isValid = centerX > currentCenterX;
          distance = centerX - currentCenterX;
          alignment = Math.abs(centerY - currentCenterY);
          break;
      }
      
      if (isValid) {
        const score = alignment * 2 + distance;
        if (score < bestScore) {
          bestScore = score;
          bestElement = element;
        }
      }
    });
    
    return bestElement;
  }, [focusedElement]);

  // Handler de teclas
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;
    
    const now = Date.now();
    if (now - lastKeyTimeRef.current < DEBOUNCE_MS) {
      event.preventDefault();
      return;
    }
    
    let direction: string | null = null;
    let handled = false;
    
    switch (event.key) {
      case 'ArrowUp': direction = 'up'; handled = true; break;
      case 'ArrowDown': direction = 'down'; handled = true; break;
      case 'ArrowLeft': direction = 'left'; handled = true; break;
      case 'ArrowRight': direction = 'right'; handled = true; break;
      case 'Enter':
      case 'OK':
        if (focusedElement) {
          focusedElement.click();
          handled = true;
        }
        break;
    }
    
    if (handled) {
      event.preventDefault();
      lastKeyTimeRef.current = now;
    }
    
    if (direction) {
      updateElements();
      const nextElement = findNextElement(direction);
      if (nextElement) {
        focusElement(nextElement);
      }
    }
  }, [isEnabled, findNextElement, focusElement]);

  // Registrar listeners
  useEffect(() => {
    if (!isEnabled) return;
    
    updateElements();
    
    // Focar primeiro elemento
    if (elementsRef.current.length > 0 && !focusedElement) {
      setTimeout(() => focusElement(elementsRef.current[0]), 100);
    }
    
    window.addEventListener('keydown', handleKeyDown, true);
    
    // Tizen support
    if (typeof window !== 'undefined' && 'tizen' in window) {
      try {
        // @ts-ignore
        window.tizen?.tvinputdevice?.registerKeyBatch(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Back']);
      } catch (e) {}
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isEnabled, handleKeyDown, focusElement]);

  return { isEnabled, focusedElement, focusElement };
}

export default useSpatialNavigation;
