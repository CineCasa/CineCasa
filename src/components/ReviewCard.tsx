import React from 'react';
import { Star, ThumbsUp, AlertTriangle, User } from 'lucide-react';
import { formatDistanceToNow } from '@/utils/date';
import { RatingStars } from './RatingStars';
import { Button } from '@/components/ui/button';
import type { ReviewWithUser } from '@/services/RatingsService';

interface ReviewCardProps {
  review: ReviewWithUser;
  onHelpful?: (ratingId: string) => void;
  isHelpfulLoading?: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpful,
  isHelpfulLoading = false,
}) => {
  const formattedDate = formatDistanceToNow(new Date(review.created_at));

  return (
    <div className="bg-[#0f0f12] rounded-lg p-4 border border-white/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
            {review.avatar_url ? (
              <img
                src={review.avatar_url}
                alt={review.username || 'Usuário'}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>

          <div>
            <p className="text-white font-medium text-sm">
              {review.username || 'Usuário'}
            </p>
            <p className="text-gray-500 text-xs">{formattedDate}</p>
          </div>
        </div>

        <RatingStars rating={review.rating} size="sm" />
      </div>

      {/* Spoiler Warning */}
      {review.contains_spoilers && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-500 text-xs">Contém spoilers</span>
        </div>
      )}

      {/* Review Text */}
      {review.review && (
        <p className="text-gray-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
          {review.review}
        </p>
      )}

      {/* Helpful Button */}
      {onHelpful && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onHelpful(review.id)}
            disabled={isHelpfulLoading}
            className="text-gray-500 hover:text-white hover:bg-white/5 text-xs"
          >
            <ThumbsUp className="w-3 h-3 mr-1" />
            Útil ({review.helpful_count})
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
