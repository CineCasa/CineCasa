import { useState, useEffect, useCallback, useRef } from 'react';

interface NavigationItem {
  id: string;
  element: HTMLElement;
  row: number;
  col: number;
  disabled?: boolean;
}

interface KeyboardNavigationOptions {
  items: NavigationItem[];
  onSelect?: (item: NavigationItem) => void;
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
  wrapAround?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'grid';
  autoFocus?: boolean;
}

export function useKeyboardNavigation({
  items,
  onSelect,
  onNavigate,
  wrapAround = true,
  orientation = 'horizontal',
  autoFocus = false,
}: KeyboardNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);
  const containerRef = useRef<HTMLElement>(null);

  // Mapear itens para navegação
  const itemMap = useRef<Map<string, NavigationItem>>(new Map());
  const itemsByRow = useRef<Map<number, NavigationItem[]>>(new Map());
  const itemsByCol = useRef<Map<number, NavigationItem[]>>(new Map());

  useEffect(() => {
    // Atualizar mapeamento de itens
    const newMap = new Map<string, NavigationItem>();
    const rowMap = new Map<number, NavigationItem[]>();
    const colMap = new Map<number, NavigationItem[]>();

    items.forEach(item => {
      newMap.set(item.id, item);
      
      if (!rowMap.has(item.row)) {
        rowMap.set(item.row, []);
      }
      rowMap.get(item.row)!.push(item);
      
      if (!colMap.has(item.col)) {
        colMap.set(item.col, []);
      }
      colMap.get(item.col)!.push(item);
    });

    itemMap.current = newMap;
    itemsByRow.current = rowMap;
    itemsByCol.current = colMap;

    // Auto focus no mount
    if (autoFocus && items.length > 0) {
      setSelectedIndex(0);
      const firstItem = items[0];
      setFocusedRow(firstItem.row);
      setFocusedCol(firstItem.col);
      firstItem.element.focus();
    }
  }, [items, autoFocus]);

  // Navegação por teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const currentItem = items[selectedIndex];
    if (!currentItem || currentItem.disabled) return;

    let newIndex = selectedIndex;
    let newRow = focusedRow;
    let newCol = focusedCol;
    let navigated = false;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (orientation === 'vertical' || orientation === 'grid') {
          const itemsInCol = itemsByCol.current.get(focusedCol) || [];
          const itemsAbove = itemsInCol.filter(item => item.row < focusedRow);
          
          if (itemsAbove.length > 0) {
            newIndex = items.findIndex(item => item.id === itemsAbove[itemsAbove.length - 1].id);
            newRow = itemsAbove[itemsAbove.length - 1].row;
            navigated = true;
          } else if (wrapAround) {
            const itemsInCol = itemsByCol.current.get(focusedCol) || [];
            const lastItem = itemsInCol[itemsInCol.length - 1];
            newIndex = items.findIndex(item => item.id === lastItem.id);
            newRow = lastItem.row;
            navigated = true;
          }
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (orientation === 'vertical' || orientation === 'grid') {
          const itemsInCol = itemsByCol.current.get(focusedCol) || [];
          const itemsBelow = itemsInCol.filter(item => item.row > focusedRow);
          
          if (itemsBelow.length > 0) {
            newIndex = items.findIndex(item => item.id === itemsBelow[0].id);
            newRow = itemsBelow[0].row;
            navigated = true;
          } else if (wrapAround) {
            const itemsInCol = itemsByCol.current.get(focusedCol) || [];
            const firstItem = itemsInCol[0];
            newIndex = items.findIndex(item => item.id === firstItem.id);
            newRow = firstItem.row;
            navigated = true;
          }
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (orientation === 'horizontal' || orientation === 'grid') {
          const itemsInRow = itemsByRow.current.get(focusedRow) || [];
          const itemsLeft = itemsInRow.filter(item => item.col < focusedCol);
          
          if (itemsLeft.length > 0) {
            newIndex = items.findIndex(item => item.id === itemsLeft[itemsLeft.length - 1].id);
            newCol = itemsLeft[itemsLeft.length - 1].col;
            navigated = true;
          } else if (wrapAround) {
            const itemsInRow = itemsByRow.current.get(focusedRow) || [];
            const lastItem = itemsInRow[itemsInRow.length - 1];
            newIndex = items.findIndex(item => item.id === lastItem.id);
            newCol = lastItem.col;
            navigated = true;
          }
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (orientation === 'horizontal' || orientation === 'grid') {
          const itemsInRow = itemsByRow.current.get(focusedRow) || [];
          const itemsRight = itemsInRow.filter(item => item.col > focusedCol);
          
          if (itemsRight.length > 0) {
            newIndex = items.findIndex(item => item.id === itemsRight[0].id);
            newCol = itemsRight[0].col;
            navigated = true;
          } else if (wrapAround) {
            const itemsInRow = itemsByRow.current.get(focusedRow) || [];
            const firstItem = itemsInRow[0];
            newIndex = items.findIndex(item => item.id === firstItem.id);
            newCol = firstItem.col;
            navigated = true;
          }
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentItem && !currentItem.disabled) {
          onSelect?.(currentItem);
        }
        break;

      case 'Home':
        e.preventDefault();
        newIndex = 0;
        newRow = items[0]?.row || 0;
        newCol = items[0]?.col || 0;
        navigated = true;
        break;

      case 'End':
        e.preventDefault();
        newIndex = items.length - 1;
        const lastItem = items[items.length - 1];
        newRow = lastItem?.row || 0;
        newCol = lastItem?.col || 0;
        navigated = true;
        break;

      case 'PageUp':
        e.preventDefault();
        if (orientation === 'vertical' || orientation === 'grid') {
          const itemsInCol = itemsByCol.current.get(focusedCol) || [];
          const itemsAbove = itemsInCol.filter(item => item.row < focusedRow);
          
          if (itemsAbove.length > 0) {
            newIndex = items.findIndex(item => item.id === itemsAbove[Math.max(0, itemsAbove.length - 5)].id);
            newRow = itemsAbove[Math.max(0, itemsAbove.length - 5)].row;
            navigated = true;
          }
        }
        break;

      case 'PageDown':
        e.preventDefault();
        if (orientation === 'vertical' || orientation === 'grid') {
          const itemsInCol = itemsByCol.current.get(focusedCol) || [];
          const itemsBelow = itemsInCol.filter(item => item.row > focusedRow);
          
          if (itemsBelow.length > 0) {
            newIndex = items.findIndex(item => item.id === itemsBelow[Math.min(4, itemsBelow.length - 1)].id);
            newRow = itemsBelow[Math.min(4, itemsBelow.length - 1)].row;
            navigated = true;
          }
        }
        break;

      case 'Tab':
        if (!e.shiftKey) {
          e.preventDefault();
          const itemsInRow = itemsByRow.current.get(focusedRow) || [];
          const itemsRight = itemsInRow.filter(item => item.col > focusedCol);
          
          if (itemsRight.length > 0) {
            newIndex = items.findIndex(item => item.id === itemsRight[0].id);
            newCol = itemsRight[0].col;
            navigated = true;
          } else if (wrapAround) {
            const itemsInRow = itemsByRow.current.get(focusedRow) || [];
            const firstItem = itemsInRow[0];
            newIndex = items.findIndex(item => item.id === firstItem.id);
            newCol = firstItem.col;
            navigated = true;
          }
        }
        break;

      case 'Tab' + 'Shift':
        e.preventDefault();
        const itemsInRow = itemsByRow.current.get(focusedRow) || [];
        const itemsLeft = itemsInRow.filter(item => item.col < focusedCol);
        
        if (itemsLeft.length > 0) {
          newIndex = items.findIndex(item => item.id === itemsLeft[itemsLeft.length - 1].id);
          newCol = itemsLeft[itemsLeft.length - 1].col;
          navigated = true;
        } else if (wrapAround) {
          const itemsInRow = itemsByRow.current.get(focusedRow) || [];
          const lastItem = itemsInRow[itemsInRow.length - 1];
          newIndex = items.findIndex(item => item.id === lastItem.id);
          newCol = lastItem.col;
          navigated = true;
        }
        break;

      case 'Escape':
        e.preventDefault();
        // Limpar seleção
        setSelectedIndex(-1);
        containerRef.current?.blur();
        break;
    }

    // Atualizar estado e foco
    if (navigated && newIndex >= 0 && newIndex < items.length) {
      setSelectedIndex(newIndex);
      setFocusedRow(newRow);
      setFocusedCol(newCol);
      
      const newItem = items[newIndex];
      newItem.element.focus();
      
      onNavigate?.(e.key.replace('Arrow', '').toLowerCase() as any);
    }
  }, [items, selectedIndex, focusedRow, focusedCol, itemsByRow, itemsByCol, onSelect, onNavigate, wrapAround]);

  // Foco com mouse
  const handleMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
    const item = items[index];
    setFocusedRow(item.row);
    setFocusedCol(item.col);
  }, [items]);

  // Foco programático
  const focusItem = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setSelectedIndex(index);
      const item = items[index];
      setFocusedRow(item.row);
      setFocusedCol(item.col);
      item.element.focus();
    }
  }, [items]);

  // Limpar foco
  const clearFocus = useCallback(() => {
    setSelectedIndex(-1);
    containerRef.current?.blur();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    container.setAttribute('tabindex', '0');
    container.setAttribute('role', orientation === 'grid' ? 'grid' : 'list');

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeAttribute('tabindex');
      container.removeAttribute('role');
    };
  }, [handleKeyDown, orientation]);

  return {
    // Estado
    selectedIndex,
    focusedRow,
    focusedCol,
    selectedItem: items[selectedIndex] || null,
    
    // Ações
    focusItem,
    clearFocus,
    setItems: (newItems: NavigationItem[]) => {
      // Resetar navegação com novos itens
      setSelectedIndex(0);
      setFocusedRow(newItems[0]?.row || 0);
      setFocusedCol(newItems[0]?.col || 0);
    },
    
    // Refs
    containerRef,
    itemMap: itemMap.current,
    itemsByRow: itemsByRow.current,
    itemsByCol: itemsByCol.current,
  };
}

// Hook para roving tabindex
export function useRovingIndex(items: HTMLElement[], options: { orientation?: 'horizontal' | 'vertical' } = {}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { orientation = 'horizontal' } = options;

    switch (e.key) {
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          e.preventDefault();
          setActiveIndex(prev => prev > 0 ? prev - 1 : items.length - 1);
        }
        break;
      case 'ArrowUp':
        if (orientation === 'vertical') {
          e.preventDefault();
          setActiveIndex(prev => prev > 0 ? prev - 1 : items.length - 1);
        }
        break;
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          e.preventDefault();
          setActiveIndex(prev => prev < items.length - 1 ? prev + 1 : 0);
        }
        break;
      case 'ArrowDown':
        if (orientation === 'vertical') {
          e.preventDefault();
          setActiveIndex(prev => prev < items.length - 1 ? prev + 1 : 0);
        }
        break;
    }
  }, [items, options.orientation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    // Focar item ativo
    if (activeIndex >= 0 && activeIndex < items.length) {
      items[activeIndex]?.focus();
    }
  }, [activeIndex, items]);

  return {
    activeIndex,
    setActiveIndex,
    containerRef,
  };
}
