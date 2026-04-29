import { motion } from 'framer-motion';
import { Trophy, Lock, Check, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { achievementService } from '@/services/AchievementService';
import type { Achievement } from '@/services/AchievementService';

interface AchievementCardProps {
  achievement: Achievement;
  progress?: number;
  target?: number;
  isCompleted?: boolean;
  completedAt?: string;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementCard({
  achievement,
  progress = 0,
  target = 1,
  isCompleted = false,
  completedAt,
  showDetails = true,
  size = 'md',
}: AchievementCardProps) {
  const percentage = Math.min(100, Math.round((progress / target) * 100));
  const tierColor = achievementService.getTierColor(achievement.tier || 'bronze');

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative rounded-xl border transition-all',
        isCompleted
          ? 'bg-gradient-to-br from-yellow-50/50 to-orange-50/50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800'
          : 'bg-card border-border hover:border-primary/50',
        sizeClasses[size]
      )}
    >
      {/* Tier Badge */}
      <div
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
        style={{ backgroundColor: tierColor }}
      >
        <Trophy className="w-3 h-3 text-white" />
      </div>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'rounded-xl flex items-center justify-center shrink-0',
            isCompleted ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-muted'
          )}
          style={{
            width: size === 'sm' ? 40 : size === 'md' ? 56 : 72,
            height: size === 'sm' ? 40 : size === 'md' ? 56 : 72,
          }}
        >
          {isCompleted ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </motion.div>
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn('font-semibold truncate', size === 'sm' ? 'text-sm' : 'text-base')}>
              {achievement.name}
            </h4>
            {isCompleted && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 shrink-0">
                <Star className="w-3 h-3 mr-1" />
                Concluído
              </Badge>
            )}
          </div>

          {showDetails && (
            <>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {achievement.description}
              </p>

              {/* XP Reward */}
              <div className="flex items-center gap-3 mb-3">
                <Badge variant="outline" className="text-xs">
                  +{achievement.xp_reward} XP
                </Badge>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: `${tierColor}30`, color: tierColor }}
                >
                  {achievement.tier || 'Bronze'}
                </span>
              </div>

              {/* Progress */}
              {!isCompleted && target > 1 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{progress} / {target}</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              )}

              {/* Completed Date */}
              {isCompleted && completedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Concluído em {new Date(completedAt).toLocaleDateString('pt-BR')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AchievementCard;
