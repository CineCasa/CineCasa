import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Play, Tv, Clock, Trophy, Edit3, ChevronRight, Heart,
  MonitorPlay, Star, Crown, Settings, Bell, Shield, LogOut,
  TrendingUp, Zap, Award
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const neonCyan = '#00d4ff';
const darkBg = '#000000';
const cardBg = '#0a0a0f';

interface RealStats {
  moviesWatched: number;
  seriesWatched: number;
  totalMinutes: number;
  favoritesCount: number;
  plan: string;
  points: number;
  displayName: string;
  avatarUrl: string | null;
  memberSince: string;
  watchStreak: number;
  totalXp: number;
}

interface MonthlyActivity {
  month: string;
  hours: number;
}

const NeonCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-[#0a0a0f] rounded-[12px] border border-white/5 overflow-hidden ${className}`}
    style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.4)' }}
  >
    {children}
  </motion.div>
);

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<RealStats>({
    moviesWatched: 0,
    seriesWatched: 0,
    totalMinutes: 0,
    favoritesCount: 0,
    plan: 'free',
    points: 0,
    displayName: '',
    avatarUrl: null,
    memberSince: '',
    watchStreak: 0,
    totalXp: 0,
  });
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const [recentWatched, setRecentWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadProfileData();
  }, [user?.id]);

  const loadProfileData = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Buscar tudo em paralelo
      const [
        profileRes,
        xpRes,
        streakRes,
        progressRes,
        favRes,
      ] = await Promise.all([
        // user_profiles: name, avatar_url, plan, points
        supabase
          .from('user_profiles')
          .select('name, avatar_url, plan, points')
          .eq('user_id', user.id)
          .maybeSingle(),

        // user_xp: total_xp, xp_watching
        supabase
          .from('user_xp')
          .select('total_xp, xp_watching, xp_rating')
          .eq('user_id', user.id)
          .maybeSingle(),

        // user_streaks: watch_streak_days
        supabase
          .from('user_streaks')
          .select('watch_streak_days, watch_streak_max')
          .eq('user_id', user.id)
          .maybeSingle(),

        // user_progress: contar filmes/séries assistidos e total de minutos
        supabase
          .from('user_progress')
          .select('content_id, content_type, progress, duration, updated_at, title')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),

        // favorites: contar
        supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      const profileData = profileRes.data;
      const xpData = xpRes.data;
      const streakData = streakRes.data;
      const progressData = progressRes.data || [];
      const favCount = favRes.count || 0;

      // Calcular stats de progresso
      const movies = progressData.filter(p => p.content_type === 'movie' && p.progress >= 80);
      const series = progressData.filter(p => p.content_type === 'series' && p.progress >= 80);
      const totalMinutes = progressData.reduce((acc, p) => {
        const dur = p.duration || 0;
        const prog = Math.min(p.progress || 0, 100) / 100;
        return acc + Math.round((dur / 60) * prog);
      }, 0);

      // Atividade mensal a partir do user_progress
      const monthMap: Record<string, number> = {};
      const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      progressData.forEach(p => {
        if (!p.updated_at) return;
        const d = new Date(p.updated_at);
        const key = MONTHS[d.getMonth()];
        const dur = (p.duration || 0) / 3600; // horas
        monthMap[key] = (monthMap[key] || 0) + dur;
      });

      // Últimos 6 meses
      const now = new Date();
      const activity: MonthlyActivity[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = MONTHS[d.getMonth()];
        activity.push({ month: label, hours: Math.round(monthMap[label] || 0) });
      }

      // Últimos 4 conteúdos assistidos
      const recent = progressData.slice(0, 4).map(p => ({
        title: p.title || 'Sem título',
        type: p.content_type === 'movie' ? 'Filme' : 'Série',
        progress: p.progress,
        contentId: p.content_id,
        contentType: p.content_type,
      }));

      setStats({
        moviesWatched: movies.length,
        seriesWatched: series.length,
        totalMinutes,
        favoritesCount: favCount,
        plan: profileData?.plan || 'free',
        points: profileData?.points || 0,
        displayName: profileData?.name || user.email?.split('@')[0] || 'Usuário',
        avatarUrl: profileData?.avatar_url || null,
        memberSince: user.created_at
          ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          : '',
        watchStreak: streakData?.watch_streak_days || 0,
        totalXp: xpData?.total_xp || 0,
      });

      setMonthlyActivity(activity);
      setRecentWatched(recent);
    } catch (err) {
      console.error('[Profile] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: <Heart className="w-5 h-5" />, label: 'Meus Favoritos', path: '/favorites' },
    { icon: <MonitorPlay className="w-5 h-5" />, label: 'Ver Depois', path: '/watchlist' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notificações', path: '/notifications' },
    { icon: <Shield className="w-5 h-5" />, label: 'Dispositivos', path: '/devices' },
    { icon: <Crown className="w-5 h-5" style={{ color: neonCyan }} />, label: 'Minha Assinatura', path: '/subscription' },
    { icon: <Settings className="w-5 h-5" />, label: 'Configurações', path: '/settings/notifications' },
  ];

  const formatHours = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    return `${Math.round(minutes / 60)}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ background: darkBg, minHeight: '100vh', color: 'white', paddingBottom: '80px' }}>
      {/* Hero do perfil */}
      <div className="relative pt-16 md:pt-8 pb-8 px-4 md:px-8">
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse at top, ${neonCyan}30 0%, transparent 70%)` }}
        />
        <div className="relative max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 flex items-center justify-center"
              style={{ borderColor: neonCyan, background: '#0a0a0f' }}
            >
              {stats.avatarUrl ? (
                <img src={stats.avatarUrl} alt={stats.displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12" style={{ color: neonCyan }} />
              )}
            </div>
            {stats.plan !== 'free' && (
              <div
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: neonCyan }}
              >
                <Crown className="w-4 h-4 text-black" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold">{stats.displayName}</h1>
              <button
                onClick={() => navigate('/profiles')}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-3">Membro desde {stats.memberSince}</p>
            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <span
                className="text-xs font-bold px-3 py-1 rounded-full uppercase"
                style={{ background: `${neonCyan}20`, color: neonCyan, border: `1px solid ${neonCyan}40` }}
              >
                {stats.plan === 'free' ? 'Plano Gratuito' : `Plano ${stats.plan}`}
              </span>
              {stats.totalXp > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  <Zap className="w-3 h-3 inline mr-1" />{stats.totalXp.toLocaleString()} XP
                </span>
              )}
              {stats.watchStreak > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  🔥 {stats.watchStreak} dias seguidos
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Filmes', value: stats.moviesWatched, icon: <Play className="w-5 h-5" /> },
            { label: 'Séries', value: stats.seriesWatched, icon: <Tv className="w-5 h-5" /> },
            { label: 'Assistido', value: formatHours(stats.totalMinutes), icon: <Clock className="w-5 h-5" /> },
            { label: 'Favoritos', value: stats.favoritesCount, icon: <Heart className="w-5 h-5" /> },
          ].map((s, i) => (
            <NeonCard key={i} className="p-4 text-center">
              <div style={{ color: neonCyan }} className="flex justify-center mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </NeonCard>
          ))}
        </div>

        {/* Atividade mensal */}
        {monthlyActivity.some(m => m.hours > 0) && (
          <NeonCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: neonCyan }} />
              <h3 className="font-semibold text-white">Atividade dos últimos 6 meses</h3>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={monthlyActivity}>
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0a0a0f', border: `1px solid ${neonCyan}40`, borderRadius: 8 }}
                  labelStyle={{ color: 'white' }}
                  formatter={(val: number) => [`${val}h`, 'Horas']}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke={neonCyan}
                  strokeWidth={2}
                  dot={{ fill: neonCyan, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </NeonCard>
        )}

        {/* Assistidos recentemente */}
        {recentWatched.length > 0 && (
          <NeonCard className="p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <MonitorPlay className="w-5 h-5" style={{ color: neonCyan }} />
              Assistidos recentemente
            </h3>
            <div className="space-y-3">
              {recentWatched.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
                  onClick={() => navigate(`/details/${item.contentType === 'movie' ? 'cinema' : 'series'}/${item.contentId}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: neonCyan }}>{item.progress}%</div>
                    <div className="w-16 h-1 bg-gray-700 rounded-full mt-1">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${item.progress}%`, background: neonCyan }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>
        )}

        {/* Menu */}
        <NeonCard>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
            >
              <span className="text-gray-400">{item.icon}</span>
              <span className="text-white text-sm font-medium flex-1 text-left">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          ))}
        </NeonCard>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair da conta</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
