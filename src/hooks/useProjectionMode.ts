import { useEffect, useState, useCallback } from 'react';

/**
 * Hook para gerenciar modo de projeção cinema (telas 4K/200 polegadas)
 * Ativa automaticamente em telas ultra-largas (2560px+)
 * Adiciona classe 'projection-mode' ao html para aplicar estilos específicos
 */

const PROJECTION_THRESHOLD = 2560;
const STORAGE_KEY = 'cinecasa-projection-mode';

export function useProjectionMode() {
  const [isProjectionMode, setIsProjectionMode] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Verificar se é tela grande
  const checkScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const isLarge = width >= PROJECTION_THRESHOLD;
    setIsLargeScreen(isLarge);
    return isLarge;
  }, []);

  // Ativar/desativar modo projeção
  const setProjectionMode = useCallback((enabled: boolean) => {
    setIsProjectionMode(enabled);
    
    if (enabled) {
      document.documentElement.classList.add('projection-mode');
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      document.documentElement.classList.remove('projection-mode');
      localStorage.setItem(STORAGE_KEY, 'false');
    }
  }, []);

  // Toggle modo projeção
  const toggleProjectionMode = useCallback(() => {
    setProjectionMode(!isProjectionMode);
  }, [isProjectionMode, setProjectionMode]);

  // Inicializar - verificar preferência salva ou tamanho da tela
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY);
    const isLarge = checkScreenSize();
    
    if (savedMode === 'true') {
      setProjectionMode(true);
    } else if (savedMode === 'false') {
      setProjectionMode(false);
    } else {
      // Auto-detect baseado no tamanho da tela
      setProjectionMode(isLarge);
    }
  }, [checkScreenSize, setProjectionMode]);

  // Listener para resize
  useEffect(() => {
    const handleResize = () => {
      const isLarge = checkScreenSize();
      
      // Se o usuário não definiu manualmente, auto-ajusta
      const savedMode = localStorage.getItem(STORAGE_KEY);
      if (savedMode === null) {
        setProjectionMode(isLarge);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScreenSize, setProjectionMode]);

  // Atalho de teclado: Ctrl+P para toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        toggleProjectionMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleProjectionMode]);

  return {
    isProjectionMode,
    isLargeScreen,
    setProjectionMode,
    toggleProjectionMode,
  };
}

export default useProjectionMode;
