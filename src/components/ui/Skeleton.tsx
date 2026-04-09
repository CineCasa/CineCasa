import React from 'react';
import { cva } from '@/lib/cva';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'list';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animate?: boolean;
}

const skeletonVariants = cva(
  'bg-gray-800 rounded',
  {
    variant: {
      text: 'h-4 bg-gray-700 rounded animate-pulse',
      circular: 'w-12 h-12 rounded-full bg-gray-700 animate-pulse',
      rectangular: 'animate-pulse',
      card: 'bg-gray-900 border border-gray-800 rounded-lg',
      list: 'flex flex-col space-y-2',
    },
  },
);

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animate = true,
}: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const animationClass = animate ? 'animate-pulse' : '';

  if (variant === 'text') {
    return (
      <div 
        className={cn(skeletonVariants({ variant }), className)}
        style={style}
      />
    );
  }

  if (variant === 'circular') {
    return (
      <div 
        className={cn(skeletonVariants({ variant }), className)}
        style={style}
      />
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn(skeletonVariants({ variant }), className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 bg-gray-700 rounded animate-pulse"
            style={{
              width: index === lines - 1 ? '60%' : '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn(skeletonVariants({ variant }), animationClass, className)}
      style={style}
    />
  );
}

// Skeleton para Movie Card
export function MovieCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-gray-900 border border-gray-800 rounded-lg overflow-hidden', className)}>
      {/* Imagem */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height={200}
        className="w-full"
      />
      
      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        <Skeleton
          variant="text"
          width="80%"
          lines={2}
        />
        <Skeleton
          variant="text"
          width="60%"
          lines={1}
        />
      </div>
    </div>
  );
}

// Skeleton para texto
export function TextSkeleton({ 
  lines = 3, 
  className 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === 0 ? '90%' : index === lines - 1 ? '70%' : '85%'}
        />
      ))}
    </div>
  );
}

// Skeleton para avatar
export function AvatarSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={48}
      height={48}
      className={className}
    />
  );
}

// Skeleton para botão
export function ButtonSkeleton({ 
  width = 120, 
  height = 40,
  className 
}: { 
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <Skeleton
      variant="rectangular"
      width={width}
      height={height}
      className={cn('rounded-lg', className)}
    />
  );
}

// Skeleton para lista de itens
export function ListSkeleton({ 
  items = 6,
  className 
}: { 
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <AvatarSkeleton />
          <div className="flex-1 space-y-2">
            <TextSkeleton lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}
