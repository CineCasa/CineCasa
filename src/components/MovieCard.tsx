import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    coverImage?: string;
    backdropPath?: string;
    rating?: number;
    year?: number;
    genre?: string;
    duration?: number;
    description?: string;
  };
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
  className?: string;
  userId?: string;
  showFavorite?: boolean;
}

export function MovieCard({
  movie,
  variant = 'default',
  onClick,
  className,
  userId,
  showFavorite,
}: MovieCardProps) {
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatYear = (year?: number) => {
    if (!year) return '';
    return year.toString();
  };

  if (variant === 'compact') {
    return (
      <Card
        variant="outlined"
        size="sm"
        interactive={!!onClick}
        onClick={onClick}
        className={cn('relative overflow-hidden group rounded-xl border border-white/10 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] hover:border-[#00E5FF]', className)}
      >
        <div className="aspect-[2/3] relative">
          <img
            src={movie.coverImage || '/placeholder-movie.jpg'}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-white text-sm font-semibold line-clamp-2 mb-1">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-white text-xs">
              {movie.rating && (
                <Badge size="xs" variant="default">
                  <Star className="w-3 h-3 mr-1" />
                  {movie.rating.toFixed(1)}
                </Badge>
              )}
              {movie.year && (
                <span>{formatYear(movie.year)}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card
        variant="elevated"
        size="lg"
        interactive={!!onClick}
        onClick={onClick}
        className={cn('overflow-hidden group rounded-xl border border-white/10 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] hover:border-[#00E5FF]', className)}
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="aspect-[2/3] md:aspect-video md:w-1/3 relative">
            <img
              src={movie.coverImage || '/placeholder-movie.jpg'}
              alt={movie.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
          </div>
          
          <CardContent className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white text-lg font-semibold mb-1">
                  {movie.title}
                </h3>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  {movie.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      {movie.rating.toFixed(1)}
                    </div>
                  )}
                  {movie.year && (
                    <span>{formatYear(movie.year)}</span>
                  )}
                  {movie.duration && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(movie.duration)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {movie.genre && (
              <Badge variant="secondary" size="sm" className="mb-3">
                {movie.genre}
              </Badge>
            )}
            
            {movie.description && (
              <p className="text-gray-300 text-sm line-clamp-3">
                {movie.description}
              </p>
            )}
          </CardContent>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      variant="default"
      size="md"
      interactive={!!onClick}
      onClick={onClick}
      className={cn('overflow-hidden group rounded-xl border border-white/10 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-[0_0_15px_rgba(0,229,255,0.6)] hover:border-[#00E5FF]', className)}
    >
      <div className="aspect-[2/3] relative">
        <img
          src={movie.coverImage || '/placeholder-movie.jpg'}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Overlay Glassmorphism */}
        <div className="absolute bottom-0 left-0 right-0 p-3 backdrop-blur-md bg-black/40">
          <h3 className="text-white text-base font-semibold line-clamp-2 mb-2">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2">
            {movie.rating && (
              <Badge size="sm" variant="default" className="rounded-full bg-white/10 backdrop-blur-sm">
                <Star className="w-3 h-3 mr-1" />
                {movie.rating.toFixed(1)}
              </Badge>
            )}
            {movie.year && (
              <Badge size="sm" variant="secondary" className="rounded-full bg-white/10 backdrop-blur-sm">
                {formatYear(movie.year)}
              </Badge>
            )}
            {movie.genre && (
              <Badge size="sm" variant="secondary" className="rounded-full bg-white/10 backdrop-blur-sm">
                {movie.genre}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Skeleton component para MovieCard
export function MovieCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'detailed' }) {
  if (variant === 'compact') {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="aspect-[2/3] relative">
          <div className="w-full h-full bg-gray-800 animate-pulse" />
        </div>
        <div className="p-2 backdrop-blur-md bg-black/40">
          <div className="h-4 bg-gray-800 animate-pulse rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="bg-gray-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 p-4 backdrop-blur-md bg-black/40">
          <div className="aspect-[2/3] md:aspect-video md:w-1/3">
            <div className="w-full h-full bg-gray-800 animate-pulse rounded-xl" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-2">
              <div className="h-6 bg-gray-800 animate-pulse rounded w-3/4" />
              <div className="h-4 bg-gray-800 animate-pulse rounded w-1/2" />
            </div>
            <div className="h-4 bg-gray-800 animate-pulse rounded w-1/3" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-800 animate-pulse rounded" />
              <div className="h-3 bg-gray-800 animate-pulse rounded w-5/6" />
              <div className="h-3 bg-gray-800 animate-pulse rounded w-4/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="aspect-[2/3] relative">
        <div className="w-full h-full bg-gray-800 animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-800 animate-pulse rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-4 bg-gray-800 animate-pulse rounded w-12" />
          <div className="h-4 bg-gray-800 animate-pulse rounded w-16" />
          <div className="h-4 bg-gray-800 animate-pulse rounded w-20" />
        </div>
      </div>
    </div>
  );
}
