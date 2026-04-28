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
