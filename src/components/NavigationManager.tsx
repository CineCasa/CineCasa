import { useEffect, useRef } from "react";

interface NavigationManagerProps {
  children: React.ReactNode;
}

const NavigationManager = ({ children }: NavigationManagerProps) => {
  const navigationGridRef = useRef<Map<string, HTMLElement[]>>(new Map());
  const currentFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const buildNavigationGrid = () => {
      const grid = new Map<string, HTMLElement[]>();
      
      // Encontrar todos os elementos navegáveis
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      // Agrupar por linha e coluna
      const rows = new Map<number, HTMLElement[]>();
      
      focusableElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const row = Math.round(rect.top / 50); // Aproximar linhas a cada 50px
        
        if (!rows.has(row)) {
          rows.set(row, []);
        }
        rows.get(row)!.push(element);
      });

      // Ordenar elementos por posição horizontal em cada linha
      rows.forEach((elements, row) => {
        elements.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        grid.set(`row-${row}`, elements);
      });

      navigationGridRef.current = grid;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      
      e.preventDefault();
      const currentElement = document.activeElement as HTMLElement;
      if (!currentElement) return;

      const grid = navigationGridRef.current;
      
      // Encontrar posição atual
      let currentRow = '';
      let currentCol = -1;
      
      grid.forEach((elements, rowKey) => {
        const colIndex = elements.indexOf(currentElement);
        if (colIndex !== -1) {
          currentRow = rowKey;
          currentCol = colIndex;
        }
      });

      if (currentRow === '') return;

      const currentRowElements = grid.get(currentRow)!;
      
      switch (e.key) {
        case 'ArrowRight':
          // Navegar para direita na mesma linha
          if (currentCol < currentRowElements.length - 1) {
            const nextElement = currentRowElements[currentCol + 1];
            nextElement.focus();
            nextElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          } else {
            // Ir para primeira coluna da próxima linha
            const rows = Array.from(grid.keys());
            const currentIndex = rows.indexOf(currentRow);
            if (currentIndex < rows.length - 1) {
              const nextRowElements = grid.get(rows[currentIndex + 1])!;
              if (nextRowElements.length > 0) {
                const firstElement = nextRowElements[0];
                firstElement.focus();
                firstElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              }
            }
          }
          break;

        case 'ArrowLeft':
          // Navegar para esquerda na mesma linha
          if (currentCol > 0) {
            const prevElement = currentRowElements[currentCol - 1];
            prevElement.focus();
            prevElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          } else {
            // Ir para última coluna da linha anterior
            const rows = Array.from(grid.keys());
            const currentIndex = rows.indexOf(currentRow);
            if (currentIndex > 0) {
              const prevRowElements = grid.get(rows[currentIndex - 1])!;
              if (prevRowElements.length > 0) {
                const lastElement = prevRowElements[prevRowElements.length - 1];
                lastElement.focus();
                lastElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
              }
            }
          }
          break;

        case 'ArrowDown':
          // Navegar para baixo - mesma coluna ou mais próxima
          const rows = Array.from(grid.keys());
          const currentIndex = rows.indexOf(currentRow);
          
          for (let i = currentIndex + 1; i < rows.length; i++) {
            const nextRowElements = grid.get(rows[i])!;
            if (nextRowElements.length > 0) {
              // Encontrar elemento mais próximo na mesma coluna
              let targetElement = nextRowElements[0];
              let minDistance = Math.abs(targetElement.getBoundingClientRect().left - currentElement.getBoundingClientRect().left);
              
              nextRowElements.forEach(element => {
                const distance = Math.abs(element.getBoundingClientRect().left - currentElement.getBoundingClientRect().left);
                if (distance < minDistance) {
                  minDistance = distance;
                  targetElement = element;
                }
              });
              
              targetElement.focus();
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
              break;
            }
          }
          break;

        case 'ArrowUp':
          // Navegar para cima - mesma coluna ou mais próxima
          const rowsUp = Array.from(grid.keys());
          const currentRowIndex = rowsUp.indexOf(currentRow);
          
          for (let i = currentRowIndex - 1; i >= 0; i--) {
            const prevRowElements = grid.get(rowsUp[i])!;
            if (prevRowElements.length > 0) {
              // Encontrar elemento mais próximo na mesma coluna
              let targetElement = prevRowElements[0];
              let minDistance = Math.abs(targetElement.getBoundingClientRect().left - currentElement.getBoundingClientRect().left);
              
              prevRowElements.forEach(element => {
                const distance = Math.abs(element.getBoundingClientRect().left - currentElement.getBoundingClientRect().left);
                if (distance < minDistance) {
                  minDistance = distance;
                  targetElement = element;
                }
              });
              
              targetElement.focus();
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
              break;
            }
          }
          break;
      }
    };

    const handleTouchNavigation = (e: TouchEvent) => {
      // Implementar navegação por toque swipe
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      
      if (element && element.tabIndex >= 0) {
        element.focus();
      }
    };

    // Construir grid inicial
    buildNavigationGrid();
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchstart', handleTouchNavigation);
    document.addEventListener('resize', buildNavigationGrid);
    
    // Observer para mudanças no DOM
    const observer = new MutationObserver(() => {
      setTimeout(buildNavigationGrid, 100);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['tabindex', 'disabled', 'hidden']
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchstart', handleTouchNavigation);
      document.removeEventListener('resize', buildNavigationGrid);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
};

export default NavigationManager;
