import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOptimisticFavorites } from '@/hooks/useOptimisticFavorites';

interface FavoriteButtonProps {
  movieId: string;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FavoriteButton({
  movieId,
  userId,
  size = 'md',
  showText = false,
  className,
  disabled = false,
}: FavoriteButtonProps) {
  const {
    isFavorite,
    toggleFavorite,
    isAddingFavorite,
    isRemovingFavorite,
  } = useOptimisticFavorites({ userId });

  const isLoading = isAddingFavorite || isRemovingFavorite;
  const isFavorited = isFavorite(movieId);

  const handleToggle = () => {
    if (disabled || isLoading) return;
    toggleFavorite(movieId);
  };

  // Tamanhos do botão
  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-2',
    lg: 'w-10 h-10 p-2.5',
  };

  // Tamanhos do ícone
  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'hover:scale-110 active:scale-95',
        isFavorited
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-gray-800/80 hover:bg-gray-800 text-white backdrop-blur-sm',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin')} size={iconSizes[size]} />
      ) : (
        <Heart
          className={cn(
            'transition-all duration-200',
            isFavorited ? 'fill-current' : ''
          )}
          size={iconSizes[size]}
        />
      )}
      
      {showText && (
        <span className="ml-2 text-sm">
          {isLoading
            ? 'Processando...'
            : isFavorited
              ? 'Remover'
              : 'Favoritar'
          }
        </span>
      )}
    </button>
  );
}

// Botão de favorito simplificado para cards
export function FavoriteButtonSimple({
  movieId,
  userId,
  className,
}: {
  movieId: string;
  userId?: string;
  className?: string;
}) {
  const { isFavorite, toggleFavorite, isAddingFavorite, isRemovingFavorite } = useOptimisticFavorites({ userId });
  const isLoading = isAddingFavorite || isRemovingFavorite;
  const isFavorited = isFavorite(movieId);

  return (
    <button
      onClick={() => toggleFavorite(movieId)}
      disabled={isLoading}
      className={cn(
        'absolute top-2 right-2 z-10 w-8 h-8 rounded-full',
        'bg-black/60 backdrop-blur-md border border-white/20',
        'flex items-center justify-center transition-all duration-200',
        'hover:bg-black/80 hover:scale-110',
        isFavorited && 'bg-red-600/80',
        isLoading && 'opacity-70',
        className
      )}
    >
      {isLoading ? (
        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Heart
          className={cn(
            'text-white transition-all duration-200',
            isFavorited && 'fill-current'
          )}
          size={14}
        />
      )}
    </button>
  );
}

// Indicador de status de favorito
export function FavoriteStatus({
  movieId,
  userId,
  showCount = false,
}: {
  movieId: string;
  userId?: string;
  showCount?: boolean;
}) {
  const { favorites, isFavorite } = useOptimisticFavorites({ userId });
  const isFavorited = isFavorite(movieId);

  if (!showCount) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Heart
          className={cn(
            'transition-colors duration-200',
            isFavorited ? 'fill-red-600 text-red-600' : 'text-gray-400'
          )}
          size={16}
        />
        <span className={isFavorited ? 'text-red-600' : 'text-gray-400'}>
          {isFavorited ? 'Favoritado' : 'Não favoritado'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <Heart
          className={cn(
            'transition-colors duration-200',
            isFavorited ? 'fill-red-600 text-red-600' : 'text-gray-400'
          )}
          size={16}
        />
        <span className={isFavorited ? 'text-red-600' : 'text-gray-400'}>
          {isFavorited ? 'Favoritado' : 'Não favoritado'}
        </span>
      </div>
      
      <div className="text-gray-400">
        Total de favoritos: {favorites.length}
      </div>
    </div>
  );
}
