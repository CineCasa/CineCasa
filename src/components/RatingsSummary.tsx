import React from 'react';
import { Star, BarChart3 } from 'lucide-react';
import { RatingStars } from './RatingStars';
import { Progress } from '@/components/ui/progress';
import type { RatingStats } from '@/services/RatingsService';

interface RatingsSummaryProps {
  stats: RatingStats;
  isLoading?: boolean;
}

export const RatingsSummary: React.FC<RatingsSummaryProps> = ({
  stats,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-32 mb-4"></div>
        <div className="h-24 bg-gray-800 rounded"></div>
      </div>
    );
  }

  if (stats.total_reviews === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma avaliação ainda</p>
        <p className="text-xs mt-1">Seja o primeiro a avaliar!</p>
      </div>
    );
  }

  const maxCount = Math.max(
    stats.rating_1_count,
    stats.rating_2_count,
    stats.rating_3_count,
    stats.rating_4_count,
    stats.rating_5_count,
    1
  );

  return (
    <div className="space-y-4">
      {/* Average Rating */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-white">
            {stats.average_rating.toFixed(1)}
          </div>
          <RatingStars rating={Math.round(stats.average_rating)} size="sm" className="mt-1" />
          <p className="text-xs text-gray-500 mt-1">
            {stats.total_reviews} {stats.total_reviews === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count =
              star === 5
                ? stats.rating_5_count
                : star === 4
                ? stats.rating_4_count
                : star === 3
                ? stats.rating_3_count
                : star === 2
                ? stats.rating_2_count
                : stats.rating_1_count;
            const percentage = (count / stats.total_reviews) * 100;

            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-3">{star}</span>
                <Star className="w-3 h-3 text-gray-600 fill-gray-600" />
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-500 w-8 text-right text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingsSummary;
