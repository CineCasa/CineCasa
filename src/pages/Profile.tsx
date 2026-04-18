import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Edit3, Camera, LogOut, Mail, Calendar, Clock, Heart, Star, Settings, 
  ChevronRight, User, Shield, Users, Film, BarChart3, Bell, Lock, HelpCircle, 
  ShieldAlert, Monitor, Smartphone, Globe, X, Check, FileText, CreditCard,
  Type, Palette, Eye, EyeOff, ChevronDown, Plus, Trash2, Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AvatarCustomizer } from '@/components/AvatarCustomizer';

// ============================================
// TYPES & INTERFACES
// ============================================
interface Device {
  id: string;
  name: string;
  type: 'tv' | 'mobile' | 'web';
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

interface SubtitleSettings {
  fontSize: 'small' | 'medium' | 'large';
  color: string;
  background: boolean;
}

interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKid: boolean;
  color: string;
}

// ============================================
// MOCK DATA ( será substituído por Supabase )
// ============================================
const MOCK_DEVICES: Device[] = [
  { id: '1', name: 'Smart TV Samsung', type: 'tv', location: 'São Paulo, BR', lastActive: 'Agora', isCurrent: false },
  { id: '2', name: 'iPhone 15 Pro', type: 'mobile', location: 'São Paulo, BR', lastActive: '2 horas atrás', isCurrent: true },
  { id: '3', name: 'Chrome - Windows', type: 'web', location: 'Rio de Janeiro, BR', lastActive: '3 dias atrás', isCurrent: false },
];

const MOCK_INVOICES: Invoice[] = [
  { id: '1', date: '15 Jan 2025', amount: 'R$ 29,90', status: 'paid', description: 'Plano Premium - Jan/25' },
  { id: '2', date: '15 Dez 2024', amount: 'R$ 29,90', status: 'paid', description: 'Plano Premium - Dez/24' },
  { id: '3', date: '15 Nov 2024', amount: 'R$ 29,90', status: 'paid', description: 'Plano Premium - Nov/24' },
];

const MOCK_PROFILES: Profile[] = [
  { id: '1', name: 'João', avatar: 'J', isKid: false, color: 'from-cyan-500 to-blue-500' },
  { id: '2', name: 'Maria', avatar: 'M', isKid: false, color: 'from-purple-500 to-pink-500' },
  { id: '3', name: 'Pedro', avatar: 'P', isKid: true, color: 'from-green-500 to-emerald-500' },
  { id: '4', name: '+', avatar: '+', isKid: false, color: 'from-gray-600 to-gray-700' },
];

// ============================================
// COMPONENT: NEON SWITCH
// ============================================
const NeonSwitch = ({ checked, onCheckedChange, disabled = false }: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState(checked);

  const handleToggle = async () => {
    if (disabled) return;
    
    const newValue = !checked;
    setIsOptimistic(true);
    setOptimisticValue(newValue);
    
    try {
      await onCheckedChange(newValue);
      toast.success(newValue ? 'Ativado com sucesso!' : 'Desativado com sucesso!');
    } catch (error) {
      setOptimisticValue(checked);
      toast.error('Erro ao atualizar. Tente novamente.');
    } finally {
      setIsOptimistic(false);
    }
  };

  const displayValue = isOptimistic ? optimisticValue : checked;

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || isOptimistic}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
        displayValue 
          ? 'bg-cyan-500 shadow-[0_0_15px_rgba(0,229,255,0.5)]' 
          : 'bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
    >
      <motion.div
        className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
        animate={{ 
          left: displayValue ? 'calc(100% - 1.5rem)' : '0.25rem',
          scale: isOptimistic ? 0.9 : 1
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      {isOptimistic && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        </div>
      )}
    </button>
  );
};

// ============================================
// COMPONENT: SUBTITLE PREVIEW
// ============================================
const SubtitlePreview = ({ settings }: { settings: SubtitleSettings }) => {
  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className="relative w-full h-32 bg-black/60 rounded-lg overflow-hidden border border-white/10">
      {/* Mock Video Frame */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white/30">
          <Film className="w-12 h-12" />
        </div>
      </div>
      
      {/* Subtitle Preview */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4">
        <div 
          className={`${sizeClasses[settings.fontSize]} px-3 py-1 rounded transition-all duration-300 ${
            settings.background ? 'bg-black/70' : ''
          }`}
          style={{ color: settings.color }}
        >
          <span className="font-medium">Preview da legenda</span>
        </div>
      </div>
    </div>
  );
};

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
  const [devices, setDevices] = useState<Device[]>(MOCK_DEVICES);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);
  
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
    // Optimistic removal
    setRemovingDevice(deviceId);
    
    try {
      // Simular API call - será substituído por Supabase
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      toast.success('Sessão encerrada com sucesso!');
    } catch (error) {
      toast.error('Erro ao encerrar sessão');
    } finally {
      setRemovingDevice(null);
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
              DASHBOARD DE ATIVIDADE - 3 Cards Glassmorphism
              ============================================ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Sua Atividade
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { 
                  icon: Film, 
                  value: '124', 
                  label: 'Filmes Assistidos',
                  gradient: 'from-cyan-500/20 to-blue-500/20',
                  iconColor: 'text-cyan-400'
                },
                { 
                  icon: Clock, 
                  value: '47h', 
                  label: 'Horas Assistidas',
                  gradient: 'from-purple-500/20 to-pink-500/20',
                  iconColor: 'text-purple-400'
                },
                { 
                  icon: Star, 
                  value: '4.2', 
                  label: 'Avaliação Média',
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
                {MOCK_PROFILES.map((p, index) => (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    className="group relative"
                  >
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-shadow duration-300 ${p.name === '+' ? 'border-2 border-dashed border-white/30' : ''}`}>
                      <span className="text-2xl md:text-3xl font-bold text-white">{p.avatar}</span>
                    </div>
                    {p.isKid && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-xs">👶</span>
                      </div>
                    )}
                    <p className="text-center text-sm text-white/70 mt-2 group-hover:text-cyan-300 transition-colors">{p.name}</p>
                  </motion.button>
                ))}
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
              
              <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {MOCK_INVOICES.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-lg">
                          <FileText className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{invoice.description}</div>
                          <div className="text-xs text-white/40">{invoice.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{invoice.amount}</span>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                  ))}
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
