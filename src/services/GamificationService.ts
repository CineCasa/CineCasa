import { supabase } from '@/integrations/supabase/client';
import { avatarService } from './AvatarService';
import { xpService, type XPSourceType } from './XPService';
import { achievementService } from './AchievementService';

export interface GamificationEvent {
  type: 'watch' | 'rate' | 'review' | 'streak' | 'social';
  userId: string;
  contentId?: string;
  contentType?: 'movie' | 'series';
  genre?: string;
  metadata?: Record<string, unknown>;
}

export interface GamificationResult {
  xpGained: number;
  achievementsUnlocked: string[];
  itemsUnlocked: string[];
  levelUp: boolean;
  newLevel?: number;
}

class GamificationService {
  private static instance: GamificationService;

  static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  async processEvent(event: GamificationEvent): Promise<GamificationResult> {
    const result: GamificationResult = {
      xpGained: 0,
      achievementsUnlocked: [],
      itemsUnlocked: [],
      levelUp: false,
    };

    // Calculate and award XP
    const xpAmount = this.calculateXP(event);
    if (xpAmount > 0) {
      const xpResult = await xpService.gainXP(
        event.userId,
        xpAmount,
        event.type as XPSourceType,
        event.contentId
      );
      result.xpGained = xpResult.xpWithMultiplier;
      result.levelUp = xpResult.levelUp;
      result.newLevel = xpResult.currentLevel;
    }

    // Track achievements
    const achievementCodes = this.getRelevantAchievements(event);
    for (const code of achievementCodes) {
      const unlocked = await achievementService.trackProgress(event.userId, code, 1);
      if (unlocked) {
        result.achievementsUnlocked.push(code);
      }
    }

    // Check for item unlocks based on new achievements/level
    await this.checkItemUnlocks(event.userId, result);

    return result;
  }

  private calculateXP(event: GamificationEvent): number {
    const baseXP: Record<string, number> = {
      watch: 10,
      rate: 5,
      review: 20,
      streak: 50,
      social: 15,
    };
    return baseXP[event.type] || 0;
  }

  private getRelevantAchievements(event: GamificationEvent): string[] {
    const codes: string[] = [];

    if (event.type === 'watch') {
      codes.push('watch_1', 'watch_10', 'watch_50', 'watch_100');
    }
    if (event.type === 'rate') {
      codes.push('rate_1', 'rate_10', 'rate_50', 'rate_100');
    }
    if (event.type === 'streak') {
      codes.push('streak_3', 'streak_7', 'streak_30');
    }

    return codes;
  }

  private async checkItemUnlocks(userId: string, result: GamificationResult): Promise<void> {
    // This would check if any avatar items should be unlocked based on level/achievements
    // Implementation would depend on specific unlock rules
  }

  // Streaks
  async updateWatchStreak(userId: string): Promise<{ streak: number; milestone: boolean }> {
    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    const today = new Date().toISOString().split('T')[0];
    const lastWatch = streaks?.watch_streak_last_at
      ? new Date(streaks.watch_streak_last_at).toISOString().split('T')[0]
      : null;

    // If already watched today, don't increment
    if (lastWatch === today) {
      return { streak: streaks?.watch_streak_days || 1, milestone: false };
    }

    // Check if streak continues (watched yesterday) or resets
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (lastWatch === yesterdayStr) {
      newStreak = (streaks?.watch_streak_days || 0) + 1;
    }

    const maxStreak = Math.max(newStreak, streaks?.watch_streak_max || 0);

    await supabase.from('user_streaks').upsert({
      user_id: userId,
      watch_streak_days: newStreak,
      watch_streak_max: maxStreak,
      watch_streak_last_at: new Date().toISOString(),
    });

    const milestones = [3, 7, 30, 100, 365];
    const isMilestone = milestones.includes(newStreak);

    return { streak: newStreak, milestone: isMilestone };
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<{ userId: string; level: number; xp: number; title: string }[]> {
    const { data } = await supabase
      .from('user_levels')
      .select('user_id, current_level, current_title, user_xp: user_xp(total_xp)')
      .order('current_level', { ascending: false })
      .limit(limit);

    return (data || []).map((item: any) => ({
      userId: item.user_id,
      level: item.current_level,
      xp: item.user_xp?.total_xp || 0,
      title: item.current_title,
    }));
  }
}

export const gamificationService = GamificationService.getInstance();
export default gamificationService;
