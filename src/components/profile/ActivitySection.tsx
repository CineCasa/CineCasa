import { motion } from 'framer-motion';
import { Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  poster: string | null;
  progress: number;
  watched_at: string;
  episode_info?: {
    season: number;
    episode: number;
    episode_title: string;
  };
}

interface ActivitySectionProps {
  activities: Activity[];
  onViewAll: () => void;
}

export function ActivitySection({ activities, onViewAll }: ActivitySectionProps) {
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
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Atividade recente</h3>
            <p className="text-xs text-gray-500">Últimos 7 dias</p>
          </div>
        </div>
        <motion.button
          onClick={onViewAll}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          whileHover={{ x: 2 }}
        >
          Ver todos
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl",
                "hover:bg-white/5 transition-colors group cursor-pointer"
              )}
            >
              {/* Poster */}
              <div className="relative w-14 h-20 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                {activity.poster ? (
                  <img
                    src={activity.poster}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                
                {/* Progress Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                  <div
                    className="h-full bg-cyan-500"
                    style={{ width: `${activity.progress}%` }}
                  />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">
                  {activity.title}
                </h4>
                <p className="text-xs text-gray-500">
                  {activity.content_type === 'movie' ? 'Filme' : 'Série'}
                  {activity.episode_info && (
                    <span> • T{activity.episode_info.season}:E{activity.episode_info.episode}</span>
                  )}
                </p>
                
                {/* Progress Text */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-cyan-400 font-medium">
                    {activity.progress}%
                  </span>
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${activity.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Time */}
              <span className="text-xs text-gray-500 shrink-0">
                {new Date(activity.watched_at).toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              Nenhuma atividade recente
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Comece a assistir algo para ver aqui
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ActivitySection;
