import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'netflix' | 'minimal';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className,
  showPercentage = false,
  size = 'md',
  variant = 'netflix',
}) => {
  // Normalizar progresso entre 0-100
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  
  // Determinar cor baseada no progresso
  const getProgressColor = () => {
    if (normalizedProgress < 30) return 'bg-red-500';
    if (normalizedProgress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Determinar cor de fundo
  const getBackgroundColor = () => {
    if (variant === 'netflix') return 'bg-gray-700';
    return 'bg-gray-200 dark:bg-gray-700';
  };

  // Tamanhos
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  // Esconder se progresso é 0 ou 100
  if (normalizedProgress === 0 || normalizedProgress >= 100) {
    return null;
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          sizeClasses[size],
          getBackgroundColor()
        )}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            getProgressColor()
          )}
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showPercentage && (
        <span className="text-xs text-gray-400 mt-1">
          {normalizedProgress}%
        </span>
      )}
    </div>
  );
};

// Componente específico para cards de conteúdo (estilo Netflix)
interface CardProgressBarProps {
  progress: number;
  className?: string;
}

export const CardProgressBar: React.FC<CardProgressBarProps> = ({
  progress,
  className,
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  // Não mostrar se não iniciou ou já concluiu
  if (normalizedProgress <= 0 || normalizedProgress >= 95) {
    return null;
  }

  return (
    <div className={cn('absolute bottom-0 left-0 right-0 z-10', className)}>
      <div className="h-1 w-full bg-gray-800/80">
        <div
          className="h-full bg-red-600 transition-all duration-300"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
