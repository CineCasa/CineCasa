import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
  showValue?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRate,
  className,
  showValue = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  const handleClick = (index: number) => {
    if (interactive && onRate) {
      onRate(index);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const index = i + 1;
          const filled = index <= displayRating;
          const isHalf = !filled && index - 0.5 <= displayRating;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(index)}
              onMouseEnter={() => interactive && setHoverRating(index)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              disabled={!interactive}
              className={cn(
                'relative transition-all duration-200',
                interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              )}
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  'text-gray-600 fill-gray-600/20'
                )}
              />
              {/* Filled star */}
              <div
                className={cn(
                  'absolute inset-0 overflow-hidden transition-all duration-200',
                  filled ? 'w-full' : isHalf ? 'w-1/2' : 'w-0'
                )}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    'text-yellow-400 fill-yellow-400 flex-shrink-0'
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className="ml-2 text-sm text-gray-400">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
