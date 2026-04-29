import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Lock,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AccountSettingsSectionProps {
  onDeleteAccount: () => void;
}

const settingsGroups = [
  {
    icon: <User className="w-4 h-4" />,
    label: 'Dados pessoais',
    path: '/settings/personal',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
  },
  {
    icon: <Shield className="w-4 h-4" />,
    label: 'Segurança',
    path: '/settings/security',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  {
    icon: <Bell className="w-4 h-4" />,
    label: 'Notificações',
    path: '/settings/notifications',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  {
    icon: <Lock className="w-4 h-4" />,
    label: 'Privacidade',
    path: '/settings/privacy',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
];

export function AccountSettingsSection({ onDeleteAccount }: AccountSettingsSectionProps) {
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
        <div className="p-2 bg-gray-500/20 rounded-lg">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Configurações da conta</h3>
          <p className="text-xs text-gray-500">Gerencie sua conta e segurança</p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {settingsGroups.map((group, index) => (
            <motion.button
              key={group.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(group.path)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl",
                "bg-white/5 hover:bg-white/10",
                "border border-white/5 hover:border-white/10",
                "transition-all group"
              )}
            >
              <div className={cn("p-2 rounded-lg", group.bgColor)}>
                <div className={group.color}>{group.icon}</div>
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-white text-center">
                {group.label}
              </span>
            </motion.button>
          ))}

          {/* Delete Account */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onDeleteAccount}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl",
              "bg-red-500/10 hover:bg-red-500/20",
              "border border-red-500/20 hover:border-red-500/30",
              "transition-all group"
            )}
          >
            <div className="p-2 rounded-lg bg-red-500/20">
              <Trash2 className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs font-medium text-red-400 text-center">
              Excluir conta
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default AccountSettingsSection;
