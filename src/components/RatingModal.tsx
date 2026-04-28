import React, { useState, useEffect } from 'react';
import { Star, X, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RatingStars } from './RatingStars';
import { cn } from '@/lib/utils';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string, containsSpoilers: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialRating?: number;
  initialReview?: string;
  initialContainsSpoilers?: boolean;
  contentTitle: string;
  isSubmitting?: boolean;
  isDeleting?: boolean;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialRating = 0,
  initialReview = '',
  initialContainsSpoilers = false,
  contentTitle,
  isSubmitting = false,
  isDeleting = false,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [review, setReview] = useState(initialReview);
  const [containsSpoilers, setContainsSpoilers] = useState(initialContainsSpoilers);
  const [hoverRating, setHoverRating] = useState(0);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setReview(initialReview);
      setContainsSpoilers(initialContainsSpoilers);
    }
  }, [isOpen, initialRating, initialReview, initialContainsSpoilers]);

  const handleSubmit = async () => {
    if (rating < 1) return;
    await onSubmit(rating, review.trim(), containsSpoilers);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  const isEditing = initialRating > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1f] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Editar avaliação' : 'Avaliar'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-4 truncate">{contentTitle}</p>

          {/* Star Rating */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => {
                const index = i + 1;
                const filled = index <= (hoverRating || rating);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(index)}
                    onMouseEnter={() => setHoverRating(index)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={isSubmitting}
                    className={cn(
                      'p-1 transition-all duration-200 hover:scale-110',
                      filled ? 'text-yellow-400' : 'text-gray-600'
                    )}
                  >
                    <Star
                      className={cn(
                        'w-10 h-10 transition-all',
                        filled ? 'fill-yellow-400' : 'fill-transparent'
                      )}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {rating > 0 ? `${rating} de 5 estrelas` : 'Clique para avaliar'}
            </p>
          </div>

          {/* Review Text */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">
              Review (opcional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="O que você achou deste conteúdo?"
              className="bg-[#0f0f12] border-white/10 text-white placeholder:text-gray-600 min-h-[100px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {review.length}/500
            </p>
          </div>

          {/* Spoiler Checkbox */}
          <div className="flex items-center gap-2 mb-6">
            <Checkbox
              id="spoilers"
              checked={containsSpoilers}
              onCheckedChange={(checked) => setContainsSpoilers(checked as boolean)}
              className="border-white/20 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
              disabled={isSubmitting}
            />
            <label
              htmlFor="spoilers"
              className="text-sm text-gray-400 flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Contém spoilers
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isEditing && onDelete && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="flex-1 bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Remover'
                )}
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={rating < 1 || isSubmitting}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-medium disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                'Atualizar'
              ) : (
                'Enviar avaliação'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingModal;
