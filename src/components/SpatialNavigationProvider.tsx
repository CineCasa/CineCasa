import React, { createContext, useContext, useRef, useEffect } from 'react';
import { useSpatialNavigation } from '@/hooks/useSpatialNavigation';

interface SpatialNavigationContextType {
  isEnabled: boolean;
  focusedElement: HTMLElement | null;
  focusElement: (element: HTMLElement) => void;
}

const SpatialNavigationContext = createContext<SpatialNavigationContextType | null>(null);

export function useSpatialNavigationContext() {
  const context = useContext(SpatialNavigationContext);
  if (!context) {
    throw new Error('useSpatialNavigationContext must be used within SpatialNavigationProvider');
  }
  return context;
}

interface SpatialNavigationProviderProps {
  children: React.ReactNode;
}

export function SpatialNavigationProvider({ children }: SpatialNavigationProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isEnabled, focusedElement, focusElement } = useSpatialNavigation(containerRef);

  return (
    <SpatialNavigationContext.Provider value={{ isEnabled, focusedElement, focusElement }}>
      <div ref={containerRef} className="spatial-navigation-container">
        {children}
      </div>
    </SpatialNavigationContext.Provider>
  );
}

export default SpatialNavigationProvider;
