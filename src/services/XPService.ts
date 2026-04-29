import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types
export type UserXP = Database['public']['Tables']['user_xp']['Row'];
export type UserLevel = Database['public']['Tables']['user_levels']['Row'];
export type LevelConfig = Database['public']['Tables']['level_config']['Row'];
export type XPLog = Database['public']['Tables']['xp_logs']['Row'];

export type XPSourceType = 'watch' | 'rate' | 'review' | 'achievement' | 'streak' | 'social' | 'bonus' | 'event';

export interface XPGainResult {
  xpGained: number;
  xpWithMultiplier: number;
  newTotalXP: number;
  previousLevel: number;
  currentLevel: number;
  levelUp: boolean;
  levelTitle: string;
  unlockedFeatures: string[];
  multiplierActive: boolean;
}

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
  xpForLevel: number;
  xpCurrent: number;
  xpToNext: number;
  progressPercent: number;
  features: string[];
}

class XPService {
  private static instance: XPService;
  private levelCache: LevelConfig[] = [];

  static getInstance(): XPService {
    if (!XPService.instance) {
      XPService.instance = new XPService();
    }
    return XPService.instance;
  }

  // =====================================================
  // XP DO USUÁRIO
  // =====================================================

  async getUserXP(userId: string): Promise<UserXP | null> {
    const { data, error } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async getOrCreateUserXP(userId: string): Promise<UserXP> {
    const existing = await this.getUserXP(userId);
    if (existing) return existing;

    // Criar novo registro
    const { data, error } = await supabase
      .from('user_xp')
      .insert({ user_id: userId, total_xp: 0 })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Falha ao criar registro de XP');
    return data;
  }

  // =====================================================
  // GANHO DE XP
  // =====================================================

  async gainXP(
    userId: string,
    amount: number,
    source: XPSourceType,
    sourceId?: string,
    meta: Record<string, unknown> = {}
  ): Promise<XPGainResult> {
    // Validar amount
    if (amount <= 0) {
      throw new Error('Quantidade de XP deve ser positiva');
    }

    // Buscar XP atual
    const userXP = await this.getOrCreateUserXP(userId);
    const userLevel = await this.getOrCreateUserLevel(userId);

    // Aplicar multiplicador
    const multiplier = userXP.active_multiplier || 1;
    const finalXP = Math.round(amount * multiplier);

    // Calcular novo total
    const previousTotal = userXP.total_xp;
    const newTotal = previousTotal + finalXP;

    // Calcular XP por categoria
    const categoryKey = this.getCategoryKey(source);
    const currentCategoryXP = (userXP as Record<string, number>)[categoryKey] || 0;

    // Atualizar XP
    const { error: updateError } = await supabase
      .from('user_xp')
      .update({
        total_xp: newTotal,
        [categoryKey]: currentCategoryXP + finalXP,
        last_xp_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log de XP
    await this.logXP(userId, amount, multiplier, finalXP, source, sourceId, userLevel.current_level);

    // Verificar level up
    const levelResult = await this.checkAndProcessLevelUp(userId, newTotal, userLevel);

    return {
      xpGained: amount,
      xpWithMultiplier: finalXP,
      newTotalXP: newTotal,
      previousLevel: userLevel.current_level,
      currentLevel: levelResult.newLevel,
      levelUp: levelResult.leveledUp,
      levelTitle: levelResult.newTitle,
      unlockedFeatures: levelResult.unlockedFeatures,
      multiplierActive: multiplier > 1,
    };
  }

  private getCategoryKey(source: XPSourceType): string {
    const map: Record<XPSourceType, string> = {
      watch: 'xp_watching',
      rate: 'xp_rating',
      review: 'xp_social',
      achievement: 'xp_achievements',
      streak: 'xp_social',
      social: 'xp_social',
      bonus: 'xp_special',
      event: 'xp_special',
    };
    return map[source] || 'xp_special';
  }

  private async logXP(
    userId: string,
    amount: number,
    multiplier: number,
    final: number,
    source: XPSourceType,
    sourceId?: string,
    levelAtMoment?: number
  ): Promise<void> {
    await supabase.from('xp_logs').insert({
      user_id: userId,
      source_type: source,
      source_id: sourceId,
      xp_amount: amount,
      xp_multiplier: multiplier,
      xp_final: final,
      level_at_moment: levelAtMoment,
    });
  }

  // =====================================================
  // NÍVEIS E PROGRESSÃO
  // =====================================================

  async getLevelConfig(): Promise<LevelConfig[]> {
    if (this.levelCache.length === 0) {
      const { data, error } = await supabase
        .from('level_config')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) throw error;
      this.levelCache = data || [];
    }
    return this.levelCache;
  }

  async getUserLevel(userId: string): Promise<UserLevel | null> {
    const { data, error } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async getOrCreateUserLevel(userId: string): Promise<UserLevel> {
    const existing = await this.getUserLevel(userId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('user_levels')
      .insert({
        user_id: userId,
        current_level: 1,
        current_title: 'Novato',
        xp_needed_for_next: 100,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Falha ao criar registro de nível');
    return data;
  }

  async checkAndProcessLevelUp(
    userId: string,
    totalXP: number,
    currentLevelData: UserLevel
  ): Promise<{ leveledUp: boolean; newLevel: number; newTitle: string; unlockedFeatures: string[] }> {
    const levels = await this.getLevelConfig();
    let newLevel = currentLevelData.current_level;
    let newTitle = currentLevelData.current_title;
    const unlockedFeatures: string[] = [];

    // Verificar cada nível
    for (const level of levels) {
      if (totalXP >= level.xp_required && level.level > newLevel) {
        newLevel = level.level;
        newTitle = level.title;
        if (level.features_unlocked) {
          unlockedFeatures.push(...(level.features_unlocked as string[]));
        }
      }
    }

    const leveledUp = newLevel > currentLevelData.current_level;

    if (leveledUp) {
      // Calcular XP para próximo nível
      const nextLevel = levels.find(l => l.level === newLevel + 1);
      const xpForNext = nextLevel ? nextLevel.xp_required - totalXP : 0;

      // Atualizar nível
      await supabase
        .from('user_levels')
        .update({
          current_level: newLevel,
          current_title: newTitle,
          xp_for_current_level: totalXP - (levels.find(l => l.level === newLevel)?.xp_required || 0),
          xp_needed_for_next: xpForNext > 0 ? xpForNext : 1000,
          total_levels_achieved: newLevel,
          max_level_reached: newLevel > currentLevelData.max_level_reached ? newLevel : currentLevelData.max_level_reached,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Atualizar apenas XP acumulado no nível atual
      const currentLevelXP = levels.find(l => l.level === newLevel)?.xp_required || 0;
      const nextLevel = levels.find(l => l.level === newLevel + 1);
      const xpForNext = nextLevel ? nextLevel.xp_required - totalXP : 0;

      await supabase
        .from('user_levels')
        .update({
          xp_for_current_level: totalXP - currentLevelXP,
          xp_needed_for_next: xpForNext > 0 ? xpForNext : 1000,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    return { leveledUp, newLevel, newTitle, unlockedFeatures };
  }

  async getLevelInfo(userId: string): Promise<LevelInfo> {
    const [userLevel, userXP, levels] = await Promise.all([
      this.getOrCreateUserLevel(userId),
      this.getOrCreateUserXP(userId),
      this.getLevelConfig(),
    ]);

    const currentLevelData = levels.find(l => l.level === userLevel.current_level);
    const nextLevelData = levels.find(l => l.level === userLevel.current_level + 1);

    const xpCurrent = userLevel.xp_for_current_level;
    const xpToNext = userLevel.xp_needed_for_next;
    const xpForLevel = currentLevelData?.xp_for_level || 100;
    const progressPercent = Math.min(100, Math.round((xpCurrent / xpForLevel) * 100));

    return {
      level: userLevel.current_level,
      title: userLevel.current_title,
      xpRequired: currentLevelData?.xp_required || 0,
      xpForLevel,
      xpCurrent,
      xpToNext,
      progressPercent,
      features: (currentLevelData?.features_unlocked as string[]) || [],
    };
  }

  // =====================================================
  // MULTIPLICADORES
  // =====================================================

  async setMultiplier(userId: string, multiplier: number, expiresAt?: Date): Promise<void> {
    const { error } = await supabase
      .from('user_xp')
      .update({
        active_multiplier: multiplier,
        multiplier_expires_at: expiresAt?.toISOString() || null,
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getActiveMultiplier(userId: string): Promise<number> {
    const userXP = await this.getUserXP(userId);
    if (!userXP) return 1;

    // Verificar se expirou
    if (userXP.multiplier_expires_at) {
      const expiresAt = new Date(userXP.multiplier_expires_at);
      if (expiresAt < new Date()) {
        // Resetar para 1
        await this.setMultiplier(userId, 1);
        return 1;
      }
    }

    return userXP.active_multiplier || 1;
  }

  // =====================================================
  // LEADERBOARD
  // =====================================================

  async getTopUsers(limit: number = 10): Promise<{ user_id: string; total_xp: number; current_level: number; title: string }[]> {
    const { data, error } = await supabase
      .from('user_xp')
      .select(`
        user_id,
        total_xp,
        user_level:user_levels(current_level, current_title)
      `)
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      user_id: item.user_id,
      total_xp: item.total_xp,
      current_level: item.user_level?.current_level || 1,
      title: item.user_level?.current_title || 'Novato',
    }));
  }

  async getUserRank(userId: string): Promise<{ rank: number; totalUsers: number }> {
    // Contar usuários com mais XP
    const { data: userXP } = await supabase
      .from('user_xp')
      .select('total_xp')
      .eq('user_id', userId)
      .single();

    if (!userXP) return { rank: 0, totalUsers: 0 };

    const { count: betterUsers } = await supabase
      .from('user_xp')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', userXP.total_xp);

    const { count: totalUsers } = await supabase
      .from('user_xp')
      .select('*', { count: 'exact', head: true });

    return {
      rank: (betterUsers || 0) + 1,
      totalUsers: totalUsers || 0,
    };
  }

  // =====================================================
  // LOGS E HISTÓRICO
  // =====================================================

  async getXPLogs(userId: string, limit: number = 50): Promise<XPLog[]> {
    const { data, error } = await supabase
      .from('xp_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getXPStats(userId: string): Promise<{
    total: number;
    bySource: Record<XPSourceType, number>;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    const userXP = await this.getOrCreateUserXP(userId);

    return {
      total: userXP.total_xp,
      bySource: {
        watch: userXP.xp_watching || 0,
        rate: userXP.xp_rating || 0,
        review: userXP.xp_social || 0,
        achievement: userXP.xp_achievements || 0,
        streak: userXP.xp_social || 0,
        social: userXP.xp_social || 0,
        bonus: userXP.xp_special || 0,
        event: userXP.xp_special || 0,
      },
      today: userXP.xp_today || 0,
      thisWeek: userXP.xp_this_week || 0,
      thisMonth: userXP.xp_this_month || 0,
    };
  }
}

export const xpService = XPService.getInstance();
export default xpService;
