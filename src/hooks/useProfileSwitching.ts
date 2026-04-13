import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  avatar_customization?: any;
  preferences: UserPreferences;
  is_kid: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  watch_time_minutes?: number;
  achievements?: string[];
}

interface UserPreferences {
  language: string;
  auto_play: boolean;
  subtitles: boolean;
  subtitle_language: string;
  video_quality: 'auto' | 'low' | 'medium' | 'high' | 'ultra';
  parental_controls: {
    enabled: boolean;
    max_rating: number;
    blocked_genres: string[];
  };
  ui_preferences: {
    theme: 'light' | 'dark' | 'auto';
    grid_size: 'small' | 'medium' | 'large';
    show_continue_watching: boolean;
    show_recommendations: boolean;
  };
  privacy: {
    share_watch_history: boolean;
    share_recommendations: boolean;
    public_profile: boolean;
  };
}

interface UseProfileSwitchingOptions {
  userId?: string;
  enableAutoSwitch?: boolean;
  switchDelay?: number;
}

export function useProfileSwitching({
  userId,
  enableAutoSwitch = false,
  switchDelay = 1000,
}: UseProfileSwitchingOptions = {}) {
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [isSwitching, setIsSwitching] = useState(false);
  const queryClient = useQueryClient();

  // Query para buscar perfis do usuário
  const { data: profiles, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profiles', userId],
    queryFn: async (): Promise<UserProfile[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('is_active', { ascending: false })
        .order('last_login', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar perfis:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para perfil ativo atual
  const { data: activeProfile } = useQuery({
    queryKey: ['active-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar perfil ativo:', error);
        throw error;
      }

      if (data) {
        setActiveProfileId(data.id);
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // 10 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
  });

  // Mutation para criar novo perfil
  const createProfile = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const newProfile = {
        user_id: userId,
        name: profileData.name || 'Novo Perfil',
        avatar_url: profileData.avatar_url || '/default-avatar.png',
        avatar_customization: profileData.avatar_customization || {},
        preferences: profileData.preferences || getDefaultPreferences(),
        is_kid: profileData.is_kid || false,
        is_active: false,
        watch_time_minutes: 0,
        achievements: [],
        ...profileData,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar perfil:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (newProfile) => {
      queryClient.setQueryData(['user-profiles', userId], (old: UserProfile[] = []) => 
        [...old, newProfile]
      );
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de criar perfil:', error);
    },
  });

  // Mutation para atualizar perfil
  const updateProfile = useMutation({
    mutationFn: async ({ profileId, updates }: { profileId: string; updates: Partial<UserProfile> }) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (updatedProfile, variables) => {
      queryClient.setQueryData(['user-profiles', userId], (old: UserProfile[] = []) =>
        old.map(profile => 
          profile.id === variables.profileId 
            ? { ...profile, ...updatedProfile }
            : profile
        )
      );

      // Se atualizou o perfil ativo, atualizar cache do ativo
      if (variables.profileId === activeProfileId) {
        queryClient.setQueryData(['active-profile', userId], updatedProfile);
      }
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de atualizar perfil:', error);
    },
  });

  // Mutation para deletar perfil
  const deleteProfile = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao deletar perfil:', error);
        throw error;
      }

      return profileId;
    },
    onSuccess: (deletedProfileId) => {
      queryClient.setQueryData(['user-profiles', userId], (old: UserProfile[] = []) =>
        old.filter(profile => profile.id !== deletedProfileId)
      );

      // Se deletou o perfil ativo, ativar outro
      if (deletedProfileId === activeProfileId) {
        const remainingProfiles = (profiles || []).filter(p => p.id !== deletedProfileId);
        if (remainingProfiles.length > 0) {
          switchToProfile(remainingProfiles[0].id);
        }
      }
    },
    onError: (error) => {
      console.error('❌ Erro na mutation de deletar perfil:', error);
    },
  });

  // Mutation para alternar perfil ativo
  const switchToProfile = useCallback(async (profileId: string) => {
    if (!userId || isSwitching) return;

    setIsSwitching(true);
    
    // Safety timeout - garante que isSwitching seja resetado
    const safetyTimeout = setTimeout(() => {
      console.warn('[useProfileSwitching] Safety timeout ativado - resetando isSwitching');
      setIsSwitching(false);
    }, 10000); // 10 segundos máximo

    try {
      console.log(`[useProfileSwitching] Iniciando troca para perfil: ${profileId}`);
      
      // Desativar todos os perfis
      const { error: deactivateError } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (deactivateError) {
        console.error('❌ Erro ao desativar perfis:', deactivateError);
        throw deactivateError;
      }

      // Ativar o perfil selecionado
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          is_active: true,
          last_login: new Date().toISOString(),
        })
        .eq('id', profileId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao ativar perfil:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Perfil não encontrado após atualização');
      }

      // Atualizar cache
      queryClient.setQueryData(['active-profile', userId], data);
      setActiveProfileId(profileId);

      // Invalidar queries relacionadas para forçar reload
      queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['watch-progress'] });

      console.log(`✅ Perfil alternado com sucesso para: ${data?.name}`);

      // Aguardar um pouco antes de finalizar
      await new Promise(resolve => setTimeout(resolve, switchDelay));

    } catch (error) {
      console.error('❌ Erro ao alternar perfil:', error);
      // Notificar usuário do erro (pode ser implementado via toast)
    } finally {
      clearTimeout(safetyTimeout);
      setIsSwitching(false);
    }
  }, [userId, isSwitching, queryClient, switchDelay]);

  // Auto-switch baseado em horário ou dispositivo
  useEffect(() => {
    if (!enableAutoSwitch || !profiles || profiles.length === 0) return;

    const autoSwitchLogic = () => {
      const currentHour = new Date().getHours();
      
      // Exemplo: perfil infantil durante o dia, perfil adulto à noite
      const kidProfile = profiles.find(p => p.is_kid);
      const adultProfile = profiles.find(p => !p.is_kid);

      if (currentHour >= 8 && currentHour <= 18 && kidProfile && activeProfile?.is_kid === false) {
        console.log('🌅 Auto-switch para perfil infantil');
        switchToProfile(kidProfile.id);
      } else if ((currentHour < 8 || currentHour > 18) && adultProfile && activeProfile?.is_kid === true) {
        console.log('🌙 Auto-switch para perfil adulto');
        switchToProfile(adultProfile.id);
      }
    };

    const interval = setInterval(autoSwitchLogic, 60 * 60 * 1000); // Verificar a cada hora
    return () => clearInterval(interval);
  }, [enableAutoSwitch, profiles, activeProfile, switchToProfile]);

  // Função para obter perfil ativo
  const getActiveProfile = useCallback(() => {
    return profiles?.find(p => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);

  // Função para criar perfil com defaults
  const createDefaultProfile = useCallback(async (name: string, isKid: boolean = false) => {
    const defaultPreferences = getDefaultPreferences(isKid);
    
    return createProfile.mutateAsync({
      name,
      is_kid: isKid,
      preferences: defaultPreferences,
      avatar_url: isKid ? '/kid-avatar.png' : '/adult-avatar.png',
    });
  }, [createProfile.mutateAsync]);

  // Função para obter estatísticas dos perfis
  const getProfilesStats = useCallback(() => {
    if (!profiles) return {
      total: 0,
      kids: 0,
      adults: 0,
      totalWatchTime: 0,
      mostActive: null,
    };

    const total = profiles.length;
    const kids = profiles.filter(p => p.is_kid).length;
    const adults = total - kids;
    const totalWatchTime = profiles.reduce((sum, p) => sum + (p.watch_time_minutes || 0), 0);
    const mostActive = profiles.reduce((max, p) => 
      (p.watch_time_minutes || 0) > (max.watch_time_minutes || 0) ? p : max
    , profiles[0]);

    return {
      total,
      kids,
      adults,
      totalWatchTime,
      mostActive,
    };
  }, [profiles]);

  // Função para exportar/importar perfis
  const exportProfiles = useCallback(async () => {
    if (!profiles) return;

    const exportData = {
      profiles: profiles.map(p => ({
        name: p.name,
        preferences: p.preferences,
        is_kid: p.is_kid,
        watch_time_minutes: p.watch_time_minutes,
        achievements: p.achievements,
        created_at: p.created_at,
      })),
      exported_at: new Date().toISOString(),
      version: '1.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinecasa-profiles-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profiles]);

  return {
    // Dados
    profiles: profiles || [],
    activeProfile: activeProfile,
    isLoading,
    error,
    isSwitching,
    stats: getProfilesStats(),
    
    // Ações
    switchToProfile,
    createProfile: createProfile.mutate,
    updateProfile: updateProfile.mutate,
    deleteProfile: deleteProfile.mutate,
    createDefaultProfile,
    exportProfiles,
    
    // Utilitários
    getActiveProfile,
  };
}

// Função para obter preferências padrão
function getDefaultPreferences(isKid: boolean = false): UserPreferences {
  return {
    language: 'pt-BR',
    auto_play: true,
    subtitles: false,
    subtitle_language: 'pt-BR',
    video_quality: 'auto',
    parental_controls: {
      enabled: isKid,
      max_rating: isKid ? 10 : 18,
      blocked_genres: isKid ? ['horror', 'adult'] : [],
    },
    ui_preferences: {
      theme: 'dark',
      grid_size: 'medium',
      show_continue_watching: true,
      show_recommendations: true,
    },
    privacy: {
      share_watch_history: false,
      share_recommendations: false,
      public_profile: false,
    },
  };
}
