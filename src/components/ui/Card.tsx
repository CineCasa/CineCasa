import React from 'react';
import { cva } from '@/lib/cva';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  interactive?: boolean;
}

const cardVariants = cva(
  'bg-gray-900 rounded-lg transition-all duration-200',
  {
    variant: {
      default: 'border border-gray-800 hover:border-gray-700',
      outlined: 'border-2 border-gray-700 hover:border-gray-600',
      elevated: 'border border-gray-800 shadow-lg hover:shadow-xl hover:border-gray-700',
      flat: 'border-0 hover:bg-gray-800',
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    hover: {
      true: 'hover:scale-[1.02] hover:shadow-lg',
    },
    interactive: {
      true: 'cursor-pointer active:scale-[0.98]',
    },
  }
);

export function Card({
  children,
  className,
  variant = 'default',
  size = 'md',
  hover = true,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({ variant, size, hover, interactive }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Header
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-gray-800 px-4 py-3', className)}>
      {children}
    </div>
  );
}

// Card Content
interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn('flex-1', className)}>
      {children}
    </div>
  );
}

// Card Footer
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn('border-t border-gray-800 px-4 py-3', className)}>
      {children}
    </div>
  );
}

// Card completo com todas as seções
interface FullCardProps extends CardProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  content?: React.ReactNode;
}

export function FullCard({ 
  header, 
  footer, 
  content, 
  children, 
  ...cardProps 
}: FullCardProps) {
  return (
    <Card {...cardProps}>
      {header && <CardHeader>{header}</CardHeader>}
      {(content || children) && <CardContent>{content || children}</CardContent>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
