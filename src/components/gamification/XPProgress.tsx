import { motion } from 'framer-motion';
import { Star, TrendingUp, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLevelInfo } from '@/hooks/useXP';

interface XPProgressProps {
  userId: string;
  variant?: 'compact' | 'default' | 'detailed';
  showLeaderboard?: boolean;
  className?: string;
}

export function XPProgress({ userId, variant = 'default', className }: XPProgressProps) {
  const { data: levelInfo, isLoading } = useLevelInfo(userId);

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-muted rounded-lg h-20', className)} />
    );
  }

  if (!levelInfo) return null;

  const { level, title, xpCurrent, xpForLevel, progressPercent, xpToNext } = levelInfo;

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm">
            {level}
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
            <Star className="w-2.5 h-2.5 text-yellow-900" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">{title}</span>
            <span className="text-xs text-muted-foreground">Lvl {level}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-gradient-to-br from-background to-muted/50 rounded-xl p-4 border border-border/50', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
              {level}
            </div>
            <motion.div
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-md"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-5 h-5 text-yellow-900" />
            </motion.div>
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground">Nível {level}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-primary">
            <Zap className="w-4 h-4" />
            <span className="font-bold">{xpCurrent.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">/{xpForLevel.toLocaleString()} XP</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-secondary rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          </motion.div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progressPercent}% completo</span>
          <span>Faltam {xpToNext.toLocaleString()} XP para nível {level + 1}</span>
        </div>
      </div>

      {variant === 'detailed' && (
        <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-3 gap-4">
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Progresso" value={`${progressPercent}%`} />
          <StatCard icon={<Zap className="w-4 h-4" />} label="XP Total" value={xpCurrent.toLocaleString()} />
          <StatCard icon={<Award className="w-4 h-4" />} label="Próximo" value={`Lvl ${level + 1}`} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary mb-1">
        {icon}
      </div>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default XPProgress;
