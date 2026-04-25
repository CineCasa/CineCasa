import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================
// KEYCODE MAPPING UNIVERSAL - MULTIPLATAFORMA
// ============================================

export const KEYCODE_MAP = {
  // Navegação Padrão
  ARROW_UP: [38, 'ArrowUp', 'Up'],
  ARROW_DOWN: [40, 'ArrowDown', 'Down'],
  ARROW_LEFT: [37, 'ArrowLeft', 'Left'],
  ARROW_RIGHT: [39, 'ArrowRight', 'Right'],
  ENTER: [13, 'Enter', 'OK', 'Select', 'Accept'],
  BACK: [8, 27, 10009, 461, 'Back', 'Escape', 'GoBack'],
  HOME: [36, 'Home'],
  MENU: [18, 'Menu'],
  
  // Roku (Chromium/Chrome no Roku TV)
  ROKU_BACK: [10009, 'rokuBack'],
  ROKU_HOME: [1000, 'rokuHome'],
  
  // PlayStation 5 (navegador embutido)
  PS5_X: [13, 'PlayStationX'], // Confirmar
  PS5_O: [27, 'PlayStationO'], // Voltar
  PS5_SQUARE: [101, 'PlayStationSquare'],
  PS5_TRIANGLE: [100, 'PlayStationTriangle'],
  
  // Xbox (navegador Edge)
  XBOX_A: [13, 'XboxA'], // Confirmar
  XBOX_B: [8, 'XboxB'], // Voltar
  XBOX_X: [32, 'XboxX'],
  XBOX_Y: [89, 'XboxY'],
  XBOX_MENU: [18, 'XboxMenu'],
  
  // Apple TV (Siri Remote via Touch Click)
  APPLE_TV_CLICK: [13, 'AppleTVClick'],
  APPLE_TV_TOUCH_SURFACE: ['AppleTVTouchSurface'],
  
  // Vizio SmartCast
  VIZIO_BACK: [8, 461, 'VizioBack'],
  VIZIO_HOME: [1000, 'VizioHome'],
  
  // Panasonic MyHomeScreen
  PANASONIC_BACK: [8, 10009, 'PanasonicBack'],
  PANASONIC_APPS: [1000, 'PanasonicApps'],
  
  // Teclas numéricas (canais)
  NUM_0: [48, 96, '0'],
  NUM_1: [49, 97, '1'],
  NUM_2: [50, 98, '2'],
  NUM_3: [51, 99, '3'],
  NUM_4: [52, 100, '4'],
  NUM_5: [53, 101, '5'],
  NUM_6: [54, 102, '6'],
  NUM_7: [55, 103, '7'],
  NUM_8: [56, 104, '8'],
  NUM_9: [57, 105, '9'],
};

// Detectar plataforma
export const detectPlatform = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // Roku
  if (ua.includes('roku') || ua.includes('play')) return 'roku';
  
  // PlayStation
  if (ua.includes('playstation') || ua.includes('ps4') || ua.includes('ps5')) return 'playstation';
  
  // Xbox
  if (ua.includes('xbox') || platform.includes('xbox')) return 'xbox';
  
  // Apple TV
  if (ua.includes('appletv') || (ua.includes('apple tv') && ua.includes('webkit'))) return 'appletv';
  
  // Vizio
  if (ua.includes('vizio') || ua.includes('smartcast')) return 'vizio';
  
  // Panasonic
  if (ua.includes('panasonic') || ua.includes('myhomescreen')) return 'panasonic';
  
  // Tizen
  if ('tizen' in window || ua.includes('tizen')) return 'tizen';
  
  // webOS
  if ('webOS' in window || 'PalmSystem' in window || ua.includes('webos')) return 'webos';
  
  // Android TV
  if (ua.includes('android') && (ua.includes('tv') || ua.includes('silk'))) return 'androidtv';
  
  // Fire TV
  if (ua.includes('aftb') || ua.includes('aftt') || ua.includes('aftm') || ua.includes('fire tv')) return 'firetv';
  
  // Desktop
  if (window.innerWidth >= 1024 && !ua.includes('mobile')) return 'desktop';
  
  return 'unknown';
};

// Verificar se é tecla de direção
export const isDirectionKey = (keyCode: number, key: string): string | null => {
  if (KEYCODE_MAP.ARROW_UP.includes(keyCode) || KEYCODE_MAP.ARROW_UP.includes(key)) return 'up';
  if (KEYCODE_MAP.ARROW_DOWN.includes(keyCode) || KEYCODE_MAP.ARROW_DOWN.includes(key)) return 'down';
  if (KEYCODE_MAP.ARROW_LEFT.includes(keyCode) || KEYCODE_MAP.ARROW_LEFT.includes(key)) return 'left';
  if (KEYCODE_MAP.ARROW_RIGHT.includes(keyCode) || KEYCODE_MAP.ARROW_RIGHT.includes(key)) return 'right';
  return null;
};

// Verificar se é tecla de ação (Enter/OK)
export const isActionKey = (keyCode: number, key: string): boolean => {
  return KEYCODE_MAP.ENTER.includes(keyCode) || KEYCODE_MAP.ENTER.includes(key);
};

// Verificar se é tecla de voltar
export const isBackKey = (keyCode: number, key: string): boolean => {
  return KEYCODE_MAP.BACK.includes(keyCode) || KEYCODE_MAP.BACK.includes(key);
};

// ============================================
// HOOK PRINCIPAL
// ============================================

interface UseInputManagerOptions {
  onDirection?: (direction: 'up' | 'down' | 'left' | 'right', event: KeyboardEvent) => void;
  onAction?: (event: KeyboardEvent) => void;
  onBack?: (event: KeyboardEvent) => boolean; // return true if handled
  onKey?: (key: string, keyCode: number, event: KeyboardEvent) => void;
  enableDebug?: boolean;
  debounceMs?: number;
}

export function useInputManager(options: UseInputManagerOptions = {}) {
  const { 
    onDirection, 
    onAction, 
    onBack, 
    onKey,
    enableDebug = false, 
    debounceMs = 150 
  } = options;
  
  const [platform, setPlatform] = useState<string>('unknown');
  const [lastKeyInfo, setLastKeyInfo] = useState<{ key: string; keyCode: number; platform: string } | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const lastKeyTimeRef = useRef(0);
  const debugRef = useRef<HTMLDivElement | null>(null);
  
  // Detectar plataforma no mount
  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);
    
    if (enableDebug) {
      console.log(`[InputManager] Plataforma detectada: ${detected}`);
    }
  }, [enableDebug]);
  
  // Mostrar debug visual
  const showDebugInfo = useCallback((key: string, keyCode: number) => {
    if (!enableDebug) return;
    
    const info = { key, keyCode, platform };
    setLastKeyInfo(info);
    
    console.log(`[InputManager] Key: ${key}, KeyCode: ${keyCode}, Platform: ${platform}`);
    
    // Criar ou atualizar elemento de debug visual
    if (!debugRef.current) {
      debugRef.current = document.createElement('div');
      debugRef.current.id = 'input-debug-overlay';
      debugRef.current.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #00E5FF;
        padding: 15px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 14px;
        z-index: 99999;
        border: 2px solid #00E5FF;
        box-shadow: 0 0 20px rgba(0, 229, 255, 0.5);
        min-width: 250px;
      `;
      document.body.appendChild(debugRef.current);
    }
    
    debugRef.current.innerHTML = `
      <div style="margin-bottom: 5px; font-weight: bold; color: #fff;">🎮 Input Manager Debug</div>
      <div>Platform: <span style="color: #fff;">${platform}</span></div>
      <div>Key: <span style="color: #fff;">${key}</span></div>
      <div>KeyCode: <span style="color: #fff;">${keyCode}</span></div>
      <div style="margin-top: 8px; font-size: 11px; color: #888;">
        Pressione [Ctrl+D] para esconder
      </div>
    `;
    
    // Auto-hide após 3 segundos
    setTimeout(() => {
      if (debugRef.current) {
        debugRef.current.style.opacity = '0.3';
      }
    }, 3000);
  }, [enableDebug, platform]);
  
  // Handler principal
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const keyCode = event.keyCode || event.which;
    const key = event.key;
    
    // Mostrar debug
    showDebugInfo(key, keyCode);
    
    // Debounce
    const now = Date.now();
    if (now - lastKeyTimeRef.current < debounceMs) {
      event.preventDefault();
      return;
    }
    lastKeyTimeRef.current = now;
    
    // Marcar interação do usuário (para autoplay policy)
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
    
    // Chamar callback genérico
    onKey?.(key, keyCode, event);
    
    // Verificar direções
    const direction = isDirectionKey(keyCode, key);
    if (direction) {
      event.preventDefault();
      onDirection?.(direction as any, event);
      return;
    }
    
    // Verificar ação
    if (isActionKey(keyCode, key)) {
      event.preventDefault();
      onAction?.(event);
      return;
    }
    
    // Verificar voltar - com preventDefault rigoroso
    if (isBackKey(keyCode, key)) {
      // ROKU/TIZEN: preventDefault rigoroso
      if (platform === 'roku' || platform === 'tizen' || platform === 'playstation') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
      
      const handled = onBack?.(event) ?? false;
      if (handled) {
        event.preventDefault();
      }
      return;
    }
  }, [
    debounceMs, 
    hasUserInteracted, 
    onAction, 
    onBack, 
    onDirection, 
    onKey, 
    platform, 
    showDebugInfo
  ]);
  
  // Registrar listeners
  useEffect(() => {
    // Captura no documento inteiro
    document.addEventListener('keydown', handleKeyDown, true);
    
    // Registrar teclas específicas para Tizen
    if (platform === 'tizen' && 'tizen' in window) {
      try {
        // @ts-ignore
        window.tizen?.tvinputdevice?.registerKeyBatch([
          'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
          'Enter', 'Back', 'Menu', 'Info'
        ]);
      } catch (e) {
        console.log('[InputManager] Tizen registration failed:', e);
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown, platform]);
  
  // Esconder debug com Ctrl+D
  useEffect(() => {
    const handleDebugToggle = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (debugRef.current) {
          debugRef.current.style.display = debugRef.current.style.display === 'none' ? 'block' : 'none';
        }
      }
    };
    
    window.addEventListener('keydown', handleDebugToggle);
    return () => window.removeEventListener('keydown', handleDebugToggle);
  }, []);
  
  return {
    platform,
    lastKeyInfo,
    hasUserInteracted,
    setHasUserInteracted,
  };
}

export default useInputManager;
