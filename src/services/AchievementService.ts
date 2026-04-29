import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { xpService } from './XPService';

export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row'];

export type AchievementCategory = 'watching' | 'rating' | 'social' | 'collection' | 'streak' | 'special';

export interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  target: number;
  percentage: number;
  isCompleted: boolean;
}

class AchievementService {
  private static instance: AchievementService;
  private cache: Achievement[] = [];

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  async getAll(): Promise<Achievement[]> {
    if (this.cache.length === 0) {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      this.cache = data || [];
    }
    return this.cache;
  }

  async getByCode(code: string): Promise<Achievement | null> {
    const { data } = await supabase.from('achievements').select('*').eq('code', code).single();
    return data;
  }

  async getUserProgress(userId: string): Promise<AchievementProgress[]> {
    const [achievements, userAchievements] = await Promise.all([
      this.getAll(),
      supabase.from('user_achievements').select('*').eq('user_id', userId),
    ]);

    const userMap = new Map((userAchievements.data || []).map(ua => [ua.achievement_id, ua]));

    return achievements.map(achievement => {
      const userAch = userMap.get(achievement.id);
      const progress = userAch?.progress_current || 0;
      const target = achievement.requirement_value;
      return {
        achievement,
        progress: Math.min(progress, target),
        target,
        percentage: Math.min(100, Math.round((progress / target) * 100)),
        isCompleted: userAch?.is_completed || false,
      };
    });
  }

  async trackProgress(userId: string, code: string, increment: number = 1): Promise<boolean> {
    const achievement = await this.getByCode(code);
    if (!achievement) return false;

    // Get or create user achievement
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .maybeSingle();

    let userAchievement = existing;
    if (!userAchievement) {
      const { data: created } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          progress_target: achievement.requirement_value,
        })
        .select()
        .single();
      userAchievement = created;
    }

    if (!userAchievement || userAchievement.is_completed) return false;

    const newProgress = (userAchievement.progress_current || 0) + increment;
    const isCompleted = newProgress >= achievement.requirement_value;

    await supabase
      .from('user_achievements')
      .update({
        progress_current: newProgress,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', userAchievement.id);

    // Award XP on completion
    if (isCompleted && achievement.xp_reward > 0) {
      await xpService.gainXP(userId, achievement.xp_reward, 'achievement', achievement.id);
    }

    return isCompleted;
  }

  async getCompleted(userId: string): Promise<UserAchievement[]> {
    const { data } = await supabase
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false });
    return data || [];
  }

  getTierColor(tier: string): string {
    const colors: Record<string, string> = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF',
    };
    return colors[tier] || '#CD7F32';
  }
}

export const achievementService = AchievementService.getInstance();
export default achievementService;
