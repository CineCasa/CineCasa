import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Search, Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { profileService, type UserProfile, type UserStats, type WatchActivity, type UserAchievement, type UserPreferences } from '@/services/ProfileService';
import { userStatsService, type MonthlyActivity } from '@/services/UserStatsService';
import { achievementService, type Achievement } from '@/services/AchievementService';

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
  isKid: boolean;
  color: string;
}

// ============================================
// COMPONENT: LOADING SKELETON
// ============================================
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] pl-0 lg:pl-64">
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header Skeleton */}
        <div className="h-64 rounded-3xl bg-gray-800/50 animate-pulse" />
        
        {/* Grid Skeleton */}
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
  
  // Estados de UI
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Dados do Perfil
  const [profileData, setProfileData] = useState({
    name: profile?.name || user?.email?.split('@')[0] || 'Usuário',
    bio: profile?.bio || 'Apaixonado por filmes e séries.'
  });

  // Estados de Configurações
  const [parentalControl, setParentalControl] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);
  
  // Dados reais do usuário
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [watchProgress, setWatchProgress] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Configurações de Legenda
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>({
    fontSize: 'medium',
    color: '#FFFFFF',
    background: true
  });

  // Personalização de Avatar
  const [showAvatarCustomizer, setShowAvatarCustomizer] = useState(false);

  // Verificar se é admin
  const isAdmin = user?.email === 'mpaixaodesigner@gmail.com';
  const planType = profile?.plan || 'Premium';

  // ============================================
  // HANDLERS
  // ============================================

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;
    
    setIsLoadingData(true);
    try {
      // Buscar histórico de assistidos
      const { data: history } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(10);
      
      if (history) setWatchHistory(history);

      // Buscar favoritos
      const { data: favs } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .limit(10);
      
      if (favs) setFavorites(favs);

      // Buscar progresso de visualização
      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .gt('progress_seconds', 0)
        .limit(10);
      
      if (progress) setWatchProgress(progress);

      // Buscar dispositivos
      const { data: userDevices } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false });
      
      if (userDevices) {
        setDevices(userDevices.map(d => ({
          id: d.id,
          name: d.device_name || 'Dispositivo Desconhecido',
          type: d.device_type || 'unknown',
          location: d.ip_address || 'Localização Desconhecida',
          lastActive: new Date(d.last_activity).toLocaleString('pt-BR'),
          isCurrent: d.device_fingerprint === localStorage.getItem('device_fingerprint')
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Optimistic update
      setIsEditing(false);
      
      const { error } = await supabase
        .from('profiles')
        .update({ name: profileData.name, bio: profileData.bio })
        .eq('id', user?.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar perfil');
      setIsEditing(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sessão encerrada');
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao sair');
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('device_sessions')
        .delete()
        .eq('id', deviceId);
      
      if (error) throw error;
      
      setDevices(devices.filter(d => d.id !== deviceId));
      toast.success('Dispositivo removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
      toast.error('Erro ao remover dispositivo');
    }
  };

  const handlePinToggle = async (enabled: boolean) => {
    setPinEnabled(enabled);
    // Aqui seria feita a chamada ao Supabase
    return Promise.resolve();
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'tv': return <Monitor className="w-5 h-5" />;
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'web': return <Globe className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium border border-green-500/30">
            <Check className="w-3 h-3" />
            Pago
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/30">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/30">
            <X className="w-3 h-3" />
            Atrasado
          </span>
        );
      default: return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Você precisa estar logado</p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* ============================================
          CAMADA 0: FUNDO - Imagem da família
          ============================================ */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('/imagem pagina de login.png')`,
            filter: 'blur(8px) brightness(1.1) saturate(1.05)',
            transform: 'scale(1.05)'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.85) 100%)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
      </div>

      {/* ============================================
          CAMADA 1 & 2: CONTEÚDO
          ============================================ */}
      <div className="relative z-10 min-h-screen pb-20 pt-[80px]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ============================================
              HEADER DE PERFIL
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar Grande com Borda Neon */}
                <div className="relative group shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500 shadow-[0_0_30px_rgba(0,229,255,0.4)] group-hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] transition-shadow duration-500">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center overflow-hidden border-4 border-black">
                      <span className="text-5xl md:text-6xl font-bold text-white">
                        {profileData.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button className="absolute bottom-2 right-2 p-2.5 bg-cyan-500 hover:bg-cyan-400 rounded-full shadow-lg transition-all duration-300 hover:scale-110">
                    <Camera className="w-4 h-4 text-black" />
                  </button>
                </div>

                {/* Info do Usuário */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="text-3xl md:text-4xl font-bold text-white bg-white/10 border border-cyan-500/30 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                        autoFocus
                      />
                    ) : (
                      <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                        {profileData.name}
                      </h1>
                    )}
                    
                    {/* Badge Premium */}
                    <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1">
                      <Crown className="w-3 h-3 mr-1 text-cyan-400" />
                      {planType}
                    </Badge>
                  </div>

                  <p className="text-white/60 mb-1 flex items-center justify-center md:justify-start gap-2 text-sm">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    {user.email}
                  </p>

                  <p className="text-white/40 text-sm mb-4 flex items-center justify-center md:justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </p>

                  {/* Ações */}
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {isEditing ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={handleSaveProfile} 
                          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setIsEditing(false)}
                          className="border-white/20 hover:bg-white/10"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400/50 text-cyan-300"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar Perfil
                      </Button>
                    )}
                    
                    {/* Botão Sair - Estilo Outline (não compete com neon) */}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleLogout}
                      className="border-gray-600 hover:bg-gray-800 hover:text-gray-300 text-gray-400"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ============================================
              DASHBOARD DE ATIVIDADE
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <Activity className="w-5 h-5 text-cyan-400" />
              Dashboard de Atividade
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  icon: Film, 
                  value: isLoadingData ? '...' : watchHistory.length.toString(), 
                  label: 'Filmes Assistidos',
                  gradient: 'from-cyan-500/20 to-blue-500/20',
                  iconColor: 'text-cyan-400'
                },
                { 
                  icon: Clock, 
                  value: isLoadingData ? '...' : Math.floor(watchHistory.length * 1.5) + 'h', 
                  label: 'Horas Assistidas',
                  gradient: 'from-purple-500/20 to-pink-500/20',
                  iconColor: 'text-purple-400'
                },
                { 
                  icon: Star, 
                  value: isLoadingData ? '...' : favorites.length.toString(), 
                  label: 'Favoritos',
                  gradient: 'from-green-500/20 to-emerald-500/20',
                  iconColor: 'text-green-400'
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl p-5 hover:border-cyan-500/30 transition-all duration-300 cursor-default`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                      <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-white/50">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ============================================
              GERENCIAMENTO DE PERFIS
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <Users className="w-5 h-5 text-cyan-400" />
              Perfis da Conta
            </h2>
            
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Perfil atual do usuário */}
                {profile && (
                  <motion.button
                    key={profile.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                    className="group relative"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-shadow duration-300`}>
                      <span className="text-2xl md:text-3xl font-bold text-white">{profile.username?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                    <p className="text-center text-sm text-white/70 mt-2 group-hover:text-cyan-300 transition-colors">{profile.username || 'Usuário'}</p>
                  </motion.button>
                )}
                
                {/* Botão para adicionar novo perfil */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  whileHover={{ scale: 1.1 }}
                  className="group relative"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 border-2 border-dashed border-white/30 flex items-center justify-center shadow-lg group-hover:border-cyan-400/50 transition-all duration-300">
                    <span className="text-2xl md:text-3xl font-bold text-white/50">+</span>
                  </div>
                  <p className="text-center text-sm text-white/50 mt-2 group-hover:text-cyan-300 transition-colors">Adicionar</p>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ============================================
              PERSONALIZAÇÃO DE AVATAR
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <Palette className="w-5 h-5 text-cyan-400" />
                Personalização de Avatar
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAvatarCustomizer(!showAvatarCustomizer)}
                className="border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400/50 text-cyan-300"
              >
                {showAvatarCustomizer ? 'Fechar Editor' : 'Personalizar Avatar'}
              </Button>
            </div>

            {showAvatarCustomizer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <AvatarCustomizer
                  userId={user?.id}
                  profileId={profile?.id}
                  onSave={(customization) => {
                    toast.success('Avatar personalizado com sucesso!');
                    setShowAvatarCustomizer(false);
                  }}
                />
              </motion.div>
            )}
          </motion.div>

          {/* ============================================
              FOTO DE PERFIL
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <Camera className="w-5 h-5 text-cyan-400" />
                Foto de Perfil
              </h2>
            </div>
            
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <ProfilePhotoUploader
                userId={user?.id}
                profileId={profile?.id}
                onPhotoChange={(url) => {
                  toast.success(url ? 'Foto de perfil atualizada!' : 'Foto de perfil removida');
                }}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* ============================================
                DISPOSITIVOS CONECTADOS
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <Monitor className="w-5 h-5 text-cyan-400" />
                Dispositivos Conectados
              </h2>
              
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {devices.map((device) => (
                    <motion.div
                      key={device.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ 
                        opacity: removingDevice === device.id ? 0 : 1, 
                        scale: removingDevice === device.id ? 0.9 : 1,
                        x: removingDevice === device.id ? -100 : 0
                      }}
                      exit={{ opacity: 0, scale: 0.9, x: -100 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                        device.isCurrent 
                          ? 'bg-cyan-500/10 border-cyan-500/30' 
                          : 'bg-white/5 border-white/10 hover:border-cyan-500/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${device.isCurrent ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
                          {getDeviceIcon(device.type)}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm flex items-center gap-2">
                            {device.name}
                            {device.isCurrent && (
                              <span className="text-xs text-cyan-400">(Atual)</span>
                            )}
                          </div>
                          <div className="text-xs text-white/40 flex items-center gap-1">
                            {device.location} • {device.lastActive}
                          </div>
                        </div>
                      </div>
                      
                      {!device.isCurrent && (
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          disabled={removingDevice === device.id}
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 disabled:opacity-50"
                        >
                          {removingDevice === device.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ============================================
                HISTÓRICO FINANCEIRO
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <CreditCard className="w-5 h-5 text-cyan-400" />
                Histórico de Faturas
              </h2>
              
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
                <div className="p-4 bg-white/5 rounded-xl">
                  <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                  <p className="text-white/70 text-sm">Nenhuma fatura encontrada</p>
                  <p className="text-white/40 text-xs mt-1">Suas faturas aparecerão aqui</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* ============================================
                CONTROLE PARENTAL
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <Shield className="w-5 h-5 text-cyan-400" />
                Controle Parental
              </h2>
              
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Lock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">PIN de Acesso</div>
                      <div className="text-xs text-white/40">Requer PIN para perfis infantis</div>
                    </div>
                  </div>
                  <NeonSwitch 
                    checked={pinEnabled} 
                    onCheckedChange={handlePinToggle}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Eye className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">Restrição de Conteúdo</div>
                      <div className="text-xs text-white/40">Filtrar por classificação etária</div>
                    </div>
                  </div>
                  <NeonSwitch 
                    checked={parentalControl} 
                    onCheckedChange={setParentalControl}
                  />
                </div>
              </div>
            </motion.div>

            {/* ============================================
                CONFIGURAÇÕES DE LEGENDA
                ============================================ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <Type className="w-5 h-5 text-cyan-400" />
                Ajustes de Legenda
              </h2>
              
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
                {/* Preview */}
                <SubtitlePreview settings={subtitleSettings} />
                
                {/* Font Size Selector */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Tamanho da Fonte</label>
                  <div className="flex gap-2">
                    {(['small', 'medium', 'large'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSubtitleSettings(prev => ({ ...prev, fontSize: size }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                          subtitleSettings.fontSize === size
                            ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {size === 'small' && 'P'}
                        {size === 'medium' && 'M'}
                        {size === 'large' && 'G'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Cor da Legenda</label>
                  <div className="flex gap-2">
                    {['#FFFFFF', '#FFFF00', '#00FF00', '#00E5FF', '#FF6B6B'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSubtitleSettings(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full transition-all duration-300 ${
                          subtitleSettings.color === color
                            ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Fundo escuro nas legendas</span>
                  <NeonSwitch 
                    checked={subtitleSettings.background} 
                    onCheckedChange={(checked) => setSubtitleSettings(prev => ({ ...prev, background: checked }))}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ============================================
              SEÇÃO DE CONFIGURAÇÕES DA CONTA
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <Settings className="w-5 h-5 text-cyan-400" />
              Configurações da Conta
            </h2>
            
            <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              {[
                { 
                  icon: Heart, 
                  title: 'Meus Favoritos', 
                  description: 'Filmes e séries salvos',
                  link: '/favorites',
                  color: 'text-red-400',
                  bgColor: 'bg-red-500/20'
                },
                { 
                  icon: Star, 
                  title: 'Minhas Avaliações', 
                  description: 'Filmes que você avaliou',
                  link: '/ratings',
                  color: 'text-yellow-400',
                  bgColor: 'bg-yellow-500/20'
                },
                { 
                  icon: Clock, 
                  title: 'Histórico', 
                  description: 'Conteúdos assistidos',
                  link: '/history',
                  color: 'text-blue-400',
                  bgColor: 'bg-blue-500/20'
                },
                { 
                  icon: Bell, 
                  title: 'Notificações', 
                  description: 'Configurar alertas e emails',
                  link: '/notifications',
                  color: 'text-purple-400',
                  bgColor: 'bg-purple-500/20'
                },
                { 
                  icon: HelpCircle, 
                  title: 'Ajuda e Suporte', 
                  description: 'FAQ e contato',
                  link: '/help',
                  color: 'text-green-400',
                  bgColor: 'bg-green-500/20'
                },
              ].map((item, index) => (
                <Link 
                  key={item.title}
                  to={item.link}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-cyan-500/10 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <div>
                        <div className="font-medium text-white group-hover:text-cyan-300 transition-colors">{item.title}</div>
                        <div className="text-sm text-white/40">{item.description}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-300" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* ============================================
              ÁREA ADMINISTRATIVA
              ============================================ */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                <ShieldAlert className="w-5 h-5 text-red-400" />
                Área Administrativa
              </h2>
              
              <Link to="/admin" className="block">
                <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-5 flex items-center justify-between hover:bg-red-500/20 transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500/30 rounded-xl">
                      <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-lg">Painel Admin</div>
                      <div className="text-sm text-red-300">Gerenciar conteúdo e usuários</div>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-red-400 group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </Link>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
