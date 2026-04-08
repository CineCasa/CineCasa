import { useEffect, useRef, useState, useCallback } from 'react';
import { RefObject } from 'react';

interface NavigableItem {
  element: HTMLElement;
  row: number;
  col: number;
  section: string;
  index: number;
}

interface NavigationPosition {
  row: number;
  col: number;
  section: string;
}

const useNavigation = <T extends HTMLElement = HTMLDivElement>() => {
  const [currentPosition, setCurrentPosition] = useState<NavigationPosition | null>(null);
  const [navigableItems, setNavigableItems] = useState<NavigableItem[]>([]);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<T>(null);

  // Detectar tipo de dispositivo
  const getDeviceType = useCallback(() => {
    const ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return 'mobile';
    } else if (/TV|SmartTV|Internet TV|NetTV|Apple TV|Google TV|Chromecast/i.test(ua)) {
      return 'tv';
    }
    return 'desktop';
  }, []);

  // Registrar elementos navegáveis
  const registerNavigableItems = useCallback(() => {
    if (!containerRef.current) return;

    const items: NavigableItem[] = [];
    const sections = containerRef.current.querySelectorAll('[data-nav-section]');
    
    sections.forEach((section, sectionIndex) => {
      const sectionName = section.getAttribute('data-nav-section') || `section-${sectionIndex}`;
      const navigableElements = section.querySelectorAll('[data-navigable]');
      
      // Detectar layout (grid vs flex)
      const isGrid = window.getComputedStyle(section as HTMLElement).display.includes('grid');
      
      if (isGrid) {
        // Para layouts grid, calcular colunas automaticamente
        const computedStyle = window.getComputedStyle(section as HTMLElement);
        const gridColumns = computedStyle.gridTemplateColumns.split(' ').filter(col => col !== 'auto').length;
        
        navigableElements.forEach((element, index) => {
          const row = Math.floor(index / gridColumns);
          const col = index % gridColumns;
          
          if (element instanceof HTMLElement) {
            items.push({
              element,
              row,
              col,
              section: sectionName,
              index
            });
          }
        });
      } else {
        // Para layouts flex (scroll horizontal), tratar como uma linha
        navigableElements.forEach((element, index) => {
          if (element instanceof HTMLElement) {
            items.push({
              element,
              row: 0,
              col: index,
              section: sectionName,
              index
            });
          }
        });
      }
    });

    setNavigableItems(items);
    
    // Definir posição inicial se não houver
    if (items.length > 0 && !currentPosition) {
      const firstItem = items[0];
      setCurrentPosition({
        row: firstItem.row,
        col: firstItem.col,
        section: firstItem.section
      });
    }
  }, [currentPosition]);

  // Encontrar item por posição
  const findItemByPosition = useCallback((row: number, col: number, section: string): NavigableItem | null => {
    return navigableItems.find(item => 
      item.row === row && 
      item.col === col && 
      item.section === section
    ) || null;
  }, [navigableItems]);

  // Navegar para posição específica
  const navigateTo = useCallback((row: number, col: number, section: string) => {
    const item = findItemByPosition(row, col, section);
    if (item) {
      // Remover foco do item anterior
      navigableItems.forEach(navItem => {
        navItem.element.classList.remove('nav-focused');
        navItem.element.setAttribute('aria-selected', 'false');
      });

      // Adicionar foco ao novo item
      item.element.classList.add('nav-focused');
      item.element.setAttribute('aria-selected', 'true');
      item.element.focus();
      
      // Scroll para o item se necessário
      item.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });

      setCurrentPosition({ row, col, section });
      return true;
    }
    return false;
  }, [findItemByPosition, navigableItems]);

  // Navegar nas 4 direções
  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!currentPosition || !isActive) return false;

    const { row, col, section } = currentPosition;
    const currentSectionItems = navigableItems.filter(item => item.section === section);
    
    if (currentSectionItems.length === 0) return false;

    // Detectar se é grid ou flex
    const isGrid = currentSectionItems.some(item => item.row > 0);
    let newRow = row;
    let newCol = col;
    let newSection = section;

    switch (direction) {
      case 'up':
        if (isGrid && row > 0) {
          newRow = row - 1;
        } else {
          // Mudar para seção anterior
          const sections = [...new Set(navigableItems.map(item => item.section))];
          const currentSectionIndex = sections.indexOf(section);
          if (currentSectionIndex > 0) {
            newSection = sections[currentSectionIndex - 1];
            const prevSectionItems = navigableItems.filter(item => item.section === newSection);
            const lastItem = prevSectionItems[prevSectionItems.length - 1];
            newRow = lastItem.row;
            newCol = lastItem.col;
          }
        }
        break;

      case 'down':
        if (isGrid) {
          // Tentar encontrar item na próxima linha
          const nextRowItem = findItemByPosition(row + 1, col, section);
          if (nextRowItem) {
            newRow = row + 1;
          } else {
            // Mudar para próxima seção
            const sections = [...new Set(navigableItems.map(item => item.section))];
            const currentSectionIndex = sections.indexOf(section);
            if (currentSectionIndex < sections.length - 1) {
              newSection = sections[currentSectionIndex + 1];
              newRow = 0;
              newCol = 0;
            }
          }
        } else {
          // Para layouts flex, ir para próxima seção
          const sections = [...new Set(navigableItems.map(item => item.section))];
          const currentSectionIndex = sections.indexOf(section);
          if (currentSectionIndex < sections.length - 1) {
            newSection = sections[currentSectionIndex + 1];
            newRow = 0;
            newCol = 0;
          }
        }
        break;

      case 'left':
        if (col > 0) {
          newCol = col - 1;
        } else {
          // Ir para o último item da linha/seção anterior
          if (isGrid && row > 0) {
            newRow = row - 1;
            const prevRowItems = currentSectionItems.filter(item => item.row === newRow);
            newCol = Math.max(...prevRowItems.map(item => item.col));
          } else {
            // Mudar para seção anterior, último item
            const sections = [...new Set(navigableItems.map(item => item.section))];
            const currentSectionIndex = sections.indexOf(section);
            if (currentSectionIndex > 0) {
              newSection = sections[currentSectionIndex - 1];
              const prevSectionItems = navigableItems.filter(item => item.section === newSection);
              const lastItem = prevSectionItems[prevSectionItems.length - 1];
              newRow = lastItem.row;
              newCol = lastItem.col;
            }
          }
        }
        break;

      case 'right':
        const nextColItem = findItemByPosition(row, col + 1, section);
        if (nextColItem) {
          newCol = col + 1;
        } else {
          // Ir para primeira item da próxima linha/seção
          if (isGrid) {
            const nextRowItem = findItemByPosition(row + 1, 0, section);
            if (nextRowItem) {
              newRow = row + 1;
              newCol = 0;
            } else {
              // Mudar para próxima seção
              const sections = [...new Set(navigableItems.map(item => item.section))];
              const currentSectionIndex = sections.indexOf(section);
              if (currentSectionIndex < sections.length - 1) {
                newSection = sections[currentSectionIndex + 1];
                newRow = 0;
                newCol = 0;
              }
            }
          } else {
            // Para layouts flex, ir para próxima seção
            const sections = [...new Set(navigableItems.map(item => item.section))];
            const currentSectionIndex = sections.indexOf(section);
            if (currentSectionIndex < sections.length - 1) {
              newSection = sections[currentSectionIndex + 1];
              newRow = 0;
              newCol = 0;
            }
          }
        }
        break;
    }

    return navigateTo(newRow, newCol, newSection);
  }, [currentPosition, isActive, findItemByPosition, navigateTo, navigableItems]);

  // Lidar com eventos de teclado
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const deviceType = getDeviceType();
    
    // Ativar navegação com qualquer seta ou tecla de navegação
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const tvKeys = ['Up', 'Down', 'Left', 'Right'];
    const allKeys = [...navigationKeys, ...tvKeys];

    if (allKeys.includes(event.key)) {
      event.preventDefault();
      
      if (!isActive) {
        setIsActive(true);
        registerNavigableItems();
        return;
      }

      let direction: 'up' | 'down' | 'left' | 'right';
      
      if (event.key === 'ArrowUp' || event.key === 'Up') direction = 'up';
      else if (event.key === 'ArrowDown' || event.key === 'Down') direction = 'down';
      else if (event.key === 'ArrowLeft' || event.key === 'Left') direction = 'left';
      else direction = 'right';

      navigate(direction);
    }

    // Enter/Space para selecionar
    if ((event.key === 'Enter' || event.key === ' ') && isActive) {
      event.preventDefault();
      const focusedElement = document.querySelector('.nav-focused') as HTMLElement;
      if (focusedElement) {
        focusedElement.click();
      }
    }

    // Escape para desativar navegação
    if (event.key === 'Escape' && isActive) {
      event.preventDefault();
      setIsActive(false);
      navigableItems.forEach(item => {
        item.element.classList.remove('nav-focused');
        item.element.setAttribute('aria-selected', 'false');
      });
    }
  }, [isActive, navigate, registerNavigableItems, navigableItems, getDeviceType]);

  // Setup de event listeners
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => handleKeyDown(e);
    const handleResize = () => {
      if (isActive) {
        registerNavigableItems();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Registrar items iniciais
    if (containerRef.current) {
      registerNavigableItems();
    }

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleKeyDown, registerNavigableItems, isActive]);

  // Observer para mudanças no DOM
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new MutationObserver(() => {
      if (isActive) {
        registerNavigableItems();
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-navigable', 'data-nav-section']
    });

    return () => observer.disconnect();
  }, [registerNavigableItems, isActive]);

  return {
    containerRef,
    isActive,
    setIsActive,
    currentPosition,
    navigate,
    navigableItems
  };
};

export default useNavigation;
