import { supabase } from '@/integrations/supabase/client';

export interface MonthlyActivity {
  month: string;
  hours: number;
}

export interface GenrePreference {
  genre: string;
  count: number;
  percentage: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop' | 'tv';
  last_active: string;
  is_current: boolean;
}

export interface AnalyticsData {
  monthly_activity: MonthlyActivity[];
  top_genres: GenrePreference[];
  completion_rate: number;
  binge_sessions: number;
  current_streak: number;
}

class UserStatsService {
  async getMonthlyActivity(userId: string): Promise<MonthlyActivity[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .from('user_progress')
      .select('updated_at, progress_seconds')
      .eq('user_id', userId)
      .gte('updated_at', sixMonthsAgo.toISOString())
      .order('updated_at', { ascending: true });

    if (error) {
      console.error('[UserStatsService] Error fetching monthly activity:', error);
      return [];
    }

    // Group by month
    const monthlyMap = new Map<string, number>();
    
    data?.forEach((item: any) => {
      const date = new Date(item.updated_at);
      const monthKey = date.toLocaleString('pt-BR', { month: 'short' });
      const hours = (item.progress_seconds || 0) / 3600;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + hours);
    });

    // Fill missing months with 0
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const result: MonthlyActivity[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      result.push({
        month: monthName,
        hours: Math.round(monthlyMap.get(monthName) || 0),
      });
    }

    return result;
  }

  async getTopGenres(userId: string, limit: number = 4): Promise<GenrePreference[]> {
    const { data, error } = await supabase
      .from('genre_preferences')
      .select('genre, score')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[UserStatsService] Error fetching genre preferences:', error);
      return [];
    }

    const total = data?.reduce((acc, curr) => acc + (curr.score || 0), 0) || 1;

    return (data || []).map((item: any) => ({
      genre: item.genre,
      count: item.score,
      percentage: Math.round(((item.score || 0) / total) * 100),
    }));
  }

  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    const { data, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity', { ascending: false });

    if (error) {
      console.error('[UserStatsService] Error fetching devices:', error);
      return [];
    }

    const currentDeviceId = localStorage.getItem('device_fingerprint');

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.device_name || 'Dispositivo Desconhecido',
      type: this.getDeviceType(item.device_type),
      last_active: new Date(item.last_activity).toLocaleString('pt-BR'),
      is_current: item.device_fingerprint === currentDeviceId,
    }));
  }

  private getDeviceType(type: string): 'mobile' | 'tablet' | 'desktop' | 'tv' {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return 'mobile';
      case 'tablet':
        return 'tablet';
      case 'tv':
      case 'smarttv':
        return 'tv';
      default:
        return 'desktop';
    }
  }

  async getCompletionRate(userId: string): Promise<number> {
    const { data: total, error: totalError } = await supabase
      .from('watch_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalError) {
      console.error('[UserStatsService] Error fetching total count:', totalError);
      return 0;
    }

    const { data: completed, error: completedError } = await supabase
      .from('watch_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('progress_percent', 90);

    if (completedError) {
      console.error('[UserStatsService] Error fetching completed count:', completedError);
      return 0;
    }

    const totalCount = total?.length || 0;
    const completedCount = completed?.length || 0;

    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  }

  async getFullAnalytics(userId: string): Promise<AnalyticsData> {
    const [monthlyActivity, topGenres, completionRate] = await Promise.all([
      this.getMonthlyActivity(userId),
      this.getTopGenres(userId),
      this.getCompletionRate(userId),
    ]);

    return {
      monthly_activity: monthlyActivity,
      top_genres: topGenres,
      completion_rate: completionRate,
      binge_sessions: 0, // Will be calculated based on watch patterns
      current_streak: 0, // Will be calculated based on daily activity
    };
  }
}

export const userStatsService = new UserStatsService();
export default userStatsService;
