import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type { ClassValue };

// Interface para configuração do CVA
interface CVAConfig {
  variant?: Record<string, string>;
  size?: Record<string, string>;
  loading?: Record<string, string>;
  disabled?: Record<string, string>;
  [key: string]: Record<string, string> | undefined;
}

interface CVAProps {
  variant?: string;
  size?: string;
  loading?: boolean;
  disabled?: boolean;
  [key: string]: any;
}

export function cva(
  base: string,
  config: CVAConfig
) {
  return function(props?: CVAProps): string {
    const { variant = 'primary', size = 'md', loading = false, disabled = false, ...rest } = props || {};

    // Coletar todas as classes
    const classes: ClassValue[] = [base];

    // Adicionar classes da variante
    if (config.variant && variant) {
      classes.push(config.variant[variant]);
    }

    // Adicionar classes do tamanho
    if (config.size && size) {
      classes.push(config.size[size]);
    }

    // Adicionar classes de loading
    if (loading && config.loading) {
      classes.push(config.loading.base || '');
    }

    // Adicionar classes de disabled
    if (disabled && config.disabled) {
      classes.push(config.disabled.base || '');
    }

    // Adicionar outras propriedades dinâmicas
    Object.keys(rest).forEach(key => {
      if (config[key] && rest[key]) {
        if (typeof rest[key] === 'boolean' && rest[key]) {
          classes.push(config[key]?.base || '');
        } else if (typeof rest[key] === 'string' && config[key]?.[rest[key]]) {
          classes.push(config[key][rest[key]]);
        }
      }
    });

    return twMerge(clsx(classes));
  };
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
