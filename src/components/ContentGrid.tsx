import React from 'react';
import { MovieCard, MovieCardSkeleton } from '@/components/MovieCard';
import { EmptyState, EmptyMovies } from '@/components/ui';
import { ErrorState, NetworkError, DatabaseError } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ContentGridProps {
  items: any[];
  loading?: boolean;
  error?: any;
  variant?: 'default' | 'compact' | 'detailed';
  cardVariant?: 'default' | 'compact' | 'detailed';
  onRetry?: () => void;
  onItemSelect?: (item: any) => void;
  userId?: string;
  showFavorite?: boolean;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  className?: string;
  gridClassName?: string;
  loadingCount?: number;
}

export function ContentGrid({
  items,
  loading = false,
  error,
  variant = 'default',
  cardVariant = 'default',
  onRetry,
  onItemSelect,
  userId,
  showFavorite = true,
  emptyState,
  errorState,
  className,
  gridClassName,
  loadingCount = 12,
}: ContentGridProps) {
  // Error state
  if (error) {
    if (errorState) {
      return <>{errorState}</>;
    }

    // Determinar tipo de erro
    if (error.code === 'NETWORK_ERROR') {
      return <NetworkError onRetry={onRetry} />;
    }

    if (error.code === 'DATABASE_ERROR') {
      return <DatabaseError onRetry={onRetry} />;
    }

    // Erro genérico
    return (
      <ErrorState
        variant="error"
        title="Erro ao carregar conteúdo"
        message={error.message || 'Ocorreu um erro inesperado.'}
        actions={
          onRetry && (
            <button
              onClick={onRetry}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Tentar Novamente
            </button>
          )
        }
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn('grid grid-responsive', gridClassName, className)}>
        {Array.from({ length: loadingCount }).map((_, index) => (
          <MovieCardSkeleton
            key={`skeleton-${index}`}
            variant={cardVariant}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }

    return <EmptyMovies onAddMovie={() => console.log('Add movie')} />;
  }

  // Content loaded
  return (
    <div className={cn('grid grid-responsive', gridClassName, className)}>
      {items.map((item) => (
        <MovieCard
          key={item.id}
          movie={item}
          variant={cardVariant}
          onClick={() => onItemSelect?.(item)}
          userId={userId}
          showFavorite={showFavorite}
        />
      ))}
    </div>
  );
}

// Grid específico para filmes
export function MovieGrid({
  movies,
  loading,
  error,
  onRetry,
  onMovieSelect,
  userId,
  showFavorite = true,
  className,
}: {
  movies: any[];
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  onMovieSelect?: (movie: any) => void;
  userId?: string;
  showFavorite?: boolean;
  className?: string;
}) {
  return (
    <ContentGrid
      items={movies}
      loading={loading}
      error={error}
      cardVariant="default"
      onRetry={onRetry}
      onItemSelect={onMovieSelect}
      userId={userId}
      showFavorite={showFavorite}
      className={className}
    />
  );
}

// Grid específico para séries
export function SeriesGrid({
  series,
  loading,
  error,
  onRetry,
  onSeriesSelect,
  userId,
  showFavorite = true,
  className,
}: {
  series: any[];
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  onSeriesSelect?: (series: any) => void;
  userId?: string;
  showFavorite?: boolean;
  className?: string;
}) {
  return (
    <ContentGrid
      items={series}
      loading={loading}
      error={error}
      cardVariant="detailed"
      onRetry={onRetry}
      onItemSelect={onSeriesSelect}
      userId={userId}
      showFavorite={showFavorite}
      className={className}
    />
  );
}

// Grid compacto para listas
export function CompactGrid({
  items,
  loading,
  error,
  onRetry,
  onItemSelect,
  userId,
  showFavorite = false,
  className,
}: {
  items: any[];
  loading?: boolean;
  error?: any;
  onRetry?: () => void;
  onItemSelect?: (item: any) => void;
  userId?: string;
  showFavorite?: boolean;
  className?: string;
}) {
  return (
    <ContentGrid
      items={items}
      loading={loading}
      error={error}
      cardVariant="compact"
      onRetry={onRetry}
      onItemSelect={onItemSelect}
      userId={userId}
      showFavorite={showFavorite}
      className={className}
      gridClassName="grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
    />
  );
}

// Grid com paginação infinita
export function InfiniteGrid({
  items,
  loading,
  error,
  hasMore,
  onRetry,
  onLoadMore,
  onItemSelect,
  userId,
  showFavorite = true,
  className,
}: {
  items: any[];
  loading?: boolean;
  error?: any;
  hasMore?: boolean;
  onRetry?: () => void;
  onLoadMore?: () => void;
  onItemSelect?: (item: any) => void;
  userId?: string;
  showFavorite?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <ContentGrid
        items={items}
        loading={false}
        error={error}
        onRetry={onRetry}
        onItemSelect={onItemSelect}
        userId={userId}
        showFavorite={showFavorite}
      />
      
      {/* Loading indicator para mais itens */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Botão carregar mais */}
      {hasMore && !loading && onLoadMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Carregar Mais
          </button>
        </div>
      )}
      
      {/* Fim dos resultados */}
      {!hasMore && !loading && items.length > 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Fim dos resultados
        </div>
      )}
    </div>
  );
}
