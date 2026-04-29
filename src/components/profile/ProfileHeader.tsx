import { motion } from 'framer-motion';
import { 
  Play, 
  Tv, 
  Clock, 
  Trophy, 
  Crown, 
  Star,
  Edit3,
  Camera,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    bio: string | null;
    plan: 'free' | 'premium' | 'vip';
    level: number;
    created_at: string;
    is_verified: boolean;
  } | null;
  stats: {
    movies_watched: number;
    series_watched: number;
    total_hours: number;
    achievements_count: number;
  };
  onEditProfile: () => void;
  onEditAvatar: () => void;
}

export function ProfileHeader({ user, stats, onEditProfile, onEditAvatar }: ProfileHeaderProps) {
  const navigate = useNavigate();

  if (!user) return null;

  const memberSince = new Date(user.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  const statItems = [
    { icon: <Play className="w-5 h-5" />, value: stats.movies_watched, label: 'Filmes assistidos' },
    { icon: <Tv className="w-5 h-5" />, value: stats.series_watched, label: 'Séries assistidas' },
    { icon: <Clock className="w-5 h-5" />, value: `${stats.total_hours}h`, label: 'Tempo assistido' },
    { icon: <Trophy className="w-5 h-5" />, value: stats.achievements_count, label: 'Conquistas' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] border border-cyan-500/20"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10 p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            <motion.div
              className="relative w-32 h-32 lg:w-40 lg:h-40"
              whileHover={{ scale: 1.02 }}
            >
              {/* Avatar Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-50" />
              
              {/* Avatar Container */}
              <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500/30">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <span className="text-4xl font-bold text-gray-400">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Edit Avatar Button */}
              <motion.button
                onClick={onEditAvatar}
                className="absolute bottom-2 right-2 p-2.5 bg-cyan-500 hover:bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-4 h-4 text-white" />
              </motion.button>

              {/* Verified Badge */}
              {user.is_verified && (
                <div className="absolute top-2 right-2 p-1.5 bg-blue-500 rounded-full shadow-lg">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    {user.name}
                  </h1>
                  {user.is_verified && (
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Membro desde {memberSince}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-3">
                {user.plan === 'premium' && (
                  <motion.div
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-300">Premium</span>
                  </motion.div>
                )}
                
                <motion.div
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <Star className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">Nível {user.level}</span>
                </motion.div>

                <motion.button
                  onClick={onEditProfile}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit3 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statItems.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl",
                    "bg-white/5 border border-white/10 backdrop-blur-sm",
                    "hover:bg-white/10 transition-colors"
                  )}
                >
                  <div className="p-2.5 bg-cyan-500/20 rounded-lg text-cyan-400">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ProfileHeader;
