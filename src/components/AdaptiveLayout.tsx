import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AdaptiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  layouts?: {
    xs?: React.ReactNode;
    sm?: React.ReactNode;
    md?: React.ReactNode;
    lg?: React.ReactNode;
    xl?: React.ReactNode;
    '2xl'?: React.ReactNode;
  };
}

export function AdaptiveLayout({ 
  children, 
  className,
  breakpoint = 'md',
  layouts 
}: AdaptiveLayoutProps) {
  const currentBreakpoint = useBreakpoint();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Layout específico por breakpoint
  if (layouts && currentBreakpoint && layouts[currentBreakpoint]) {
    return (
      <div className={cn('w-full', className)}>
        {layouts[currentBreakpoint]}
      </div>
    );
  }

  // Layout responsivo com classes
  const layoutClasses = cn(
    'w-full transition-all duration-300 ease-in-out',
    'layout-adaptive',
    className
  );

  // Ajustes específicos por breakpoint
  const responsiveStyles = {
    xs: 'max-w-full px-2 py-1 text-sm',
    sm: 'max-w-md px-3 py-2 text-base',
    md: 'max-w-lg px-4 py-3 text-lg',
    lg: 'max-w-xl px-6 py-4 text-xl',
    xl: 'max-w-2xl px-8 py-6 text-2xl',
    '2xl': 'max-w-7xl px-12 py-8 text-3xl',
  };

  return (
    <div 
      className={cn(
        layoutClasses,
        responsiveStyles[currentBreakpoint]
      )}
    >
      {children}
    </div>
  );
}

// Componente para grid responsivo
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = { xs: '2', sm: '3', md: '4', lg: '6', xl: '8', '2xl': '12' }
}: ResponsiveGridProps) {
  const currentBreakpoint = useBreakpoint();

  const gridClasses = cn(
    'grid',
    // Colunas responsivas
    `grid-cols-${cols[currentBreakpoint] || cols.md}`,
    // Espaçamento responsivo
    `gap-${gap[currentBreakpoint] || gap.md}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Componente para container responsivo
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  fluid?: boolean;
  center?: boolean;
}

export function ResponsiveContainer({ 
  children, 
  className,
  fluid = false,
  center = false 
}: ResponsiveContainerProps) {
  const currentBreakpoint = useBreakpoint();

  const containerClasses = cn(
    'container',
    fluid && 'container-fluid',
    center && 'container-center',
    className
  );

  // Container com largura máxima baseada no breakpoint
  const maxWidth = {
    xs: '100%',
    sm: '100%',
    md: fluid ? '100%' : '736px',
    lg: fluid ? '100%' : '992px',
    xl: fluid ? '100%' : '1248px',
    '2xl': fluid ? '100%' : '1504px',
  };

  const containerStyle = fluid ? {} : {
    maxWidth: maxWidth[currentBreakpoint] || maxWidth.md,
  };

  return (
    <div 
      className={containerClasses}
      style={containerStyle}
    >
      {children}
    </div>
  );
}

// Componente para texto responsivo
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  size?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  weight?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
}

export function ResponsiveText({ 
  children, 
  className,
  as: Component = 'p',
  size,
  weight 
}: ResponsiveTextProps) {
  const currentBreakpoint = useBreakpoint();

  const textClasses = cn(
    // Tamanho responsivo
    size?.[currentBreakpoint] || size?.md || 'text-base',
    // Peso responsivo
    weight?.[currentBreakpoint] || weight?.md || 'font-normal',
    className
  );

  return (
    <Component className={textClasses}>
      {children}
    </Component>
  );
}

// Componente para mostrar/ocultar por breakpoint
interface ResponsiveVisibilityProps {
  children: React.ReactNode;
  show?: {
    xs?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
  hide?: {
    xs?: boolean;
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
    xl?: boolean;
    '2xl'?: boolean;
  };
}

export function ResponsiveVisibility({ 
  children, 
  show,
  hide 
}: ResponsiveVisibilityProps) {
  const currentBreakpoint = useBreakpoint();

  // Verificar se deve mostrar no breakpoint atual
  let shouldShow = true;

  if (show) {
    shouldShow = show[currentBreakpoint] ?? true;
  }

  if (hide) {
    shouldShow = !(hide[currentBreakpoint] ?? false);
  }

  if (!shouldShow) {
    return null;
  }

  return <>{children}</>;
}

// Hook para detectar breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width < 480) {
        setBreakpoint('xs');
      } else if (width < 768) {
        setBreakpoint('sm');
      } else if (width < 1024) {
        setBreakpoint('md');
      } else if (width < 1280) {
        setBreakpoint('lg');
      } else if (width < 1536) {
        setBreakpoint('xl');
      } else {
        setBreakpoint('2xl');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

// Componente para sidebar responsiva
interface ResponsiveSidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  breakpoint?: 'md' | 'lg' | 'xl';
  position?: 'left' | 'right';
}

export function ResponsiveSidebar({ 
  children, 
  isOpen, 
  onClose,
  breakpoint = 'md',
  position = 'left'
}: ResponsiveSidebarProps) {
  const currentBreakpoint = useBreakpoint();
  const isMobile = currentBreakpoint === 'xs' || currentBreakpoint === 'sm';

  const sidebarClasses = cn(
    'fixed top-0 h-full bg-gray-900 text-white transition-transform duration-300 ease-in-out z-50',
    position === 'left' ? 'left-0' : 'right-0',
    isOpen ? 'translate-x-0' : (position === 'left' ? '-translate-x-full' : 'translate-x-full'),
    !isMobile && 'w-80',
    isMobile && 'w-full'
  );

  const overlayClasses = cn(
    'fixed inset-0 bg-black/50 transition-opacity duration-300 z-40',
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  );

  return (
    <>
      {/* Overlay em mobile */}
      {isMobile && (
        <div 
          className={overlayClasses}
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {children}
      </aside>
    </>
  );
}
