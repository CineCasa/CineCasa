import React from 'react';
import { cva } from '@/lib/cva';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  dot?: boolean;
  children: React.ReactNode;
}

const badgeVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-full',
  {
    variant: {
      default: 'bg-gray-700 text-gray-300',
      primary: 'bg-primary text-white',
      secondary: 'bg-gray-600 text-white',
      success: 'bg-green-600 text-white',
      warning: 'bg-yellow-600 text-white',
      error: 'bg-red-600 text-white',
    },
    size: {
      xs: 'px-1.5 py-0.5 text-xs h-4',
      sm: 'px-2 py-1 text-xs h-5',
      md: 'px-2.5 py-1 text-sm h-6',
      lg: 'px-3 py-1.5 text-base h-7',
    },
    dot: {
      true: 'p-0 w-2 h-2 rounded-full',
    },
  },
);

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  if (dot) {
    return (
      <span
        className={cn(
          badgeVariants({ variant, size, dot }),
          className
        )}
        {...props}
      />
    );
  }

  return (
    <span
      className={cn(
        badgeVariants({ variant, size, dot }),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Badge para status
export function StatusBadge({ 
  status, 
  className 
}: { 
  status: 'online' | 'offline' | 'busy' | 'away' | 'loading';
  className?: string;
}) {
  const statusConfig = {
    online: { variant: 'success' as const, label: 'Online' },
    offline: { variant: 'error' as const, label: 'Offline' },
    busy: { variant: 'warning' as const, label: 'Ocupado' },
    away: { variant: 'secondary' as const, label: 'Ausente' },
    loading: { variant: 'default' as const, label: 'Carregando...' },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      size="sm"
      dot={status === 'loading'}
      className={className}
    >
      {status !== 'loading' && config.label}
    </Badge>
  );
}

// Badge para rating
export function RatingBadge({ 
  rating, 
  maxRating = 10,
  className 
}: { 
  rating: number;
  maxRating?: number;
  className?: string;
}) {
  const percentage = (rating / maxRating) * 100;
  
  let variant: BadgeProps['variant'] = 'default';
  if (percentage >= 80) variant = 'success';
  else if (percentage >= 60) variant = 'primary';
  else if (percentage >= 40) variant = 'warning';
  else variant = 'error';

  return (
    <Badge
      variant={variant}
      size="sm"
      className={className}
    >
      {rating.toFixed(1)}/{maxRating}
    </Badge>
  );
}

// Badge para contagem
export function CountBadge({ 
  count, 
  max = 99,
  className 
}: { 
  count: number;
  max?: number;
  className?: string;
}) {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  return (
    <Badge
      variant="error"
      size="xs"
      className={cn('absolute -top-1 -right-1 min-w-[20px]', className)}
    >
      {displayCount}
    </Badge>
  );
}
