import { useEffect, useRef, useState } from 'react';

/**
 * Hook para detectar uso de mouse vs navegação por controle/TV
 * Adiciona classe 'has-mouse' ao body quando mouse é usado
 * Remove quando navegação é por teclado/controle
 */

export function useMouseDetection() {
  const [hasMouse, setHasMouse] = useState(false);
  const lastInputWasMouse = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Ignorar em dispositivos móveis
    if (window.innerWidth < 1024) return;

    // Handler para movimento de mouse
    const handleMouseMove = () => {
      if (!lastInputWasMouse.current) {
        lastInputWasMouse.current = true;
        setHasMouse(true);
        document.body.classList.add('has-mouse');
      }

      // Reset após inatividade do mouse
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        // Manter has-mouse ativo se não houver input de teclado
      }, 30000); // 30 segundos
    };

    // Handler para teclas de navegação (indica controle/teclado)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Se for tecla de navegação (setas, enter), indica uso de controle
      const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace'];
      if (navKeys.includes(e.key)) {
        lastInputWasMouse.current = false;
        // Não remover has-mouse imediatamente, apenas marcar que último input foi teclado
      }
    };

    // Adicionar listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });

    // Inicialmente, assumir que não tem mouse até detectar movimento
    document.body.classList.remove('has-mouse');

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { hasMouse };
}

export default useMouseDetection;
