import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Códigos de tecla para botão Voltar em diferentes plataformas
const BACK_KEYS = {
  BACKSPACE: 8,
  ESCAPE: 27,
  TIZEN_BACK: 10009,
  WEBOS_BACK: 461,
  ANDROID_BACK: 'Back',
};

interface FocusHistoryEntry {
  path: string;
  elementId?: string;
  elementIndex?: number;
}

interface UseGlobalBackHandlerOptions {
  isPlayerOpen?: boolean;
  isModalOpen?: boolean;
  onClosePlayer?: () => void;
  onCloseModal?: () => void;
  onExitApp?: () => void;
}

export function useGlobalBackHandler(options: UseGlobalBackHandlerOptions = {}) {
  const {
    isPlayerOpen = false,
    isModalOpen = false,
    onClosePlayer,
    onCloseModal,
    onExitApp,
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const focusHistoryRef = useRef<FocusHistoryEntry[]>([]);
  const lastBackTimeRef = useRef(0);
  const DEBOUNCE_MS = 300;

  // Verificar se é uma tecla de voltar
  const isBackKey = useCallback((event: KeyboardEvent): boolean => {
    const keyCode = event.keyCode || event.which;
    const key = event.key;

    return (
      keyCode === BACK_KEYS.BACKSPACE ||
      keyCode === BACK_KEYS.ESCAPE ||
      keyCode === BACK_KEYS.TIZEN_BACK ||
      keyCode === BACK_KEYS.WEBOS_BACK ||
      key === BACK_KEYS.ANDROID_BACK ||
      key === 'Back' ||
      key === 'GoBack'
    );
  }, []);

  // Salvar foco atual no histórico
  const saveFocusState = useCallback(() => {
    const activeElement = document.activeElement;
    const entry: FocusHistoryEntry = {
      path: location.pathname,
      elementId: activeElement?.id || undefined,
      elementIndex: activeElement?.getAttribute('data-nav-index') 
        ? parseInt(activeElement.getAttribute('data-nav-index')!)
        : undefined,
    };
    
    focusHistoryRef.current.push(entry);
    // Manter apenas últimos 10 estados
    if (focusHistoryRef.current.length > 10) {
      focusHistoryRef.current.shift();
    }
  }, [location.pathname]);

  // Restaurar foco anterior
  const restoreFocus = useCallback(() => {
    const lastEntry = focusHistoryRef.current.pop();
    if (!lastEntry) return;

    // Se temos um ID, tentar focar por ID
    if (lastEntry.elementId) {
      const element = document.getElementById(lastEntry.elementId);
      if (element) {
        element.focus();
        return;
      }
    }

    // Se temos um índice, tentar focar por índice
    if (lastEntry.elementIndex !== undefined) {
      const elements = document.querySelectorAll('[data-navigable="true"]');
      if (elements[lastEntry.elementIndex]) {
        (elements[lastEntry.elementIndex] as HTMLElement).focus();
        return;
      }
    }

    // Fallback: focar primeiro elemento navegável
    const firstNavigable = document.querySelector('[data-navigable="true"]') as HTMLElement;
    if (firstNavigable) {
      firstNavigable.focus();
    }
  }, []);

  // Lógica principal de voltar
  const handleBack = useCallback(() => {
    const now = Date.now();
    if (now - lastBackTimeRef.current < DEBOUNCE_MS) {
      return true; // Ignorar debounce
    }
    lastBackTimeRef.current = now;

    // Prioridade 1: Fechar modal/player se estiver aberto
    if (isPlayerOpen && onClosePlayer) {
      onClosePlayer();
      restoreFocus();
      return true;
    }

    if (isModalOpen && onCloseModal) {
      onCloseModal();
      restoreFocus();
      return true;
    }

    // Prioridade 2: Voltar para Home se estiver em página secundária
    const secondaryPages = ['/cinema', '/series', '/favorites', '/search', '/notifications', '/settings'];
    const isSecondaryPage = secondaryPages.some(page => location.pathname.startsWith(page));
    
    if (isSecondaryPage) {
      saveFocusState();
      navigate('/');
      return true;
    }

    // Prioridade 3: Mostrar confirmação de saída se estiver na Home
    if (location.pathname === '/' || location.pathname === '/home') {
      setShowExitConfirmation(true);
      return true;
    }

    return false;
  }, [
    isPlayerOpen, 
    isModalOpen, 
    onClosePlayer, 
    onCloseModal, 
    location.pathname, 
    navigate, 
    saveFocusState, 
    restoreFocus
  ]);

  // Handler de tecla
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isBackKey(event)) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const handled = handleBack();
    if (handled) {
      return false;
    }
  }, [isBackKey, handleBack]);

  // Configurar listeners de tecla
  useEffect(() => {
    // Adicionar listener com captura para garantir prioridade
    window.addEventListener('keydown', handleKeyDown, true);
    
    // Suporte específico para Tizen
    if (typeof window !== 'undefined' && 'tizen' in window) {
      try {
        // @ts-ignore
        window.tizen?.tvinputdevice?.registerKey('Back');
      } catch (e) {
        console.log('Tizen Back key registration failed:', e);
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  // Prevenir saída acidental com history API
  useEffect(() => {
    if (showExitConfirmation) return;

    // Criar estado inicial
    window.history.pushState({ appState: 'cinecasa' }, '', window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      // Prevenir navegação para fora do app
      event.preventDefault();
      
      // Tratar como botão voltar
      const handled = handleBack();
      
      // Recriar o estado para continuar "prendendo" a navegação
      if (!showExitConfirmation) {
        window.history.pushState({ appState: 'cinecasa' }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBack, showExitConfirmation]);

  // Confirmar saída
  const confirmExit = useCallback(() => {
    if (onExitApp) {
      onExitApp();
    } else {
      // Fallback: tentar fechar a janela ou redirecionar
      window.close();
      // Se não conseguir fechar, mostrar mensagem
      alert('Obrigado por usar o CineCasa!');
    }
  }, [onExitApp]);

  // Cancelar saída
  const cancelExit = useCallback(() => {
    setShowExitConfirmation(false);
    // Recriar estado do history
    window.history.pushState({ appState: 'cinecasa' }, '', window.location.href);
  }, []);

  return {
    showExitConfirmation,
    confirmExit,
    cancelExit,
    saveFocusState,
    restoreFocus,
  };
}

export default useGlobalBackHandler;
