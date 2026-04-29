import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Film, Star, Users, Flame, Gift } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useUserAchievementProgress, useCompletedAchievements } from '@/hooks/useAchievements';
import { AchievementCard } from './AchievementCard';
import type { AchievementCategory } from '@/services/AchievementService';

interface AchievementsListProps {
  userId: string;
}

type CategoryTab = 'all' | AchievementCategory;

const CATEGORIES: { id: CategoryTab; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todas', icon: <Trophy className="w-4 h-4" /> },
  { id: 'watching', label: 'Assistindo', icon: <Film className="w-4 h-4" /> },
  { id: 'rating', label: 'Avaliações', icon: <Star className="w-4 h-4" /> },
  { id: 'social', label: 'Social', icon: <Users className="w-4 h-4" /> },
  { id: 'streak', label: 'Sequências', icon: <Flame className="w-4 h-4" /> },
  { id: 'special', label: 'Especiais', icon: <Gift className="w-4 h-4" /> },
];

export function AchievementsList({ userId }: AchievementsListProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');

  const { data: allProgress, isLoading: loadingProgress } = useUserAchievementProgress(userId);
  const { data: completed, isLoading: loadingCompleted } = useCompletedAchievements(userId);

  const isLoading = loadingProgress || loadingCompleted;

  const filteredProgress = allProgress?.filter(p =>
    activeTab === 'all' || p.achievement.category === activeTab
  );

  const completedCount = completed?.length || 0;
  const totalCount = allProgress?.length || 0;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header Stats */}
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Conquistas
            </h2>
            <p className="text-muted-foreground mt-1">
              Desbloqueie conquistas ganhando XP e recompensas exclusivas
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{completedCount}/{totalCount}</div>
            <div className="text-sm text-muted-foreground">{completionRate}% completado</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryTab)}>
        <div className="border-b border-border/50">
          <TabsList className="w-full justify-start rounded-none bg-transparent p-2 gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="flex items-center gap-2">
                  {cat.icon}
                  {cat.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredProgress?.map((item) => (
                <AchievementCard
                  key={item.achievement.id}
                  achievement={item.achievement}
                  progress={item.progress}
                  target={item.target}
                  isCompleted={item.isCompleted}
                  completedAt={item.completedAt}
                />
              ))}

              {filteredProgress?.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conquista encontrada nesta categoria</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

export default AchievementsList;
