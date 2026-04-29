import { motion } from 'framer-motion';
import { 
  List, 
  History, 
  Star, 
  Download, 
  Monitor,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const quickActions = [
  {
    icon: <List className="w-5 h-5" />,
    label: 'Minha Lista',
    path: '/watchlist',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: <History className="w-5 h-5" />,
    label: 'Histórico',
    path: '/history',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Star className="w-5 h-5" />,
    label: 'Avaliações',
    path: '/ratings',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: <Download className="w-5 h-5" />,
    label: 'Downloads',
    path: '/downloads',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: <Monitor className="w-5 h-5" />,
    label: 'Dispositivos conectados',
    path: '/devices',
    color: 'from-purple-500 to-violet-500',
  },
];

export function QuickActionsSection() {
  const navigate = useNavigate();

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
        <div className="p-2 bg-cyan-500/20 rounded-lg">
          <List className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="font-semibold text-white">Ações rápidas</h3>
      </div>

      {/* Content */}
      <div className="p-2">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.path}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => navigate(action.path)}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl",
              "hover:bg-white/5 transition-colors group"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg bg-gradient-to-br",
              action.color,
              "bg-opacity-20 text-white"
            )}>
              {action.icon}
            </div>
            <span className="flex-1 text-left text-sm font-medium text-white">
              {action.label}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default QuickActionsSection;
