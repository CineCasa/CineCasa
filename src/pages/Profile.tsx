import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Search, Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { profileService, type UserProfile, type UserStats, type WatchActivity, type UserAchievement, type UserPreferences } from '@/services/ProfileService';
import { userStatsService, type MonthlyActivity } from '@/services/UserStatsService';

// Profile Components
import {
  ProfileSidebar,
  ProfileHeader,
  AboutSection,
  AvatarSection,
  PreferencesSection,
  ActivitySection,
  AchievementsSection,
  StatsChartSection,
  QuickActionsSection,
  AccountSettingsSection,
} from '@/components/profile';

// ============================================
// TYPES & INTERFACES
// ============================================
interface ProfileData {
  user: UserProfile | null;
  stats: UserStats;
  activities: WatchActivity[];
  achievements: UserAchievement[];
  preferences: UserPreferences;
  monthlyActivity: MonthlyActivity[];
}

// ============================================
// COMPONENT: LOADING SKELETON
// ============================================
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pl-0 lg:pl-64">
      <div className="p-4 lg:p-8 space-y-6">
        <div className="h-64 rounded-3xl bg-gray-800/50 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT: PROFILE PAGE
// ============================================
export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    user: null,
    stats: { movies_watched: 0, series_watched: 0, total_hours: 0, achievements_count: 0 },
    activities: [],
    achievements: [],
    preferences: { favorite_genres: [], video_quality: 'auto', audio_language: 'pt-BR', subtitle_language: 'pt-BR' },
    monthlyActivity: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [userProfile, stats, activities, achievements, preferences, monthlyActivity] = await Promise.all([
        profileService.getUserProfile(user.id),
        profileService.getUserStats(user.id),
        profileService.getRecentActivity(user.id, 4),
        profileService.getUserAchievements(user.id),
        profileService.getUserPreferences(user.id),
        userStatsService.getMonthlyActivity(user.id),
      ]);
      setProfileData({ user: userProfile, stats, activities, achievements, preferences, monthlyActivity });
    } catch (error) {
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleEditBio = async (newBio: string) => {
    if (!user?.id) return;
    const success = await profileService.updateProfile(user.id, { bio: newBio });
    if (success) {
      toast.success('Bio atualizada!');
      loadProfileData();
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  const currentUser = profileData.user || {
    id: user?.id || '',
    email: user?.email || '',
    name: profile?.name || user?.email?.split('@')[0] || 'Usuário',
    avatar_url: profile?.avatar_url || null,
    bio: profile?.bio || null,
    plan: (profile?.plan as any) || 'free',
    level: 1,
    created_at: user?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_verified: false,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <ProfileSidebar isPremium={currentUser.plan === 'premium'} onLogout={handleLogout} />
      
      <main className="pl-0 lg:pl-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar filmes, séries, gêneros..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden border border-white/10">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Profile Header */}
          <ProfileHeader
            user={currentUser}
            stats={profileData.stats}
            onEditProfile={() => navigate('/settings/personal')}
            onEditAvatar={() => navigate('/settings/avatar')}
          />

          {/* Main Grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <AboutSection
                bio={currentUser.bio}
                onEdit={() => handleEditBio(currentUser.bio || '')}
              />
              <PreferencesSection
                preferences={profileData.preferences}
                onEdit={() => navigate('/settings/preferences')}
              />
            </div>

            {/* Middle Column */}
            <div className="space-y-6">
              <AvatarSection
                avatarUrl={currentUser.avatar_url}
                name={currentUser.name}
                onPersonalize={() => navigate('/settings/avatar')}
              />
              <ActivitySection
                activities={profileData.activities}
                onViewAll={() => navigate('/history')}
              />
              <StatsChartSection
                monthlyActivity={profileData.monthlyActivity}
                totalHoursThisMonth={profileData.monthlyActivity[profileData.monthlyActivity.length - 1]?.hours || 0}
                growthPercentage={12}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <AchievementsSection
                achievements={profileData.achievements}
                onViewAll={() => navigate('/achievements')}
              />
              <QuickActionsSection />
              <AccountSettingsSection
                onDeleteAccount={() => {
                  if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
                    toast.info('Funcionalidade em desenvolvimento');
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
