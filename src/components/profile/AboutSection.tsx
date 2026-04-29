import { motion } from 'framer-motion';
import { User, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AboutSectionProps {
  bio: string | null;
  onEdit: () => void;
  isEditing?: boolean;
  onSave?: (bio: string) => void;
}

export function AboutSection({ bio, onEdit, isEditing = false, onSave }: AboutSectionProps) {
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
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Sobre você</h3>
            <p className="text-xs text-gray-500">Conte um pouco sobre você</p>
          </div>
        </div>
        <motion.button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Edit3 className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Content */}
      <div className="p-5">
        {bio ? (
          <p className="text-sm text-gray-300 leading-relaxed">{bio}</p>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-3">
              Você ainda não adicionou uma bio.
            </p>
            <motion.button
              onClick={onEdit}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 text-sm font-medium rounded-lg hover:bg-cyan-500/30 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Adicionar bio
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default AboutSection;
