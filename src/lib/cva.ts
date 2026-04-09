import { type VariantProps, type ClassValue, clsx, type ClassProp } from 'clsx';
import { twMerge } from 'tailwind-merge';

type Props = VariantProps<{
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
}>;

export type { ClassValue };

export function cva<T extends Props>(
  base: ClassProp,
  config: Record<Exclude<keyof T, 'loading'>, Record<string, ClassValue>>,
  props?: T
) {
  const { variant = 'primary', size = 'md', loading = false, disabled = false } = props || {};

  const variantClasses = config[variant]?.[size] || config[variant]?.base || config.primary?.base || '';
  const sizeClasses = config[variant]?.[size] || config.primary?.[size] || '';
  const loadingClasses = loading ? (config.loading?.base || '') : '';
  const disabledClasses = disabled ? (config.disabled?.base || '') : '';

  return twMerge(
    clsx(
      base,
      variantClasses,
      sizeClasses,
      loadingClasses,
      disabledClasses,
      props?.class
    )
  );
}

// Helper para criar variants
export function createVariants<T extends Record<string, Record<string, ClassValue>>>(
  variants: T
) {
  return variants;
}

// Helper para combinar classes condicionalmente
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
