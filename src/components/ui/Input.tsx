import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'outlined' | 'filled';
  inputSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const baseClasses = 'bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses = {
  default: 'border-gray-700 focus:border-primary focus:ring-primary',
  outlined: 'border-2 border-gray-600 focus:border-primary focus:ring-primary',
  filled: 'border-transparent bg-gray-800 focus:border-primary focus:ring-primary',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm h-9',
  md: 'px-4 py-2 text-base h-10',
  lg: 'px-5 py-3 text-lg h-12',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input({
  className,
  variant = 'default',
  inputSize = 'md',
  error = false,
  label,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}, ref) {
  const inputId = React.useId();
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium',
            error ? 'text-red-500' : 'text-gray-300'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[inputSize],
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            fullWidth && 'w-full',
            className
          )}
          aria-describedby={helperId}
          aria-invalid={error}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {rightIcon}
          </div>
        )}
      </div>

      {helperText && (
        <p
          id={helperId}
          className={cn(
            'text-xs',
            error ? 'text-red-500' : 'text-gray-500'
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

// Select component
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'outlined' | 'filled';
  selectSize?: 'sm' | 'md' | 'lg';
  error?: boolean;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

export function Select({
  className,
  variant = 'default',
  selectSize = 'md',
  error = false,
  label,
  helperText,
  fullWidth = false,
  options,
  ...props
}: SelectProps) {
  const selectId = React.useId();
  const helperId = helperText ? `${selectId}-helper` : undefined;

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={selectId}
          className={cn(
            'block text-sm font-medium',
            error ? 'text-red-500' : 'text-gray-300'
          )}
        >
          {label}
        </label>
      )}
      
      <select
        id={selectId}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[selectSize],
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          'cursor-pointer',
          fullWidth && 'w-full',
          className
        )}
        aria-describedby={helperId}
        aria-invalid={error}
        {...props}
      >
        {options.map(option => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {helperText && (
        <p 
          id={helperId}
          className={cn(
            'text-xs',
            error ? 'text-red-500' : 'text-gray-500'
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

// Textarea component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  rows?: number;
}

export function Textarea({
  className,
  variant = 'default',
  size = 'md',
  error = false,
  label,
  helperText,
  fullWidth = false,
  rows = 4,
  ...props
}: TextareaProps) {
  const textareaId = React.useId();
  const helperId = helperText ? `${textareaId}-helper` : undefined;

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label 
          htmlFor={textareaId}
          className={cn(
            'block text-sm font-medium',
            error ? 'text-red-500' : 'text-gray-300'
          )}
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size as 'sm' | 'md' | 'lg'],
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          'resize-vertical',
          fullWidth && 'w-full',
          className
        )}
        aria-describedby={helperId}
        aria-invalid={error}
        {...props}
      />
      
      {helperText && (
        <p 
          id={helperId}
          className={cn(
            'text-xs',
            error ? 'text-red-500' : 'text-gray-500'
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
