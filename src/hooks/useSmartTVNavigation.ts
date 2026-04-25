import { useCallback, useEffect, useRef } from 'react';

interface NavigationOptions {
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onSelect?: () => void;
  onBack?: () => void;
  preventDefault?: boolean;
}

export const useSmartTVNavigation = (options: NavigationOptions = {}) => {
  const { onNavigate, onSelect, onBack, preventDefault = true } = options;
  const isProcessingRef = useRef(false);
  const lastKeyTimeRef = useRef(0);
  const DEBOUNCE_MS = 150; // Prevenir navegação muito rápida

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const now = Date.now();
    if (now - lastKeyTimeRef.current < DEBOUNCE_MS) {
      if (preventDefault) event.preventDefault();
      return;
    }

    const key = event.key;
    let handled = false;

    // Mapear teclas para direções
    switch (key) {
      case 'ArrowUp':
      case 'Up':
        handled = true;
        onNavigate?.('up');
        break;
      case 'ArrowDown':
      case 'Down':
        handled = true;
        onNavigate?.('down');
        break;
      case 'ArrowLeft':
      case 'Left':
        handled = true;
        onNavigate?.('left');
        break;
      case 'ArrowRight':
      case 'Right':
        handled = true;
        onNavigate?.('right');
        break;
      case 'Enter':
      case 'OK':
      case 'Select':
        handled = true;
        onSelect?.();
        break;
      case 'Escape':
      case 'Back':
      case 'Backspace':
        handled = true;
        onBack?.();
        break;
    }

    if (handled && preventDefault) {
      event.preventDefault();
      lastKeyTimeRef.current = now;
    }
  }, [onNavigate, onSelect, onBack, preventDefault]);

  // Suporte a eventos de controle remoto (Tizen, webOS, etc)
  const handleRemoteControl = useCallback((event: Event) => {
    const customEvent = event as CustomEvent;
    const keyName = customEvent.detail?.keyName || customEvent.type;
    
    switch (keyName) {
      case 'moveUp':
        onNavigate?.('up');
        break;
      case 'moveDown':
        onNavigate?.('down');
        break;
      case 'moveLeft':
        onNavigate?.('left');
        break;
      case 'moveRight':
        onNavigate?.('right');
        break;
      case 'select':
        onSelect?.();
        break;
      case 'back':
        onBack?.();
        break;
    }
  }, [onNavigate, onSelect, onBack]);

  useEffect(() => {
    // Adicionar listeners para teclado
    window.addEventListener('keydown', handleKeyDown, true);
    
    // Adicionar listeners para eventos de controle remoto específicos de Smart TV
    window.addEventListener('moveUp', handleRemoteControl);
    window.addEventListener('moveDown', handleRemoteControl);
    window.addEventListener('moveLeft', handleRemoteControl);
    window.addEventListener('moveRight', handleRemoteControl);
    window.addEventListener('select', handleRemoteControl);
    window.addEventListener('back', handleRemoteControl);

    // Inicializar suporte a Smart TV (Tizen, webOS, Android TV)
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Detectar Android TV (TCL e outros)
      const isAndroidTV = /android.*tv|aftb|aftt|aftm|tcl|roku|firetv|google tv/i.test(userAgent);
      if (isAndroidTV) {
        console.log('[SmartTV] Android TV detectado');
        document.body.classList.add('android-tv');
        
        // Tentar registrar teclas específicas do Android TV
        try {
          // @ts-ignore
          if (window.android && window.android.registerKeys) {
            // @ts-ignore
            window.android.registerKeys(['DPAD_UP', 'DPAD_DOWN', 'DPAD_LEFT', 'DPAD_RIGHT', 'DPAD_CENTER', 'BACK']);
          }
        } catch (e) {
          console.log('[SmartTV] Android TV key registration not available');
        }
      }
      
      // Tizen
      if ('tizen' in window) {
        try {
          // @ts-ignore
          window.tizen.tvinputdevice.registerKeyBatch(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Back']);
          console.log('[SmartTV] Tizen registrado com sucesso');
        } catch (e) {
          console.log('[SmartTV] Tizen registration failed:', e);
        }
      }
      
      // webOS (LG)
      if ('webOS' in window || 'PalmSystem' in window) {
        console.log('[SmartTV] webOS (LG) detectado');
        document.body.classList.add('webos-tv');
        
        // Tentar usar API do webOS
        try {
          // @ts-ignore
          if (window.webOS && window.webOS.keyboard) {
            // @ts-ignore
            window.webOS.keyboard.register({
              keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Back']
            });
          }
        } catch (e) {
          console.log('[SmartTV] webOS key registration not available');
        }
      }
      
      // Ativar modo TV se detectado
      if (isAndroidTV || 'tizen' in window || 'webOS' in window || 'PalmSystem' in window) {
        document.body.classList.add('tv-mode');
        
        // Focar primeiro elemento focável automaticamente
        setTimeout(() => {
          const firstFocusable = document.querySelector('[data-navigable="true"], button, a, [tabindex]:not([tabindex="-1"])') as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
            console.log('[SmartTV] Foco automático ativado no primeiro elemento');
          }
        }, 500);
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('moveUp', handleRemoteControl);
      window.removeEventListener('moveDown', handleRemoteControl);
      window.removeEventListener('moveLeft', handleRemoteControl);
      window.removeEventListener('moveRight', handleRemoteControl);
      window.removeEventListener('select', handleRemoteControl);
      window.removeEventListener('back', handleRemoteControl);
    };
  }, [handleKeyDown, handleRemoteControl]);

  return {
    isProcessing: isProcessingRef.current,
  };
};

export default useSmartTVNavigation;
