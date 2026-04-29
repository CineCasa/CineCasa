import { motion } from 'framer-motion';
import { Camera, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarSectionProps {
  avatarUrl: string | null;
  name: string;
  onPersonalize: () => void;
}

export function AvatarSection({ avatarUrl, name, onPersonalize }: AvatarSectionProps) {
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
      <div className="flex items-center gap-3 p-5 border-b border-white/5">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Avatar</h3>
          <p className="text-xs text-gray-500">Personalize seu avatar</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex flex-col items-center">
          {/* Avatar Preview */}
          <motion.div
            className="relative w-28 h-28 mb-4"
            whileHover={{ scale: 1.02 }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full blur opacity-40" />
            <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/20">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-400">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Edit Button */}
            <motion.button
              className="absolute bottom-0 right-0 p-2 bg-cyan-500 hover:bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera className="w-3 h-3 text-white" />
            </motion.button>
          </motion.div>

          {/* Personalize Button */}
          <motion.button
            onClick={onPersonalize}
            className={cn(
              "w-full py-2.5 px-4",
              "bg-gradient-to-r from-cyan-500 to-blue-500",
              "text-white text-sm font-medium rounded-xl",
              "hover:from-cyan-400 hover:to-blue-400",
              "transition-all shadow-lg shadow-cyan-500/20"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Personalizar avatar
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default AvatarSection;
