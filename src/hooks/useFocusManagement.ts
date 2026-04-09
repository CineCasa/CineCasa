import { useState, useEffect, useCallback, useRef } from 'react';

interface FocusableElement {
  id: string;
  element: HTMLElement;
  disabled?: boolean;
  priority?: number;
}

interface FocusTrapOptions {
  container?: HTMLElement | null;
  initialFocus?: string;
  restoreFocus?: boolean;
  onEscape?: () => void;
}

interface FocusRegion {
  start: number;
  end: number;
  elements: FocusableElement[];
}

export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [focusHistory, setFocusHistory] = useState<string[]>([]);
  const focusRegions = useRef<Map<string, FocusRegion>>(new Map());

  // Detectar elemento focado
  const handleFocusIn = useCallback((element: HTMLElement) => {
    const id = element.id || element.getAttribute('data-focus-id') || '';
    setFocusedElement(id);
    setFocusHistory(prev => [...prev.slice(-9), id]); // Manter últimas 10
  }, []);

  const handleFocusOut = useCallback(() => {
    setFocusedElement(null);
  }, []);

  // Foco em elemento específico
  const focusElement = useCallback((element: HTMLElement | string) => {
    const el = typeof element === 'string' 
      ? document.getElementById(element) 
      : element;
    
    if (el) {
      el.focus();
      handleFocusIn(el);
    }
  }, [handleFocusIn]);

  // Próximo elemento focável
  const focusNext = useCallback((direction: 'forward' | 'backward' = 'forward') => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusedElement 
      ? focusableElements.findIndex(el => 
          el.id === focusedElement || el.getAttribute('data-focus-id') === focusedElement)
        : -1;

    let nextIndex;
    if (direction === 'forward') {
      nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
    }

    const nextElement = focusableElements[nextIndex];
    if (nextElement && !nextElement.disabled) {
      nextElement.element.focus();
    }
  }, [focusedElement]);

  // Foco baseado em região
  const focusRegion = useCallback((regionId: string, direction: 'forward' | 'backward' = 'forward') => {
    const region = focusRegions.current.get(regionId);
    if (!region) return;

    const currentIndex = focusedElement 
      ? region.elements.findIndex(el => el.id === focusedElement)
      : -1;

    let nextIndex;
    if (direction === 'forward') {
      nextIndex = currentIndex < region.elements.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : region.elements.length - 1;
    }

    const nextElement = region.elements[nextIndex];
    if (nextElement && !nextElement.disabled) {
      nextElement.element.focus();
    }
  }, [focusedElement]);

  // Criar região de foco
  const createFocusRegion = useCallback((id: string, elements: FocusableElement[]) => {
    focusRegions.current.set(id, {
      start: 0,
      end: elements.length - 1,
      elements: elements.sort((a, b) => (a.priority || 0) - (b.priority || 0)),
    });
  }, []);

  // Focus trap (modal, dropdown, etc)
  const useFocusTrap = useCallback(({
    container,
    initialFocus,
    restoreFocus = true,
    onEscape,
  }: FocusTrapOptions) => {
    const previousActiveElement = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();

        const focusableElements = container 
          ? getFocusableElementsInContainer(container)
          : getFocusableElements();

        const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

        let nextIndex;
        if (e.shiftKey) {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
        } else {
          nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
        }

        const nextElement = focusableElements[nextIndex];
        if (nextElement) {
          nextElement.element.focus();
        }
      } else if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (!container?.contains(e.relatedTarget as Node)) {
        // Foco saiu do container
        if (restoreFocus && previousActiveElement) {
          setTimeout(() => previousActiveElement.focus(), 0);
        }
      }
    };

    // Setup
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.addEventListener('focusout', handleFocusOut);
    }

    // Foco inicial
    if (initialFocus) {
      setTimeout(() => {
        const element = document.getElementById(initialFocus);
        if (element) {
          element.focus();
        }
      }, 100);
    }

    // Cleanup
    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
        container.removeEventListener('focusout', handleFocusOut);
      }
    };
  }, []);

  // Gerenciar foco para leitores de tela
  const manageAriaLive = useCallback((element: HTMLElement, message: string, priority: 'polite' | 'assertive' | 'off' = 'polite') => {
    element.setAttribute('aria-live', priority);
    element.setAttribute('aria-atomic', 'true');
    
    // Anunciar para leitores de tela
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remover após anúncio
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Limpar foco
  const clearFocus = useCallback(() => {
    if (document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    setFocusedElement(null);
  }, []);

  // Verificar se elemento está focado
  const isElementFocused = useCallback((element: HTMLElement) => {
    return document.activeElement === element;
  }, []);

  // Adicionar atributos de acessibilidade
  const setupAccessibilityAttributes = useCallback((element: HTMLElement, options: {
    role?: string;
    label?: string;
    describedBy?: string;
    expanded?: boolean;
    selected?: boolean;
    disabled?: boolean;
  }) => {
    if (options.role) {
      element.setAttribute('role', options.role);
    }
    
    if (options.label) {
      element.setAttribute('aria-label', options.label);
    }
    
    if (options.describedBy) {
      element.setAttribute('aria-describedby', options.describedBy);
    }
    
    if (options.expanded !== undefined) {
      element.setAttribute('aria-expanded', options.expanded.toString());
    }
    
    if (options.selected !== undefined) {
      element.setAttribute('aria-selected', options.selected.toString());
    }
    
    if (options.disabled) {
      element.setAttribute('aria-disabled', 'true');
      element.setAttribute('tabindex', '-1');
    } else {
      element.setAttribute('aria-disabled', 'false');
      element.setAttribute('tabindex', '0');
    }
  }, []);

  // Obter elementos focáveis
  const getFocusableElements = useCallback((): HTMLElement[] => {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }, []);

  // Obter elementos focáveis em container específico
  const getFocusableElementsInContainer = useCallback((container: HTMLElement): HTMLElement[] => {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
  }, []);

  return {
    // Estado
    focusedElement,
    focusHistory,
    focusRegions: focusRegions.current,
    
    // Ações principais
    focusElement,
    focusNext,
    focusRegion,
    createFocusRegion,
    
    // Focus trap
    useFocusTrap,
    
    // Acessibilidade
    manageAriaLive,
    clearFocus,
    isElementFocused,
    setupAccessibilityAttributes,
    getFocusableElements,
    getFocusableElementsInContainer,
    
    // Event handlers
    handleFocusIn,
    handleFocusOut,
  };
}
