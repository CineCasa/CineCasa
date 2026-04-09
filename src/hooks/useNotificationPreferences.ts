import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  // Push Notifications
  push_enabled: boolean;
  push_content: boolean;
  push_social: boolean;
  push_system: boolean;
  push_achievements: boolean;
  push_reminders: boolean;
  
  // In-App Notifications
  in_app_enabled: boolean;
  in_app_content: boolean;
  in_app_social: boolean;
  in_app_system: boolean;
  in_app_achievements: boolean;
  in_app_reminders: boolean;
  
  // Email Notifications
  email_enabled: boolean;
  email_content: boolean;
  email_social: boolean;
  email_system: boolean;
  email_achievements: boolean;
  email_reminders: boolean;
  email_digest: 'daily' | 'weekly' | 'monthly' | 'never';
  
  // SMS Notifications
  sms_enabled: boolean;
  sms_critical_only: boolean;
  sms_content: boolean;
  sms_social: boolean;
  sms_system: boolean;
  
  // General Settings
  sound_enabled: boolean;
  vibration_enabled: boolean;
  desktop_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  
  // Display Settings
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  max_visible: number;
  auto_dismiss_time: number;
  group_similar: boolean;
  show_previews: boolean;
  
  // Content Preferences
  new_episodes: boolean;
  new_movies: boolean;
  recommendations: boolean;
  friend_activity: boolean;
  system_updates: boolean;
  marketing: boolean;
  
  // Frequency Controls
  content_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  social_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  system_frequency: 'real-time' | 'immediate' | 'daily' | 'weekly';
  
  // Privacy Settings
  public_activity: boolean;
  show_online_status: boolean;
  allow_friend_requests: boolean;
  share_watch_history: boolean;
  
  // Metadata
  updated_at: string;
  version: string;
}

interface UseNotificationPreferencesOptions {
  userId?: string;
  autoSave?: boolean;
  enableRealTime?: boolean;
}

export function useNotificationPreferences({
  userId,
  autoSave = true,
  enableRealTime = true,
}: UseNotificationPreferencesOptions = {}) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences>(getDefaultPreferences());
  const [hasChanges, setHasChanges] = useState(false);

  // Query para buscar preferências
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!userId) return getDefaultPreferences();

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar preferências:', error);
        return getDefaultPreferences();
      }

      return data || getDefaultPreferences();
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para salvar preferências
  const savePreferences = useMutation({
    mutationFn: async (newPreferences: Partial<NotificationPreferences>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const updatedPreferences = {
        user_id: userId,
        ...preferences,
        ...newPreferences,
        updated_at: new Date().toISOString(),
        version: '1.0',
      };

      const { data, error } = await supabase
        .from('user_notification_preferences')
        .upsert(updatedPreferences, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar preferências:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedPreferences) => {
      setPreferences(updatedPreferences);
      setHasChanges(false);
      queryClient.setQueryData(['notification-preferences', userId], updatedPreferences);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['push-notifications', userId] });
      queryClient.invalidateQueries({ queryKey: ['in-app-notifications', userId] });
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de salvar preferências:', error);
    },
  });

  // Atualizar preferências quando dados mudam
  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !hasChanges || !userId) return;

    const timer = setTimeout(() => {
      savePreferences.mutate(preferences);
    }, 2000); // Salvar 2 segundos após a última mudança

    return () => clearTimeout(timer);
  }, [autoSave, hasChanges, preferences, userId, savePreferences.mutate]);

  // Funções para atualizar preferências específicas
  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    setHasChanges(true);
  }, [preferences]);

  const updatePushSettings = useCallback((updates: {
    enabled?: boolean;
    content?: boolean;
    social?: boolean;
    system?: boolean;
    achievements?: boolean;
    reminders?: boolean;
  }) => {
    const pushUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.enabled !== undefined) pushUpdates.push_enabled = updates.enabled;
    if (updates.content !== undefined) pushUpdates.push_content = updates.content;
    if (updates.social !== undefined) pushUpdates.push_social = updates.social;
    if (updates.system !== undefined) pushUpdates.push_system = updates.system;
    if (updates.achievements !== undefined) pushUpdates.push_achievements = updates.achievements;
    if (updates.reminders !== undefined) pushUpdates.push_reminders = updates.reminders;

    updatePreferences(pushUpdates);
  }, [updatePreferences]);

  const updateInAppSettings = useCallback((updates: {
    enabled?: boolean;
    content?: boolean;
    social?: boolean;
    system?: boolean;
    achievements?: boolean;
    reminders?: boolean;
    sound?: boolean;
    vibration?: boolean;
    desktop?: boolean;
  }) => {
    const inAppUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.enabled !== undefined) inAppUpdates.in_app_enabled = updates.enabled;
    if (updates.content !== undefined) inAppUpdates.in_app_content = updates.content;
    if (updates.social !== undefined) inAppUpdates.in_app_social = updates.social;
    if (updates.system !== undefined) inAppUpdates.in_app_system = updates.system;
    if (updates.achievements !== undefined) inAppUpdates.in_app_achievements = updates.achievements;
    if (updates.reminders !== undefined) inAppUpdates.in_app_reminders = updates.reminders;
    if (updates.sound !== undefined) inAppUpdates.sound_enabled = updates.sound;
    if (updates.vibration !== undefined) inAppUpdates.vibration_enabled = updates.vibration;
    if (updates.desktop !== undefined) inAppUpdates.desktop_notifications = updates.desktop;

    updatePreferences(inAppUpdates);
  }, [updatePreferences]);

  const updateEmailSettings = useCallback((updates: {
    enabled?: boolean;
    content?: boolean;
    social?: boolean;
    system?: boolean;
    achievements?: boolean;
    reminders?: boolean;
    digest?: 'daily' | 'weekly' | 'monthly' | 'never';
  }) => {
    const emailUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.enabled !== undefined) emailUpdates.email_enabled = updates.enabled;
    if (updates.content !== undefined) emailUpdates.email_content = updates.content;
    if (updates.social !== undefined) emailUpdates.email_social = updates.social;
    if (updates.system !== undefined) emailUpdates.email_system = updates.system;
    if (updates.achievements !== undefined) emailUpdates.email_achievements = updates.achievements;
    if (updates.reminders !== undefined) emailUpdates.email_reminders = updates.reminders;
    if (updates.digest !== undefined) emailUpdates.email_digest = updates.digest;

    updatePreferences(emailUpdates);
  }, [updatePreferences]);

  const updateDisplaySettings = useCallback((updates: {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxVisible?: number;
    autoDismiss?: number;
    groupSimilar?: boolean;
    showPreviews?: boolean;
  }) => {
    const displayUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.position !== undefined) displayUpdates.position = updates.position;
    if (updates.maxVisible !== undefined) displayUpdates.max_visible = updates.maxVisible;
    if (updates.autoDismiss !== undefined) displayUpdates.auto_dismiss_time = updates.autoDismiss;
    if (updates.groupSimilar !== undefined) displayUpdates.group_similar = updates.groupSimilar;
    if (updates.showPreviews !== undefined) displayUpdates.show_previews = updates.showPreviews;

    updatePreferences(displayUpdates);
  }, [updatePreferences]);

  const updateQuietHours = useCallback((updates: {
    enabled?: boolean;
    start?: string;
    end?: string;
  }) => {
    const quietUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.enabled !== undefined) quietUpdates.quiet_hours_enabled = updates.enabled;
    if (updates.start !== undefined) quietUpdates.quiet_hours_start = updates.start;
    if (updates.end !== undefined) quietUpdates.quiet_hours_end = updates.end;

    updatePreferences(quietUpdates);
  }, [updatePreferences]);

  const updateContentPreferences = useCallback((updates: {
    newEpisodes?: boolean;
    newMovies?: boolean;
    recommendations?: boolean;
    friendActivity?: boolean;
    systemUpdates?: boolean;
    marketing?: boolean;
  }) => {
    const contentUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.newEpisodes !== undefined) contentUpdates.new_episodes = updates.newEpisodes;
    if (updates.newMovies !== undefined) contentUpdates.new_movies = updates.newMovies;
    if (updates.recommendations !== undefined) contentUpdates.recommendations = updates.recommendations;
    if (updates.friendActivity !== undefined) contentUpdates.friend_activity = updates.friendActivity;
    if (updates.systemUpdates !== undefined) contentUpdates.system_updates = updates.systemUpdates;
    if (updates.marketing !== undefined) contentUpdates.marketing = updates.marketing;

    updatePreferences(contentUpdates);
  }, [updatePreferences]);

  const updateFrequencySettings = useCallback((updates: {
    content?: 'real-time' | 'hourly' | 'daily' | 'weekly';
    social?: 'real-time' | 'hourly' | 'daily' | 'weekly';
    system?: 'real-time' | 'immediate' | 'daily' | 'weekly';
  }) => {
    const frequencyUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.content !== undefined) frequencyUpdates.content_frequency = updates.content;
    if (updates.social !== undefined) frequencyUpdates.social_frequency = updates.social;
    if (updates.system !== undefined) frequencyUpdates.system_frequency = updates.system;

    updatePreferences(frequencyUpdates);
  }, [updatePreferences]);

  const updatePrivacySettings = useCallback((updates: {
    publicActivity?: boolean;
    showOnlineStatus?: boolean;
    allowFriendRequests?: boolean;
    shareWatchHistory?: boolean;
  }) => {
    const privacyUpdates: Partial<NotificationPreferences> = {};
    
    if (updates.publicActivity !== undefined) privacyUpdates.public_activity = updates.publicActivity;
    if (updates.showOnlineStatus !== undefined) privacyUpdates.show_online_status = updates.showOnlineStatus;
    if (updates.allowFriendRequests !== undefined) privacyUpdates.allow_friend_requests = updates.allowFriendRequests;
    if (updates.shareWatchHistory !== undefined) privacyUpdates.share_watch_history = updates.shareWatchHistory;

    updatePreferences(privacyUpdates);
  }, [updatePreferences]);

  // Funções de conveniência
  const enableAllNotifications = useCallback(() => {
    updatePreferences({
      push_enabled: true,
      in_app_enabled: true,
      email_enabled: true,
      sound_enabled: true,
      vibration_enabled: true,
      desktop_notifications: true,
      new_episodes: true,
      new_movies: true,
      recommendations: true,
      friend_activity: true,
      system_updates: true,
    });
  }, [updatePreferences]);

  const disableAllNotifications = useCallback(() => {
    updatePreferences({
      push_enabled: false,
      in_app_enabled: false,
      email_enabled: false,
      sound_enabled: false,
      vibration_enabled: false,
      desktop_notifications: false,
      new_episodes: false,
      new_movies: false,
      recommendations: false,
      friend_activity: false,
      system_updates: false,
      marketing: false,
    });
  }, [updatePreferences]);

  const resetToDefaults = useCallback(() => {
    setPreferences(getDefaultPreferences());
    setHasChanges(true);
  }, []);

  const exportPreferences = useCallback(() => {
    const exportData = {
      userId,
      preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-preferences-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [userId, preferences]);

  const importPreferences = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.preferences) {
        setPreferences(data.preferences);
        setHasChanges(true);
      }
    } catch (error) {
      console.error('❌ Erro ao importar preferências:', error);
    }
  }, []);

  // Obter preferências padrão
  const getDefaultPreferences = (): NotificationPreferences => ({
    // Push Notifications
    push_enabled: true,
    push_content: true,
    push_social: true,
    push_system: true,
    push_achievements: true,
    push_reminders: false,
    
    // In-App Notifications
    in_app_enabled: true,
    in_app_content: true,
    in_app_social: true,
    in_app_system: true,
    in_app_achievements: true,
    in_app_reminders: true,
    
    // Email Notifications
    email_enabled: true,
    email_content: false,
    email_social: false,
    email_system: true,
    email_achievements: true,
    email_reminders: false,
    email_digest: 'weekly',
    
    // SMS Notifications
    sms_enabled: false,
    sms_critical_only: true,
    sms_content: false,
    sms_social: false,
    sms_system: false,
    
    // General Settings
    sound_enabled: true,
    vibration_enabled: true,
    desktop_notifications: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Display Settings
    position: 'top-right',
    max_visible: 5,
    auto_dismiss_time: 5000,
    group_similar: true,
    show_previews: true,
    
    // Content Preferences
    new_episodes: true,
    new_movies: true,
    recommendations: true,
    friend_activity: true,
    system_updates: true,
    marketing: false,
    
    // Frequency Controls
    content_frequency: 'real-time',
    social_frequency: 'real-time',
    system_frequency: 'immediate',
    
    // Privacy Settings
    public_activity: false,
    show_online_status: true,
    allow_friend_requests: true,
    share_watch_history: false,
    
    // Metadata
    updated_at: new Date().toISOString(),
    version: '1.0',
  });

  // Verificar se está em quiet hours
  const isInQuietHours = useCallback(() => {
    if (!preferences.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const startTime = preferences.quiet_hours_start;
    const endTime = preferences.quiet_hours_end;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Cross midnight (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [preferences]);

  return {
    // Dados
    preferences,
    isLoading,
    error,
    hasChanges,
    isInQuietHours,
    
    // Ações
    savePreferences: savePreferences.mutate,
    updatePreferences,
    
    // Atualizadores específicos
    updatePushSettings,
    updateInAppSettings,
    updateEmailSettings,
    updateDisplaySettings,
    updateQuietHours,
    updateContentPreferences,
    updateFrequencySettings,
    updatePrivacySettings,
    
    // Utilitários
    enableAllNotifications,
    disableAllNotifications,
    resetToDefaults,
    exportPreferences,
    importPreferences,
    
    // Estados
    isSaving: savePreferences.isPending,
    hasPushEnabled: preferences.push_enabled,
    hasInAppEnabled: preferences.in_app_enabled,
    hasEmailEnabled: preferences.email_enabled,
    hasSoundEnabled: preferences.sound_enabled,
    hasVibrationEnabled: preferences.vibration_enabled,
  };
}
