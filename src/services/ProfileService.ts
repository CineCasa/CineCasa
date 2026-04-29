import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  plan: 'free' | 'premium' | 'vip';
  level: number;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
}

export interface UserStats {
  movies_watched: number;
  series_watched: number;
  total_hours: number;
  achievements_count: number;
}

export interface WatchActivity {
  id: string;
  content_id: string;
  content_type: 'movie' | 'series';
  title: string;
  poster: string | null;
  progress: number;
  watched_at: string;
  episode_info?: {
    season: number;
    episode: number;
    episode_title: string;
  };
}

export interface UserAchievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserPreferences {
  favorite_genres: string[];
  video_quality: 'auto' | 'sd' | 'hd' | 'fhd' | '4k';
  audio_language: string;
  subtitle_language: string;
  autoplay: boolean;
}

class ProfileService {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[ProfileService] Error fetching profile:', error);
      return null;
    }

    return data as UserProfile;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[ProfileService] Error updating profile:', error);
      return false;
    }

    return true;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    // Get movies count from watch_history
    const { data: moviesData, error: moviesError } = await supabase
      .from('watch_history')
      .select('content_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('content_type', 'movie');

    if (moviesError) {
      console.error('[ProfileService] Error fetching movies count:', moviesError);
    }

    // Get series count
    const { data: seriesData, error: seriesError } = await supabase
      .from('watch_history')
      .select('content_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('content_type', 'series');

    if (seriesError) {
      console.error('[ProfileService] Error fetching series count:', seriesError);
    }

    // Get total hours from user_progress
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('progress_seconds')
      .eq('user_id', userId);

    if (progressError) {
      console.error('[ProfileService] Error fetching progress:', progressError);
    }

    const totalSeconds = progressData?.reduce((acc, curr) => acc + (curr.progress_seconds || 0), 0) || 0;
    const totalHours = Math.round(totalSeconds / 3600);

    // Get achievements count from user_achievements
    const { count: achievementsCount, error: achievementsError } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);

    if (achievementsError) {
      console.error('[ProfileService] Error fetching achievements:', achievementsError);
    }

    return {
      movies_watched: moviesData?.length || 0,
      series_watched: seriesData?.length || 0,
      total_hours: totalHours,
      achievements_count: achievementsCount || 0,
    };
  }

  async getRecentActivity(userId: string, limit: number = 5): Promise<WatchActivity[]> {
    const { data, error } = await supabase
      .from('watch_history')
      .select(`
        id,
        content_id,
        content_type,
        watched_at,
        progress_percent,
        cinema:titulo,
        series:nome
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ProfileService] Error fetching recent activity:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      content_id: item.content_id,
      content_type: item.content_type,
      title: item.content_type === 'movie' ? item.cinema?.titulo : item.series?.nome,
      poster: null, // Will be fetched separately or use placeholder
      progress: item.progress_percent || 0,
      watched_at: item.watched_at,
    }));
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        id,
        unlocked_at,
        achievement:achievement_id (
          code,
          name,
          description,
          icon,
          tier
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', true)
      .order('unlocked_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('[ProfileService] Error fetching achievements:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      code: item.achievement?.code || '',
      name: item.achievement?.name || '',
      description: item.achievement?.description || '',
      icon: item.achievement?.icon || '',
      unlocked_at: item.unlocked_at,
      tier: item.achievement?.tier || 'bronze',
    }));
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[ProfileService] Error fetching preferences:', error);
      return {
        favorite_genres: [],
        video_quality: 'auto',
        audio_language: 'pt-BR',
        subtitle_language: 'pt-BR',
        autoplay: true,
      };
    }

    return {
      favorite_genres: data?.favorite_genres || [],
      video_quality: data?.video_quality || 'auto',
      audio_language: data?.audio_language || 'pt-BR',
      subtitle_language: data?.subtitle_language || 'pt-BR',
      autoplay: data?.autoplay ?? true,
    };
  }

  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<boolean> {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[ProfileService] Error updating preferences:', error);
      return false;
    }

    return true;
  }

  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, file);

    if (uploadError) {
      console.error('[ProfileService] Error uploading avatar:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
    
    // Update profile with new avatar URL
    await this.updateProfile(userId, { avatar_url: data.publicUrl });

    return data.publicUrl;
  }
}

export const profileService = new ProfileService();
export default profileService;
