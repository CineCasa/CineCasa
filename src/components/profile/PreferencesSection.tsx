import { motion } from 'framer-motion';
import { 
  Settings2, 
  Heart, 
  Play, 
  Volume2, 
  Subtitles,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreferencesSectionProps {
  preferences: {
    favorite_genres: string[];
    video_quality: string;
    audio_language: string;
    subtitle_language: string;
  };
  onEdit: () => void;
}

const preferenceItems = [
  {
    icon: <Heart className="w-4 h-4" />,
    label: 'Gêneros favoritos',
    key: 'favorite_genres',
    format: (value: string[]) => value.length > 0 ? value.join(', ') : 'Nenhum selecionado',
  },
  {
    icon: <Play className="w-4 h-4" />,
    label: 'Qualidade de vídeo',
    key: 'video_quality',
    format: (value: string) => {
      const qualityMap: Record<string, string> = {
        'auto': 'Automático',
        'sd': 'SD',
        'hd': 'HD',
        'fhd': 'Full HD',
        '4k': '4K',
      };
      return qualityMap[value] || value;
    },
  },
  {
    icon: <Volume2 className="w-4 h-4" />,
    label: 'Idioma do áudio',
    key: 'audio_language',
    format: (value: string) => {
      const langMap: Record<string, string> = {
        'pt-BR': 'Português',
        'en': 'Inglês',
        'es': 'Espanhol',
      };
      return langMap[value] || value;
    },
  },
  {
    icon: <Subtitles className="w-4 h-4" />,
    label: 'Idioma das legendas',
    key: 'subtitle_language',
    format: (value: string) => {
      const langMap: Record<string, string> = {
        'pt-BR': 'Português',
        'en': 'Inglês',
        'es': 'Espanhol',
      };
      return langMap[value] || value;
    },
  },
];

export function PreferencesSection({ preferences, onEdit }: PreferencesSectionProps) {
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
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Settings2 className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Preferências</h3>
            <p className="text-xs text-gray-500">Personalize sua experiência</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        {preferenceItems.map((item, index) => (
          <motion.button
            key={item.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onEdit}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl",
              "hover:bg-white/5 transition-colors group"
            )}
          >
            <div className="p-2 bg-white/5 rounded-lg text-gray-400 group-hover:text-cyan-400 transition-colors">
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-gray-400">{item.label}</p>
              <p className="text-sm font-medium text-white">
                {item.format(preferences[item.key as keyof typeof preferences] as any)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default PreferencesSection;
