import { motion } from 'framer-motion';
import { Trophy, Medal, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface AchievementsSectionProps {
  achievements: Achievement[];
  onViewAll: () => void;
}

const tierColors = {
  bronze: 'from-amber-600 to-amber-700',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-yellow-400 to-yellow-500',
  platinum: 'from-cyan-400 to-blue-500',
};

const tierGlow = {
  bronze: 'shadow-amber-500/20',
  silver: 'shadow-gray-400/20',
  gold: 'shadow-yellow-400/20',
  platinum: 'shadow-cyan-400/20',
};

const achievementIcons: Record<string, React.ReactNode> = {
  'maratonista': <Trophy className="w-6 h-6" />,
  'explorador': <Target className="w-6 h-6" />,
  'critico': <Medal className="w-6 h-6" />,
  'veterano': <Flame className="w-6 h-6" />,
};

export function AchievementsSection({ achievements, onViewAll }: AchievementsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl overflow-hidden",
        "bg-[#0f172a]/80 border border-white/10"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Trophy className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Conquistas</h3>
            <p className="text-xs text-gray-500">Veja suas conquistas</p>
          </div>
        </div>
        <motion.button
          onClick={onViewAll}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          whileHover={{ x: 2 }}
        >
          Ver todas
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4">
        {achievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-xl",
                  "bg-gradient-to-br",
                  tierColors[achievement.tier],
                  "bg-opacity-10 border border-white/10",
                  "hover:border-white/20 transition-all cursor-pointer"
                )}
              >
                {/* Glow Effect */}
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-xl opacity-30",
                  tierGlow[achievement.tier]
                )} />

                {/* Icon */}
                <div className="relative z-10 p-3 rounded-xl bg-white/10 mb-3">
                  <div className="text-white">
                    {achievementIcons[achievement.code] || <Trophy className="w-6 h-6" />}
                  </div>
                </div>

                {/* Text */}
                <p className="relative z-10 text-xs font-semibold text-white text-center">
                  {achievement.name}
                </p>
                <p className="relative z-10 text-[10px] text-white/60 text-center mt-1">
                  {achievement.description}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-sm text-gray-500">
              Nenhuma conquista desbloqueada
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Continue assistindo para desbloquear conquistas
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AchievementsSection;
