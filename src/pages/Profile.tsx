import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Play, Tv, Clock, Trophy, Edit3, ChevronRight, Heart, 
  MonitorPlay, History, Star, Download, Smartphone, Crown, 
  Settings, Bell, Shield, FileText, LogOut, Crown as CrownIcon,
  CheckCircle2, TrendingUp, Zap, Target, Award
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// ============================================
// PREMIUM PROFILE - CENTRAL DE COMANDO
// Neon Cyan Design System
// ============================================

const neonCyan = '#00d4ff';
const neonBlue = '#0099ff';
const darkBg = '#000000';
const cardBg = '#0a0a0f';

// Mock Data
const mockStats = {
  moviesWatched: 128,
  seriesWatched: 34,
  totalHours: 512,
  achievements: 27,
  level: 12,
  isPremium: true,
  memberSince: 'Maio de 2024'
};

const mockMonthlyActivity = [
  { month: 'Jan', hours: 45 },
  { month: 'Fev', hours: 52 },
  { month: 'Mar', hours: 48 },
  { month: 'Abr', hours: 65 },
  { month: 'Mai', hours: 58 },
  { month: 'Jun', hours: 72 },
  { month: 'Jul', hours: 82 },
];

const recentActivity = [
  { title: 'Duna: Parte 2', type: 'Filme', progress: 95, image: 'https://image.tmdb.org/t/p/w200/1pdfLvkbY9wzJlB0WK8jnKBh8RJ.jpg' },
  { title: 'The Last of Us', type: 'Série • T1:E6', progress: 90, image: 'https://image.tmdb.org/t/p/w200/uKvVjHNqB5V8lFYJ5QC7Nuo7yAg.jpg' },
  { title: 'Oppenheimer', type: 'Filme', progress: 85, image: 'https://image.tmdb.org/t/p/w200/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg' },
  { title: 'Stranger Things', type: 'Série • T4:E8', progress: 100, image: 'https://image.tmdb.org/t/p/w200/49WJfeN0moxb9IPfGn8AI0AMj6A.jpg' },
];

const achievements = [
  { icon: <Trophy className="w-6 h-6" />, title: 'Maratonista', desc: '10 séries completas' },
  { icon: <Target className="w-6 h-6" />, title: 'Explorador', desc: '50 gêneros diferentes' },
  { icon: <Star className="w-6 h-6" />, title: 'Crítico', desc: '100 avaliações' },
  { icon: <Award className="w-6 h-6" />, title: 'Veterano', desc: '1 ano de plataforma' },
];

// ============================================
// NEON CARD COMPONENT
// ============================================
const NeonCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-[#0a0a0f] rounded-[12px] border border-white/5 overflow-hidden ${className}`}
    style={{
      boxShadow: '0 0 20px rgba(0, 212, 255, 0.05), 0 4px 20px rgba(0, 0, 0, 0.4)'
    }}
  >
    {children}
  </motion.div>
);

// ============================================
// NEON BUTTON COMPONENT
// ============================================
const NeonButton = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger'; 
  onClick?: () => void;
  className?: string;
}) => {
  const baseStyles = 'px-4 py-2 rounded-[10px] font-medium transition-all duration-300 flex items-center gap-2';
  
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)]',
    secondary: 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white',
    danger: 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
  };
  
  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

// ============================================
// SIDEBAR COMPONENT
// ============================================
const Sidebar = ({ activeItem = 'Perfil' }: { activeItem?: string }) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: <Play className="w-5 h-5" />, label: 'Início', path: '/' },
    { icon: <User className="w-5 h-5" />, label: 'Filmes', path: '/movies' },
    { icon: <Tv className="w-5 h-5" />, label: 'Séries', path: '/series' },
    { icon: <Zap className="w-5 h-5" />, label: 'Explorar', path: '/explore' },
    { icon: <Heart className="w-5 h-5" />, label: 'Minha Lista', path: '/watchlist' },
    { icon: <History className="w-5 h-5" />, label: 'Assistidos', path: '/history' },
    { icon: <Star className="w-5 h-5" />, label: 'Favoritos', path: '/favorites' },
  ];
  
  const accountItems = [
    { icon: <User className="w-5 h-5" />, label: 'Perfil', path: '/profile' },
    { icon: <Crown className="w-5 h-5" />, label: 'Assinatura', path: '/subscription' },
    { icon: <Shield className="w-5 h-5" />, label: 'Segurança', path: '/security' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notificações', path: '/notifications' },
    { icon: <Smartphone className="w-5 h-5" />, label: 'Dispositivos', path: '/devices' },
  ];
  
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-black border-r border-white/5 hidden lg:flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
        <div>
          <h1 className="text-[#E53935] font-bold text-lg tracking-tight">CINECASA</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Entretenimento</p>
        </div>
      </div>
      
      {/* Main Menu */}
      <nav className="flex-1 px-4 py-2">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm ${
                activeItem === item.label
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border-l-2 border-cyan-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        
        {/* Account Section */}
        <div className="mt-8">
          <p className="px-4 text-xs text-gray-500 uppercase tracking-wider mb-2">Conta</p>
          <div className="space-y-1">
            {accountItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm ${
                  activeItem === item.label
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border-l-2 border-cyan-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Premium Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl p-4 border border-cyan-500/30">
          <CrownIcon className="w-8 h-8 text-cyan-400 mb-2" />
          <h3 className="text-[#E53935] font-bold text-sm">CineCasa Premium</h3>
          <p className="text-gray-400 text-xs mt-1">Acesse todo o conteúdo</p>
          <button className="mt-3 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-colors">
            Ver planos
          </button>
        </div>
      </div>
    </aside>
  );
};

// ============================================
// MAIN PROFILE PAGE
// ============================================
export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [bio, setBio] = useState('Apaixonado por cinema, séries e boas histórias. Sempre em busca de algo novo para assistir!');
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-black">
      <Sidebar activeItem="Perfil" />
      
      <main className="lg:ml-64 min-h-screen">
        {/* Top Search Bar */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar filmes, séries, gêneros..."
                  className="w-full pl-4 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 ml-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden border border-cyan-500/50 shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=b6e3f4" 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* HEADER E STATUS DO MEMBRO */}
          <NeonCard className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-cyan-500 shadow-[0_0_30px_rgba(0,212,255,0.4)]">
                  <img 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=b6e3f4" 
                    alt="Lucas Martins" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Edit3 className="w-4 h-4 text-black" />
                </div>
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Lucas Martins</h1>
                  <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-gray-400 text-sm mb-4">Membro desde {mockStats.memberSince}</p>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-400 rounded-full text-sm font-medium flex items-center gap-2">
                    <Crown className="w-4 h-4" /> Premium
                  </span>
                  <span className="px-4 py-1.5 bg-white/5 border border-white/20 text-white rounded-full text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" /> Nível {mockStats.level}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">
                  <Play className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">{mockStats.moviesWatched}</span>
                </div>
                <p className="text-gray-500 text-xs">Filmes assistidos</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">
                  <Tv className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">{mockStats.seriesWatched}</span>
                </div>
                <p className="text-gray-500 text-xs">Séries assistidas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">{mockStats.totalHours}h</span>
                </div>
                <p className="text-gray-500 text-xs">Tempo assistido</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-cyan-400 mb-1">
                  <Trophy className="w-5 h-5" />
                  <span className="text-2xl font-bold text-white">{mockStats.achievements}</span>
                </div>
                <p className="text-gray-500 text-xs">Conquistas</p>
              </div>
            </div>
          </NeonCard>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUNA ESQUERDA - 5 cols */}
            <div className="lg:col-span-5 space-y-6">
              {/* Sobre Você */}
              <NeonCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-white font-semibold">Sobre você</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">Conte um pouco sobre você</p>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-gray-300 text-sm leading-relaxed">{bio}</p>
                </div>
                <button className="mt-4 w-full py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2">
                  <Edit3 className="w-4 h-4" /> Editar perfil
                </button>
              </NeonCard>

              {/* Preferências */}
              <NeonCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-white font-semibold">Preferências</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">Personalize sua experiência</p>
                
                <div className="space-y-3">
                  {[
                    { icon: <Heart className="w-4 h-4" />, label: 'Gêneros favoritos', value: 'Ação, Ficção, Drama, Suspense' },
                    { icon: <MonitorPlay className="w-4 h-4" />, label: 'Qualidade de vídeo', value: 'Automático' },
                    { icon: <FileText className="w-4 h-4" />, label: 'Idioma de áudio', value: 'Português' },
                    { icon: <FileText className="w-4 h-4" />, label: 'Idioma das legendas', value: 'Português' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400">{item.icon}</span>
                        <div>
                          <p className="text-white text-sm">{item.label}</p>
                          <p className="text-gray-500 text-xs">{item.value}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </NeonCard>

              {/* Estatísticas */}
              <NeonCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-white font-semibold">Estatísticas</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">Seu resumo de atividade</p>
                
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockMonthlyActivity}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#00d4ff' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#00d4ff" 
                        strokeWidth={3}
                        dot={{ fill: '#00d4ff', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#00d4ff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <p className="text-3xl font-bold text-white">520h</p>
                    <p className="text-gray-500 text-xs">Este mês</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-400 text-sm font-medium flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +12%
                    </p>
                    <p className="text-gray-500 text-xs">vs mês anterior</p>
                  </div>
                </div>
              </NeonCard>
            </div>

            {/* COLUNA DIREITA - 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar */}
                <NeonCard className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-white font-semibold">Avatar</h2>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">Personalize seu avatar</p>
                  
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                      <img 
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas&backgroundColor=b6e3f4" 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <button className="w-full py-2.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-medium hover:bg-cyan-500/20 transition-colors">
                    Personalizar avatar
                  </button>
                </NeonCard>

                {/* Ações Rápidas */}
                <NeonCard className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-white font-semibold">Ações rápidas</h2>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { icon: <Heart className="w-4 h-4" />, label: 'Minha Lista' },
                      { icon: <History className="w-4 h-4" />, label: 'Histórico' },
                      { icon: <Star className="w-4 h-4" />, label: 'Avaliações' },
                      { icon: <Download className="w-4 h-4" />, label: 'Downloads' },
                      { icon: <Smartphone className="w-4 h-4" />, label: 'Dispositivos conectados' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">{item.icon}</span>
                          <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{item.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </div>
                    ))}
                  </div>
                </NeonCard>
              </div>

              {/* Atividade Recente */}
              <NeonCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-white font-semibold">Atividade recente</h2>
                  </div>
                  <span className="text-gray-500 text-xs">Últimos 7 dias</span>
                </div>
                
                <div className="space-y-3">
                  {recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                      <div className="w-16 h-10 rounded bg-gray-800 overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white text-sm font-medium truncate">{item.title}</h3>
                        <p className="text-gray-500 text-xs">{item.type}</p>
                      </div>
                      <div className="w-20">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="text-cyan-400 text-xs text-right mt-1">{item.progress}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </NeonCard>

              {/* Conquistas */}
              <NeonCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-white font-semibold">Conquistas</h2>
                  </div>
                  <button className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">Ver todas</button>
                </div>
                <p className="text-gray-400 text-sm mb-4">Veja suas conquistas</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {achievements.map((item, i) => (
                    <div key={i} className="text-center p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all group">
                      <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30 text-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-shadow">
                        {item.icon}
                      </div>
                      <h3 className="text-white text-sm font-medium mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </NeonCard>

              {/* Configurações da Conta */}
              <NeonCard className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-white font-semibold">Configurações da conta</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">Gerencie sua conta e segurança</p>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  <NeonButton variant="secondary">
                    <User className="w-4 h-4" /> Dados pessoais
                  </NeonButton>
                  <NeonButton variant="secondary">
                    <Shield className="w-4 h-4" /> Segurança
                  </NeonButton>
                  <NeonButton variant="secondary">
                    <Bell className="w-4 h-4" /> Notificações
                  </NeonButton>
                  <NeonButton variant="secondary">
                    <FileText className="w-4 h-4" /> Privacidade
                  </NeonButton>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <NeonButton variant="danger" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" /> Excluir conta
                  </NeonButton>
                </div>
              </NeonCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
