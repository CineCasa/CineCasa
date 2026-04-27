import React from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWatchlist } from '@/hooks/useWatchlist';
import { toast } from 'sonner';

interface WatchlistItemData {
  contentId: number;
  contentType: 'movie' | 'series';
  titulo: string;
  poster?: string;
  banner?: string;
  rating?: string;
  year?: string;
  genero?: string;
}

interface WatchlistButtonProps {
  item: WatchlistItemData;
  userId?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  disabled?: boolean;
}

export function WatchlistButton({
  item,
  userId,
  size = 'md',
  showText = false,
  className,
  disabled = false,
}: WatchlistButtonProps) {
  console.log('🔍 WatchlistButton - userId:', userId, 'item:', item);
  
  const {
    isInWatchlist,
    toggleWatchlist,
    isAddingToWatchlist,
    isRemovingFromWatchlist,
  } = useWatchlist({ userId });

  const isLoading = isAddingToWatchlist || isRemovingFromWatchlist;
  const isAdded = isInWatchlist(item.contentId, item.contentType);
  console.log('🔍 WatchlistButton - isAdded:', isAdded, 'isLoading:', isLoading);

  const handleToggle = () => {
    console.log('🔍 WatchlistButton - handleToggle called', { userId, item, disabled, isLoading });
    if (disabled || isLoading) {
      console.log('🔍 WatchlistButton - blocked: disabled or loading');
      return;
    }
    if (!userId) {
      console.error('❌ WatchlistButton - userId is required');
      toast.error('Faça login para salvar na lista "Ver depois"');
      return;
    }
    toggleWatchlist({
      content_id: item.contentId,
      content_type: item.contentType,
      titulo: item.titulo,
      poster: item.poster || null,
      banner: item.banner || null,
      rating: item.rating || null,
      year: item.year || null,
      genero: item.genero || null,
    });
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
        isAdded
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-gray-800/80 hover:bg-gray-800 text-white backdrop-blur-sm',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={isAdded ? 'Remover da lista "Ver depois"' : 'Adicionar à lista "Ver depois"'}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin')} size={iconSizes[size]} />
      ) : isAdded ? (
        <Check
          className={cn('transition-all duration-200')}
          size={iconSizes[size]}
        />
      ) : (
        <Plus
          className={cn('transition-all duration-200')}
          size={iconSizes[size]}
        />
      )}
      
      {showText && (
        <span className="ml-2 text-sm">
          {isLoading
            ? 'Processando...'
            : isAdded
              ? 'Salvo'
              : 'Ver depois'
          }
        </span>
      )}
    </button>
  );
}

// Botão de watchlist simplificado para cards
export function WatchlistButtonSimple({
  item,
  userId,
  className,
}: {
  item: WatchlistItemData;
  userId?: string;
  className?: string;
}) {
  const { isInWatchlist, toggleWatchlist, isAddingToWatchlist, isRemovingFromWatchlist } = useWatchlist({ userId });
  const isLoading = isAddingToWatchlist || isRemovingFromWatchlist;
  const isAdded = isInWatchlist(item.contentId, item.contentType);

  return (
    <button
      onClick={() => toggleWatchlist({
        content_id: item.contentId,
        content_type: item.contentType,
        titulo: item.titulo,
        poster: item.poster || null,
        banner: item.banner || null,
        rating: item.rating || null,
        year: item.year || null,
        genero: item.genero || null,
      })}
      disabled={isLoading}
      className={cn(
        'absolute top-2 right-12 z-10 w-8 h-8 rounded-full',
        'bg-black/60 backdrop-blur-md border border-white/20',
        'flex items-center justify-center transition-all duration-200',
        'hover:bg-black/80 hover:scale-110',
        isAdded && 'bg-green-600/80',
        isLoading && 'opacity-70',
        className
      )}
    >
      {isLoading ? (
        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
      ) : isAdded ? (
        <Check
          className={cn('text-white transition-all duration-200')}
          size={14}
        />
      ) : (
        <Plus
          className={cn('text-white transition-all duration-200')}
          size={14}
        />
      )}
    </button>
  );
}

// Indicador de status da watchlist
export function WatchlistStatus({
  item,
  userId,
  showCount = false,
}: {
  item: WatchlistItemData;
  userId?: string;
  showCount?: boolean;
}) {
  const { watchlist, isInWatchlist } = useWatchlist({ userId });
  const isAdded = isInWatchlist(item.contentId, item.contentType);
  const watchlistCount = Array.isArray(watchlist) ? watchlist.length : 0;

  if (!showCount) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {isAdded ? (
          <Check className="text-green-600" size={16} />
        ) : (
          <Plus className="text-gray-400" size={16} />
        )}
        <span className={isAdded ? 'text-green-600' : 'text-gray-400'}>
          {isAdded ? 'Na lista "Ver depois"' : 'Não salvo'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        {isAdded ? (
          <Check className="text-green-600" size={16} />
        ) : (
          <Plus className="text-gray-400" size={16} />
        )}
        <span className={isAdded ? 'text-green-600' : 'text-gray-400'}>
          {isAdded ? 'Salvo para ver depois' : 'Não salvo'}
        </span>
      </div>
      
      <div className="text-gray-400">
        Total salvos: {watchlistCount}
      </div>
    </div>
  );
}
