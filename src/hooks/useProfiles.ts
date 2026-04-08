import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string;
  color: string;
  is_kids: boolean;
  is_main: boolean;
  preferences: {
    language: string;
    subtitles: boolean;
    autoplay: boolean;
    maturity_rating: string;
  };
  created_at: string;
  updated_at: string;
}

const AVATAR_COLORS = [
  '#e50914', // Red
  '#564d4d', // Dark Gray
  '#b20710', // Dark Red
  '#221f1f', // Black
  '#f5f5f1', // White
  '#46d369', // Green
  '#0071eb', // Blue
  '#e87c03', // Orange
  '#d9d9d9', // Light Gray
  '#8c8c8c', // Medium Gray
];

const DEFAULT_AVATARS = [
  '/avatars/avatar-1.png',
  '/avatars/avatar-2.png',
  '/avatars/avatar-3.png',
  '/avatars/avatar-4.png',
  '/avatars/avatar-5.png',
  '/avatars/kids.png',
];

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all profiles for current user
  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_main', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const fetchedProfiles = data || [];
      setProfiles(fetchedProfiles);

      // Load current profile from localStorage
      const savedProfileId = localStorage.getItem('current_profile_id');
      if (savedProfileId) {
        const saved = fetchedProfiles.find(p => p.id === savedProfileId);
        if (saved) {
          setCurrentProfile(saved);
        } else if (fetchedProfiles.length > 0) {
          setCurrentProfile(fetchedProfiles[0]);
        }
      } else if (fetchedProfiles.length > 0) {
        setCurrentProfile(fetchedProfiles[0]);
        localStorage.setItem('current_profile_id', fetchedProfiles[0].id);
      }
    } catch (err) {
      console.error('[useProfiles] Error:', err);
      setError('Erro ao carregar perfis');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Create new profile
  const createProfile = async (profileData: Partial<Profile>): Promise<Profile | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check max profiles (5 per account)
      if (profiles.length >= 5) {
        throw new Error('Máximo de 5 perfis atingido');
      }

      const newProfile = {
        user_id: user.id,
        name: profileData.name || 'Novo Perfil',
        avatar_url: profileData.avatar_url || DEFAULT_AVATARS[0],
        color: profileData.color || AVATAR_COLORS[0],
        is_kids: profileData.is_kids || false,
        is_main: profiles.length === 0, // First profile is main
        preferences: {
          language: 'pt-BR',
          subtitles: true,
          autoplay: true,
          maturity_rating: profileData.is_kids ? 'kids' : '18+',
          ...profileData.preferences,
        },
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) throw error;

      await fetchProfiles();
      return data;
    } catch (err: any) {
      console.error('[useProfiles] Create error:', err);
      setError(err.message);
      return null;
    }
  };

  // Update profile
  const updateProfile = async (profileId: string, updates: Partial<Profile>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (error) throw error;

      await fetchProfiles();
      return true;
    } catch (err) {
      console.error('[useProfiles] Update error:', err);
      return false;
    }
  };

  // Delete profile
  const deleteProfile = async (profileId: string): Promise<boolean> => {
    try {
      // Prevent deleting main profile
      const profile = profiles.find(p => p.id === profileId);
      if (profile?.is_main) {
        throw new Error('Não é possível excluir o perfil principal');
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      // If deleted profile was current, switch to main
      if (currentProfile?.id === profileId) {
        const mainProfile = profiles.find(p => p.is_main);
        if (mainProfile) {
          switchProfile(mainProfile.id);
        }
      }

      await fetchProfiles();
      return true;
    } catch (err: any) {
      console.error('[useProfiles] Delete error:', err);
      setError(err.message);
      return false;
    }
  };

  // Switch current profile
  const switchProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setCurrentProfile(profile);
      localStorage.setItem('current_profile_id', profileId);
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('profileChanged', { detail: profile }));
    }
  };

  // Update profile preferences
  const updatePreferences = async (preferences: Partial<Profile['preferences']>): Promise<boolean> => {
    if (!currentProfile) return false;

    const updatedPreferences = {
      ...currentProfile.preferences,
      ...preferences,
    };

    return updateProfile(currentProfile.id, { preferences: updatedPreferences });
  };

  return {
    profiles,
    currentProfile,
    loading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    updatePreferences,
    refresh: fetchProfiles,
    maxProfiles: 5,
    avatarColors: AVATAR_COLORS,
    defaultAvatars: DEFAULT_AVATARS,
  };
}

export default useProfiles;
