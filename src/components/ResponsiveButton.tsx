import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const responsiveButtonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 active:scale-95 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        premium: 'bg-white text-black hover:bg-white/90 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]',
        'premium-secondary': 'bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md',
        'premium-icon': 'rounded-full border border-white/40 bg-background/50 backdrop-blur-md hover:bg-white/20',
      },
      size: {
        xs: 'h-7 px-2 text-xs gap-1',
        sm: 'h-9 px-3 text-sm gap-1.5',
        default: 'h-10 px-4 py-2 text-base gap-2',
        lg: 'h-11 px-8 text-lg gap-3',
        xl: 'h-12 px-10 text-xl gap-4',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      responsive: {
        true: 'min-h-[44px] sm:min-h-[48px] md:min-h-[52px]', // Touch-friendly minimum
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      responsive: true,
      fullWidth: false,
    },
  }
);

export interface ResponsiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof responsiveButtonVariants> {
  asChild?: boolean;
}

const ResponsiveButton = React.forwardRef<HTMLButtonElement, ResponsiveButtonProps>(
  ({ className, variant, size, responsive, fullWidth, ...props }, ref) => {
    return (
      <button
        className={cn(responsiveButtonVariants({ variant, size, responsive, fullWidth }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

ResponsiveButton.displayName = 'ResponsiveButton';

export default ResponsiveButton;
