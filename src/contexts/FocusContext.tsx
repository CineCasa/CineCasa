import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface FocusPosition {
  row: number;
  col: number;
}

interface FocusContextType {
  currentPosition: FocusPosition;
  setCurrentPosition: (pos: FocusPosition) => void;
  registerCard: (row: number, col: number, element: HTMLElement) => void;
  unregisterCard: (row: number, col: number) => void;
  getCardAt: (row: number, col: number) => HTMLElement | null;
  getCardsInRow: (row: number) => HTMLElement[];
  getTotalRows: () => number;
  focusCard: (row: number, col: number) => void;
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
  isSmartTV: boolean;
}

const FocusContext = createContext<FocusContextType | null>(null);

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within FocusProvider');
  }
  return context;
};

export const FocusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPosition, setCurrentPositionState] = useState<FocusPosition>({ row: 0, col: 0 });
  const cardsRef = useRef<Map<string, HTMLElement>>(new Map());
  const isSmartTV = useRef(false);

  // Detectar se é Smart TV ou dispositivo com controle remoto
  useEffect(() => {
    const detectSmartTV = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTV = /smart-tv|smarttv|appletv|googletv|hbbtv|pov_tv|netcast.tv|tizen|webos|playstation|xbox|nintendo/i.test(userAgent);
      const hasNoTouch = !('ontouchstart' in window);
      const isLargeScreen = window.innerWidth >= 1024;
      
      isSmartTV.current = isTV || (hasNoTouch && isLargeScreen);
      
      if (isSmartTV.current) {
        document.body.classList.add('smart-tv-mode');
      }
    };
    
    detectSmartTV();
    window.addEventListener('resize', detectSmartTV);
    return () => window.removeEventListener('resize', detectSmartTV);
  }, []);

  const getKey = (row: number, col: number) => `${row}-${col}`;

  const registerCard = useCallback((row: number, col: number, element: HTMLElement) => {
    cardsRef.current.set(getKey(row, col), element);
  }, []);

  const unregisterCard = useCallback((row: number, col: number) => {
    cardsRef.current.delete(getKey(row, col));
  }, []);

  const getCardAt = useCallback((row: number, col: number) => {
    return cardsRef.current.get(getKey(row, col)) || null;
  }, []);

  const getCardsInRow = useCallback((row: number) => {
    const cards: HTMLElement[] = [];
    cardsRef.current.forEach((element, key) => {
      if (key.startsWith(`${row}-`)) {
        cards.push(element);
      }
    });
    return cards.sort((a, b) => {
      const aCol = parseInt(a.getAttribute('data-col') || '0');
      const bCol = parseInt(b.getAttribute('data-col') || '0');
      return aCol - bCol;
    });
  }, []);

  const getTotalRows = useCallback(() => {
    const rows = new Set<number>();
    cardsRef.current.forEach((_, key) => {
      const row = parseInt(key.split('-')[0]);
      rows.add(row);
    });
    return Math.max(...rows, 0);
  }, []);

  const focusCard = useCallback((row: number, col: number) => {
    const element = getCardAt(row, col);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setCurrentPositionState({ row, col });
    }
  }, [getCardAt]);

  const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const { row, col } = currentPosition;
    let newRow = row;
    let newCol = col;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, row - 1);
        break;
      case 'down':
        newRow = row + 1;
        break;
      case 'left':
        newCol = Math.max(0, col - 1);
        break;
      case 'right':
        newCol = col + 1;
        break;
    }

    // Verificar se existe card na nova posição
    const targetCard = getCardAt(newRow, newCol);
    if (targetCard) {
      focusCard(newRow, newCol);
    } else if (direction === 'down') {
      // Se não houver card abaixo, tentar encontrar o próximo card em qualquer coluna
      const cardsInNextRow = getCardsInRow(newRow);
      if (cardsInNextRow.length > 0) {
        const closestCard = cardsInNextRow.reduce((prev, curr) => {
          const prevCol = parseInt(prev.getAttribute('data-col') || '0');
          const currCol = parseInt(curr.getAttribute('data-col') || '0');
          return Math.abs(currCol - col) < Math.abs(prevCol - col) ? curr : prev;
        });
        const closestCol = parseInt(closestCard.getAttribute('data-col') || '0');
        focusCard(newRow, closestCol);
      }
    }
  }, [currentPosition, getCardAt, getCardsInRow, focusCard]);

  const setCurrentPosition = useCallback((pos: FocusPosition) => {
    setCurrentPositionState(pos);
  }, []);

  return (
    <FocusContext.Provider
      value={{
        currentPosition,
        setCurrentPosition,
        registerCard,
        unregisterCard,
        getCardAt,
        getCardsInRow,
        getTotalRows,
        focusCard,
        moveFocus,
        isSmartTV: isSmartTV.current,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};
