import React, { useEffect, useRef } from 'react';
import useNavigation from '../hooks/useNavigation';

interface NavigationWrapperProps {
  children: React.ReactNode;
  onNavigationActivate?: (isActive: boolean) => void;
}

const NavigationWrapper: React.FC<NavigationWrapperProps> = ({ 
  children, 
  onNavigationActivate 
}) => {
  const { containerRef, isActive, setIsActive } = useNavigation();

  useEffect(() => {
    onNavigationActivate?.(isActive);
  }, [isActive, onNavigationActivate]);

  return (
    <div ref={containerRef} className="navigation-container">
      {children}
    </div>
  );
};

export default NavigationWrapper;
