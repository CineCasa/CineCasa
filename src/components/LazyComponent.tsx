import React, { Suspense, lazy } from 'react';
import { cn } from '@/lib/utils';

interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  className?: string;
  delay?: number;
  rootMargin?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback,
  className,
  delay = 200,
  rootMargin = '50px',
}) => {
  const [showFallback, setShowFallback] = React.useState(false);
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  React.useEffect(() => {
    const loadComponent = async () => {
      try {
        const { default: LoadedComponent } = await loader();
        setComponent(() => LoadedComponent);
      } catch (error) {
        console.error('Error loading component:', error);
      }
    };

    loadComponent();
  }, [loader]);

  const defaultFallback = (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-gray-700 rounded-full animate-spin"></div>
        <div className="text-gray-400 text-sm">Carregando...</div>
      </div>
    </div>
  );

  if (!Component) {
    return showFallback ? (fallback || defaultFallback) : null;
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  );
};

// HOC para lazy loading de componentes
export function withLazyLoading<T extends Record<string, any>>(
  importFunc: () => Promise<{ default: React.ComponentType<T> }>,
  options?: Omit<LazyComponentProps, 'loader'>
) {
  const LazyComp = lazy(importFunc);
  
  return (props: T) => (
    <Suspense fallback={options?.fallback || <div>Loading...</div>}>
      <LazyComp {...props} />
    </Suspense>
  );
}
