import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva } from '@/lib/cva';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variant: {
      primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-600',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary',
      ghost: 'text-primary hover:bg-primary/10 focus:ring-primary',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    },
    size: {
      xs: 'px-2 py-1 text-xs h-8',
      sm: 'px-3 py-1.5 text-sm h-9',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-6 py-3 text-lg h-12',
      xl: 'px-8 py-4 text-xl h-14',
    },
    loading: {
      base: 'cursor-wait',
    },
    disabled: {
      base: 'cursor-not-allowed opacity-50',
    },
  }
);

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size, loading, disabled }),
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      <span>{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
}

// Button Group para agrupar botões relacionados
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
}

export function ButtonGroup({ 
  children, 
  className,
  orientation = 'horizontal',
  spacing = 'sm' 
}: ButtonGroupProps) {
  const spacingClasses = {
    xs: 'space-x-1',
    sm: 'space-x-2',
    md: 'space-x-3',
    lg: 'space-x-4',
  };

  const verticalSpacingClasses = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  return (
    <div 
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        orientation === 'horizontal' ? spacingClasses[spacing] : verticalSpacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
}
