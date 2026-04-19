import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Film, Tv, Users, Settings, BarChart3, 
  Plus, Search, Edit2, Trash2, ChevronDown, ChevronRight,
  TrendingUp, Eye, Clock, Star, Download, Upload, Bell,
  Shield, Database, Activity, PieChart, Menu, X, Check,
  AlertTriangle, Filter, MoreVertical, ChevronLeft, LogOut,
  UserCheck, UserX, Crown, Zap, Smartphone, Globe, CreditCard,
  Send, Ban, QrCode, SmartphoneNfc, Lock, FileText, ArrowUpRight,
  RefreshCw, Server, Cloud, Wifi, AlertCircle, Terminal,
  Play, PauseCircle, CheckCircle2, XCircle, Clock3, ChevronRightIcon,
  CrownIcon, ShieldCheck, Wallet, MessageCircle, ExternalLink,
  Trash, Power, Copy, SmartphoneIcon, TvIcon, Monitor, Laptop,
  MapPin, Hash, Loader2, History, BellRing, Radio, Scan,
  Sparkles, TrendingUpIcon, BarChart2, ActivityIcon, ZapIcon,
  MousePointer2, MousePointerClick, Maximize2, Minimize2, GripVertical,
  Battery, BatteryCharging, BatteryFull, BatteryLow, BatteryMedium,
  Signal, SignalHigh, SignalLow, SignalMedium, WifiIcon, WifiOff,
  Share2, Link, Unlink, EyeOff, EyeIcon, Key, KeyRound, Fingerprint,
  ScanFace, BadgeCheck, Award, Medal, Trophy, StarIcon, Flame,
  Target, Crosshair, Focus, ScanLine, Radar, SatelliteDish,
  Antenna, RadioTower, Broadcast, Podcast, Mic, Mic2, Volume2,
  VolumeX, Volume1, Volume, Headphones, Headset, Speaker,
  SpeakerIcon, Cast, Airplay, Chromecast, MonitorPlay, MonitorUp,
  MonitorDown, MonitorX, MonitorCheck, Tablet, TabletIcon,
  Watch, WatchIcon, Glasses, GlassWater, FlameKindling,
  FlameIcon, Thermometer, ThermometerSun, ThermometerSnowflake,
  Droplets, Droplet, CloudRain, CloudSun, Sun, Moon, MoonIcon,
  Sunrise, Sunset, Cloudy, CloudFog, CloudLightning, Wind,
  Tornado, Hurricane, Earthquake, Waves, Mountain, MountainSnow,
  Volcano, Flag, FlagIcon, FlagTriangleRight, FlagTriangleLeft,
  Map, MapPinIcon, Navigation, Compass, CompassIcon, Anchor,
  Ship, Plane, Car, TrainFront, Bus, Truck, Bike, Footprints,
  PersonStanding, Accessibility, Baby, Users2, UserCircle2,
  UserPlus, UserMinus, UserCog, UserXIcon, Group, UsersRound,
  Contact, Contact2, AddressBook, BookUser, IdCard, CreditCardIcon,
  WalletIcon, PiggyBank, Landmark, Banknote, Coins, DollarSign,
  Euro, PoundSterling, JapaneseYen, IndianRupee, RussianRuble,
  FilipinoPeso, Bitcoin, BanknoteIcon, Receipt, ReceiptIcon,
  FileTextIcon, FileCode, FileJson, FileSpreadsheet, FilePieChart,
  FileBarChart, FileBarChart2, FileLineChart, FileAreaChart,
  FileCog, FileLock, FileCheck, FileX, FilePlus, FileMinus,
  FileEdit, FileSearch, FileSignature, FileKey, FileBadge,
  FileQuestion, FileWarning, FileHeart, FileMusic, FileVideo,
  FileImage, FileType, FileType2, FileStack, Files, Folder,
  FolderOpen, FolderClosed, FolderGit, FolderGit2, FolderKanban,
  FolderCog, FolderCheck, FolderX, FolderPlus, FolderMinus,
  FolderEdit, FolderLock, FolderHeart, FolderUp, FolderDown,
  FolderSync, FolderArchive, FolderOutput, FolderInput,
  TreePine, TreeDeciduous, Palmtree, Flower2, Flower, Leaf,
  Sprout, Seedling, Apple, Banana, Cherry, Citrus, Grape, Lemon,
  Orange, Pear, Strawberry, Raspberry, Blueberry, Blackberry,
  CherryIcon, Peach, Pineapple, Watermelon, Melon, Coconut,
  Avocado, Carrot, Corn, Egg, Milk, Coffee, CoffeeIcon, CupSoda,
  Beer, Wine, WineIcon, Martini, Cocktail, Utensils, UtensilsCrossed,
  ChefHat, CookingPot, Soup, Salad, Sandwich, Pizza, Burger,
  Croissant, Cookie, Candy, IceCream, IceCream2, Lollipop,
  Donut, Cupcake, Cake, CakeSlice, Cherry2, Almond, Peanut,
  Popcorn, SandwichIcon, Wrap, Taco, Burrito, Sushi, Noodles,
  Rice, EggFried, EggIcon, Bacon, Beef, Drumstick, Fish,
  FishIcon, Shell, Shrimp, Squid, Octopus, Crab, Lobster,
  Snail, Turtle, Rabbit, Cat, Dog, Bird, BirdIcon, FishSymbol,
  Rat, Mouse, Hamster, Bug, BugIcon, Worm, Spider, Turtle2,
  FishOff, Rabbit2, Dog2, Cat2, Horse, HorseIcon, Cow, Pig,
  Sheep, Chicken, BeefIcon, Vegan, LeafyGreen, Wheat, Salad2,
  Cherry3, Grape2, Citrus2, Lemon2, Apple2, Carrot2, Nut,
  Bean, BeanOff, VeganIcon, MilkOff, WheatOff, Cigarette,
  CigaretteOff, CandyOff, Candy2, Cookie2, Croissant2,
  Mail,
  Pizza2, Burger2, Soup2, Salad3, Sandwich2, Taco2, Sushi2,
  Noodles2, Rice2, Egg2, Bacon2, Beef2, Drumstick2, Fish2,
  Shell2, Shrimp2, Squid2, Octopus2, Crab2, Lobster2,
  Snail2, Turtle3, Rabbit3, Dog3, Cat3, Horse2, Cow2, Pig2,
  Sheep2, Chicken2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// ============================================
// TYPES & INTERFACES - CineCasa Command Center
// ============================================

type AdminTab = 'dashboard' | 'security' | 'catalog' | 'finance' | 'analytics' | 'logs' | 'system';

interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  device_type: 'mobile' | 'tv' | 'web' | 'tablet';
  device_name: string;
  ip_address: string;
  location?: string;
  last_active: string;
  created_at: string;
  is_active: boolean;
}

interface PendingUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at: string;
  device_id?: string;
  ip_address?: string;
  email_confirmed: boolean;
}

interface CatalogAlert {
  id: string;
  type: 'missing_season' | 'new_release' | 'collection_incomplete' | 'link_broken';
  title: string;
  poster?: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
  detected_at: string;
  status: 'pending' | 'processing' | 'resolved';
  tmdb_id?: string;
  series_id?: string;
  season_number?: number;
  estimated_date?: string;
}

interface FinancialUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'basic' | 'premium' | 'family';
  status: 'active' | 'pending' | 'blocked' | 'cancelled';
  amount: number;
  due_date?: string;
  last_payment?: string;
  phone?: string;
  pix_qr_code?: string;
  pix_copy_paste?: string;
}

interface AuditLog {
  id: string;
  action: string;
  user_id?: string;
  user_name?: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_at: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  last_check: string;
  error?: string;
}

interface AnalyticsData {
  usageTime: { hour: string; minutes: number }[];
  topContent: { name: string; views: number; type: string }[];
  userGrowth: { date: string; users: number }[];
  deviceDistribution: { name: string; value: number }[];
}

// ============================================
// MOCK DATA - Substituição futura por Supabase
// ============================================

const MOCK_SESSIONS: UserSession[] = [
  { id: '1', user_id: 'user1', device_id: 'tv_lg_123', device_type: 'tv', device_name: 'Smart TV LG', ip_address: '192.168.1.45', location: 'São Paulo, SP', last_active: new Date().toISOString(), created_at: new Date(Date.now() - 86400000).toISOString(), is_active: true },
  { id: '2', user_id: 'user2', device_id: 'iphone_456', device_type: 'mobile', device_name: 'iPhone 14 Pro', ip_address: '189.45.67.89', location: 'Rio de Janeiro, RJ', last_active: new Date(Date.now() - 300000).toISOString(), created_at: new Date(Date.now() - 172800000).toISOString(), is_active: true },
  { id: '3', user_id: 'user3', device_id: 'chrome_web', device_type: 'web', device_name: 'Chrome Windows', ip_address: '201.98.76.54', location: 'Belo Horizonte, MG', last_active: new Date(Date.now() - 600000).toISOString(), created_at: new Date(Date.now() - 259200000).toISOString(), is_active: true },
];

const MOCK_PENDING_USERS: PendingUser[] = [
  { id: 'p1', email: 'maria.silva@email.com', name: 'Maria Silva', created_at: new Date(Date.now() - 3600000).toISOString(), email_confirmed: true, ip_address: '201.45.67.89' },
  { id: 'p2', email: 'joao.pedro@email.com', name: 'João Pedro', created_at: new Date(Date.now() - 7200000).toISOString(), email_confirmed: false, ip_address: '189.98.76.54' },
  { id: 'p3', email: 'ana.clara@email.com', name: 'Ana Clara', created_at: new Date(Date.now() - 10800000).toISOString(), email_confirmed: true, ip_address: '177.34.56.78' },
];

const MOCK_CATALOG_ALERTS: CatalogAlert[] = [
  { id: 'a1', type: 'missing_season', title: 'Rede de Intrigas', poster: 'https://image.tmdb.org/t/p/w200/1', details: 'Temporada 5 ausente (T5 Q3 2026)', severity: 'medium', detected_at: new Date().toISOString(), status: 'pending', season_number: 5, estimated_date: '2026-07-01' },
  { id: 'a2', type: 'missing_season', title: 'Rede de Intrigas', poster: 'https://image.tmdb.org/t/p/w200/1', details: 'Temporada 6 ausente (T6 Q4 2026)', severity: 'medium', detected_at: new Date().toISOString(), status: 'pending', season_number: 6, estimated_date: '2026-10-01' },
  { id: 'a3', type: 'collection_incomplete', title: 'Coleção Marvel', poster: 'https://image.tmdb.org/t/p/w200/1', details: 'Faltam: Endgame, Eternals', severity: 'high', detected_at: new Date(Date.now() - 86400000).toISOString(), status: 'pending' },
  { id: 'a4', type: 'new_release', title: 'Deadpool 3', poster: 'https://image.tmdb.org/t/p/w200/1', details: 'Novo lançamento detectado no TMDB', severity: 'low', detected_at: new Date().toISOString(), status: 'pending' },
];

const MOCK_FINANCIAL_USERS: FinancialUser[] = [
  { id: 'f1', name: 'Marcos Lima', email: 'marcos.lima@email.com', plan: 'premium', status: 'pending', amount: 29.90, due_date: '2026-04-20', phone: '5511999999999' },
  { id: 'f2', name: 'Julia Santos', email: 'julia@email.com', plan: 'family', status: 'active', amount: 49.90, last_payment: '2026-04-15', phone: '5511888888888' },
  { id: 'f3', name: 'Pedro Costa', email: 'pedro@email.com', plan: 'basic', status: 'blocked', amount: 19.90, due_date: '2026-04-10', phone: '5511777777777' },
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'l1', action: 'USER_LOGIN_BLOCKED', user_name: 'Carlos Silva', details: 'Tentativa de login duplo detectada e bloqueada', severity: 'warning', created_at: new Date(Date.now() - 300000).toISOString(), ip_address: '201.45.67.89' },
  { id: 'l2', action: 'SEASON_DETECTED', details: 'Nova temporada de "Rede de Intrigas" detectada no TMDB', severity: 'info', created_at: new Date(Date.now() - 900000).toISOString() },
  { id: 'l3', action: 'PAYMENT_RECEIVED', user_name: 'Marcos Lima', details: 'Pagamento de R$ 29,90 confirmado via Pix', severity: 'info', created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: 'l4', action: 'USER_APPROVED', user_name: 'Ana Clara', details: 'Usuário aprovado pelo administrador', severity: 'info', created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: 'l5', action: 'API_ERROR', details: 'Erro na API do TMDB - Timeout após 30s', severity: 'error', created_at: new Date(Date.now() - 3600000).toISOString() },
];

const MOCK_HEALTH_STATUS: HealthStatus[] = [
  { service: 'Vercel (Frontend)', status: 'healthy', latency: 45, uptime: 99.98, last_check: new Date().toISOString() },
  { service: 'Supabase DB', status: 'healthy', latency: 89, uptime: 99.95, last_check: new Date().toISOString() },
  { service: 'Cloudflare Cache', status: 'healthy', latency: 23, uptime: 100, last_check: new Date().toISOString() },
  { service: 'TMDB API', status: 'degraded', latency: 2345, uptime: 98.5, last_check: new Date().toISOString(), error: 'Latência elevada' },
];

const MOCK_ANALYTICS: AnalyticsData = {
  usageTime: [
    { hour: '00h', minutes: 120 }, { hour: '03h', minutes: 45 }, { hour: '06h', minutes: 30 },
    { hour: '09h', minutes: 85 }, { hour: '12h', minutes: 200 }, { hour: '15h', minutes: 340 },
    { hour: '18h', minutes: 520 }, { hour: '21h', minutes: 680 },
  ],
  topContent: [
    { name: 'Rede de Intrigas', views: 1247, type: 'series' },
    { name: 'Coleção Marvel', views: 892, type: 'collection' },
    { name: 'Avengers Endgame', views: 756, type: 'movie' },
    { name: 'Stranger Things', views: 634, type: 'series' },
    { name: 'The Witcher', views: 521, type: 'series' },
  ],
  userGrowth: [
    { date: '01/04', users: 120 }, { date: '05/04', users: 135 }, { date: '10/04', users: 142 },
    { date: '15/04', users: 158 }, { date: '20/04', users: 167 },
  ],
  deviceDistribution: [
    { name: 'TV', value: 45 }, { name: 'Mobile', value: 35 }, { name: 'Web', value: 20 },
  ],
};

const COLORS = ['#00E5FF', '#00B8D4', '#0091EA', '#2962FF', '#2979FF'];

// ============================================
// HELPER COMPONENTS
// ============================================

const NeonBadge = ({ children, color = 'cyan', animate = false }: { children: React.ReactNode; color?: 'cyan' | 'green' | 'red' | 'yellow'; animate?: boolean }) => {
  const colorClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  };
  
  return (
    <motion.span 
      animate={animate ? { boxShadow: ['0 0 0px rgba(0,229,255,0)', '0 0 10px rgba(0,229,255,0.5)', '0 0 0px rgba(0,229,255,0)'] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[color]} backdrop-blur-sm`}
    >
      {children}
    </motion.span>
  );
};

const GlassCard = ({ children, className = '', glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) => (
  <motion.div
    whileHover={glow ? { boxShadow: '0 0 30px rgba(0,229,255,0.15)' } : {}}
    className={`bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden ${glow ? 'hover:border-cyan-500/30' : ''} transition-all duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

const ActionButton = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  icon: Icon, 
  loading = false,
  className = ''
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  className?: string;
}) => {
  const variants = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    success: 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30',
    ghost: 'hover:bg-white/10 text-gray-400 hover:text-white',
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${variants[variant]} ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </motion.button>
  );
};

const StatusIndicator = ({ status }: { status: 'healthy' | 'degraded' | 'down' | 'active' | 'pending' | 'blocked' }) => {
  const colors = {
    healthy: 'bg-green-500',
    active: 'bg-green-500',
    degraded: 'bg-yellow-500',
    pending: 'bg-yellow-500',
    down: 'bg-red-500',
    blocked: 'bg-red-500',
  };
  
  return (
    <motion.span
      animate={{ opacity: [1, 0.5, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`w-2 h-2 rounded-full ${colors[status]}`}
    />
  );
};

// ============================================
// MAIN ADMIN COMPONENT - CineCasa Command
// ============================================

export default function Admin() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data States
  const [sessions, setSessions] = useState<UserSession[]>(MOCK_SESSIONS);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>(MOCK_PENDING_USERS);
  const [catalogAlerts, setCatalogAlerts] = useState<CatalogAlert[]>(MOCK_CATALOG_ALERTS);
  const [financialUsers, setFinancialUsers] = useState<FinancialUser[]>(MOCK_FINANCIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [healthStatus, setHealthStatus] = useState<HealthStatus[]>(MOCK_HEALTH_STATUS);
  const [analytics] = useState<AnalyticsData>(MOCK_ANALYTICS);
  
  // UI States
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<FinancialUser | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(3);
  
  // Add User Modal States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'basic' as const,
    amount: 19.90,
    due_date: ''
  });
  
  // Real-time subscription simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAlerts(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleApproveUser = async (userId: string) => {
    setLoading(`approve-${userId}`);
    // Optimistic UI
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    
    setTimeout(() => {
      toast({ title: 'Usuário aprovado', description: 'Acesso liberado com sucesso.' });
      setLoading(null);
    }, 800);
  };
  
  const handleRejectUser = async (userId: string) => {
    setLoading(`reject-${userId}`);
    setPendingUsers(prev => prev.filter(u => u.id !== userId));
    
    setTimeout(() => {
      toast({ title: 'Usuário rejeitado', description: 'Cadastro removido do sistema.' });
      setLoading(null);
    }, 600);
  };
  
  const handleTerminateSession = async (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast({ title: 'Sessão encerrada', description: 'Dispositivo desconectado.' });
  };
  
  const handleSendPix = async (user: FinancialUser) => {
    setSelectedUser(user);
    setShowPixModal(true);
  };
  
  const handleBlockUser = async (userId: string) => {
    setFinancialUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'blocked' } : u));
    toast({ title: 'Usuário bloqueado', description: 'Status alterado para bloqueado.' });
  };
  
  const handleDeleteUser = async (userId: string) => {
    setFinancialUsers(prev => prev.filter(u => u.id !== userId));
    toast({ title: 'Usuário excluído', description: 'Removido permanentemente.' });
  };
  
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({ title: 'Erro', description: 'Nome e email são obrigatórios.' });
      return;
    }
    
    setLoading('create-user');
    
    const userId = 'u' + Date.now();
    const createdUser: FinancialUser = {
      id: userId,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      plan: newUser.plan,
      status: 'active',
      amount: newUser.amount,
      due_date: newUser.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    setFinancialUsers(prev => [...prev, createdUser]);
    
    toast({ 
      title: 'Usuário criado!', 
      description: `${newUser.name} foi adicionado com sucesso.` 
    });
    
    setNewUser({
      name: '',
      email: '',
      phone: '',
      plan: 'basic',
      amount: 19.90,
      due_date: ''
    });
    setShowAddUserModal(false);
    setLoading(null);
  };
  
  const handleResolveAlert = async (alertId: string) => {
    setCatalogAlerts(prev => prev.filter(a => a.id !== alertId));
    toast({ title: 'Alerta resolvido', description: 'Removido da lista de pendentes.' });
  };
  
  const handleSendPWA = async (phone: string) => {
    toast({ 
      title: 'PWA Enviado!', 
      description: `Instruções enviadas para ${phone}` 
    });
  };

  // ============================================
  // RENDER SECTIONS
  // ============================================
  
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Usuários Ativos', value: '167', trend: '+12%', icon: Users },
          { label: 'Sessões Online', value: sessions.length.toString(), trend: '+3', icon: ActivityIcon },
          { label: 'Alertas Pendentes', value: activeAlerts.toString(), trend: '-2', icon: AlertTriangle, warning: activeAlerts > 0 },
          { label: 'Receita Mensal', value: 'R$ 4.890', trend: '+8%', icon: DollarSign },
        ].map((stat, i) => (
          <GlassCard key={i} glow className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.warning ? 'text-yellow-400' : 'text-white'}`}>{stat.value}</p>
                <span className={`text-xs ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stat.trend}</span>
              </div>
              <stat.icon className="w-8 h-8 text-cyan-500/50" />
            </div>
          </GlassCard>
        ))}
      </div>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Status */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <ActivityIcon className="w-5 h-5 text-cyan-500" />
              Health Check
            </h3>
            <NeonBadge color="green">Sistema OK</NeonBadge>
          </div>
          <div className="space-y-3">
            {healthStatus.map((service) => (
              <div key={service.service} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <StatusIndicator status={service.status} />
                  <span className="text-sm">{service.service}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{service.latency}ms</p>
                  {service.error && <p className="text-xs text-red-400">{service.error}</p>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
        
        {/* Quick Actions */}
        <GlassCard className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-cyan-500" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <ActionButton onClick={() => setActiveTab('security')} variant="secondary" icon={ShieldCheck}>
              Aprovações ({pendingUsers.length})
            </ActionButton>
            <ActionButton onClick={() => setActiveTab('catalog')} variant="secondary" icon={Scan}>
              Scan Catálogo
            </ActionButton>
            <ActionButton onClick={() => setActiveTab('finance')} variant="secondary" icon={Send}>
              Cobranças
            </ActionButton>
            <ActionButton onClick={() => setActiveTab('logs')} variant="secondary" icon={History}>
              Ver Logs
            </ActionButton>
          </div>
        </GlassCard>
      </div>
      
      {/* Recent Audit Logs */}
      <GlassCard className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-500" />
          Logs Recentes
        </h3>
        <div className="space-y-2">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg text-sm">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  log.severity === 'critical' ? 'bg-red-500' :
                  log.severity === 'error' ? 'bg-red-400' :
                  log.severity === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                }`} />
                <span className="font-medium">{log.action}</span>
                <span className="text-gray-400">{log.details}</span>
              </div>
              <span className="text-gray-500 text-xs">{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0d1117] to-[#0a0a0a] text-white">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm">CineCasa Command</h1>
            <p className="text-xs text-gray-400">Admin Center</p>
          </div>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/10 rounded-lg">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      
      {/* Sidebar Navigation */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-black/80 backdrop-blur-xl border-r border-white/10 lg:bg-transparent lg:border-0`}
          >
            <div className="p-6 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg">CineCasa</h1>
                  <p className="text-xs text-cyan-400">Command Center</p>
                </div>
              </div>
            </div>
            
            <nav className="p-4 space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'security', label: 'Segurança', icon: ShieldCheck, badge: pendingUsers.length },
                { id: 'catalog', label: 'Catálogo', icon: Film, badge: catalogAlerts.length },
                { id: 'finance', label: 'Financeiro', icon: DollarSign },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'logs', label: 'Audit Logs', icon: History },
                { id: 'system', label: 'Sistema', icon: Server },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as AdminTab); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'hover:bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-cyan-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <button 
                onClick={() => { supabase.auth.signOut(); navigate('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">
                {activeTab === 'dashboard' && 'Painel de Controle'}
                {activeTab === 'security' && 'Gestão de Segurança'}
                {activeTab === 'catalog' && 'Inteligência de Catálogo'}
                {activeTab === 'finance' && 'Operações Financeiras'}
                {activeTab === 'analytics' && 'Analytics & Dados'}
                {activeTab === 'logs' && 'Audit Logs'}
                {activeTab === 'system' && 'Configurações do Sistema'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {activeAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>
          
          {/* Content */}
          {activeTab === 'dashboard' && renderDashboard()}
          
          {activeTab === 'security' && (
            <div className="space-y-6">
              <GlassCard className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-500" />
                  Aguardando Liberação ({pendingUsers.length})
                </h3>
                <div className="space-y-3">
                  {pendingUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <span className="font-bold text-sm">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          <p className="text-xs text-gray-500">IP: {user.ip_address}</p>
                        </div>
                        {!user.email_confirmed && (
                          <NeonBadge color="yellow">Email não confirmado</NeonBadge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <ActionButton 
                          onClick={() => handleApproveUser(user.id)} 
                          variant="success" 
                          icon={Check}
                          loading={loading === `approve-${user.id}`}
                        >
                          Aprovar
                        </ActionButton>
                        <ActionButton 
                          onClick={() => handleRejectUser(user.id)} 
                          variant="danger" 
                          icon={X}
                          loading={loading === `reject-${user.id}`}
                        >
                          Rejeitar
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
              
              <GlassCard className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <SmartphoneIcon className="w-5 h-5 text-cyan-500" />
                  Sessões Ativas ({sessions.length})
                </h3>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        {session.device_type === 'tv' && <TvIcon className="w-8 h-8 text-cyan-500/50" />}
                        {session.device_type === 'mobile' && <SmartphoneIcon className="w-8 h-8 text-cyan-500/50" />}
                        {session.device_type === 'web' && <Monitor className="w-8 h-8 text-cyan-500/50" />}
                        <div>
                          <p className="font-medium">{session.device_name}</p>
                          <p className="text-sm text-gray-400">{session.location} • {session.ip_address}</p>
                          <p className="text-xs text-gray-500">Último acesso: {new Date(session.last_active).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <ActionButton onClick={() => handleTerminateSession(session.id)} variant="danger" icon={Power}>
                        Encerrar
                      </ActionButton>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
          
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <ActionButton onClick={() => {}} icon={Scan}>
                  Executar Auto-Scan
                </ActionButton>
                <ActionButton onClick={() => {}} variant="secondary" icon={RefreshCw}>
                  Sincronizar TMDB
                </ActionButton>
              </div>
              
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Aba "Faltando" ({catalogAlerts.length})
                  </h3>
                  <div className="flex gap-2">
                    <NeonBadge color="red">{catalogAlerts.filter(a => a.severity === 'high').length} Crítico</NeonBadge>
                    <NeonBadge color="yellow">{catalogAlerts.filter(a => a.severity === 'medium').length} Médio</NeonBadge>
                  </div>
                </div>
                <div className="space-y-3">
                  {catalogAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
                          <Film className="w-8 h-8 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{alert.title}</p>
                            <NeonBadge color={alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'cyan'}>
                              {alert.type === 'missing_season' ? 'T' + alert.season_number : alert.type}
                            </NeonBadge>
                          </div>
                          <p className="text-sm text-gray-400">{alert.details}</p>
                          {alert.estimated_date && (
                            <p className="text-xs text-cyan-400">Lançamento estimado: {alert.estimated_date}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <ActionButton onClick={() => {}} variant="secondary" icon={Search}>
                          Buscar
                        </ActionButton>
                        <ActionButton onClick={() => handleResolveAlert(alert.id)} variant="success" icon={Check}>
                          OK
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
          
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4 text-center">
                  <p className="text-gray-400 text-sm">Receita do Mês</p>
                  <p className="text-3xl font-bold text-cyan-400 mt-2">R$ 4.890,00</p>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <p className="text-gray-400 text-sm">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-400 mt-2">{financialUsers.filter(u => u.status === 'pending').length}</p>
                </GlassCard>
                <GlassCard className="p-4 text-center">
                  <p className="text-gray-400 text-sm">Inadimplentes</p>
                  <p className="text-3xl font-bold text-red-400 mt-2">{financialUsers.filter(u => u.status === 'blocked').length}</p>
                </GlassCard>
              </div>
              
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Gestão de Usuários</h3>
                  <ActionButton onClick={() => setShowAddUserModal(true)} variant="success" icon={Plus}>
                    Novo Usuário
                  </ActionButton>
                </div>
                <div className="space-y-3">
                  {financialUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          <span className="font-bold text-sm">{user.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.plan} • R$ {user.amount.toFixed(2)}</p>
                          {user.due_date && <p className="text-xs text-yellow-400">Vence: {user.due_date}</p>}
                        </div>
                        <NeonBadge color={user.status === 'active' ? 'green' : user.status === 'pending' ? 'yellow' : 'red'}>
                          {user.status}
                        </NeonBadge>
                      </div>
                      <div className="flex gap-2">
                        <ActionButton onClick={() => handleSendPix(user)} variant="primary" icon={Send}>
                          Cobrar
                        </ActionButton>
                        <ActionButton onClick={() => handleBlockUser(user.id)} variant="danger" icon={Ban}>
                          Bloquear
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-4">
                  <h3 className="font-semibold mb-4">Tempo de Uso (24h)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.usageTime}>
                        <defs>
                          <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="hour" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="minutes" stroke="#00E5FF" fillOpacity={1} fill="url(#colorMinutes)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-4">
                  <h3 className="font-semibold mb-4">Top Conteúdos</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topContent} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis type="number" stroke="#666" />
                        <YAxis dataKey="name" type="category" stroke="#666" width={100} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="views" fill="#00E5FF" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-4">
                  <h3 className="font-semibold mb-4">Crescimento de Usuários</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#666" />
                        <YAxis stroke="#666" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="users" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
                
                <GlassCard className="p-4">
                  <h3 className="font-semibold mb-4">Dispositivos</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.deviceDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics.deviceDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
          
          {activeTab === 'logs' && (
            <GlassCard className="p-4">
              <h3 className="font-semibold mb-4">Audit Logs Completos</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg text-sm">
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${
                      log.severity === 'critical' ? 'bg-red-500' :
                      log.severity === 'error' ? 'bg-red-400' :
                      log.severity === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-cyan-400">{log.action}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-300 mt-1">{log.details}</p>
                      {log.user_name && <p className="text-xs text-gray-500">Usuário: {log.user_name}</p>}
                      {log.ip_address && <p className="text-xs text-gray-500">IP: {log.ip_address}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
          
          {activeTab === 'system' && (
            <div className="space-y-6">
              <GlassCard className="p-4">
                <h3 className="font-semibold mb-4">Configurações do Sistema</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Notificações Push', desc: 'Alertas em tempo real', enabled: true },
                    { label: 'Auto-Scan (7 dias)', desc: 'Verificação automática de catálogo', enabled: true },
                    { label: 'Bloqueio Multi-Acesso', desc: 'Prevenir login simultâneo', enabled: true },
                    { label: 'Whitelisting', desc: 'Apenas usuários autorizados', enabled: true },
                    { label: 'Cache Cloudflare', desc: 'Cache inteligente por título', enabled: false },
                  ].map((setting, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <p className="font-medium">{setting.label}</p>
                        <p className="text-sm text-gray-400">{setting.desc}</p>
                      </div>
                      <button 
                        className={`w-12 h-6 rounded-full transition-colors ${setting.enabled ? 'bg-cyan-500' : 'bg-gray-600'}`}
                      >
                        <motion.div 
                          className="w-5 h-5 bg-white rounded-full mx-0.5"
                          animate={{ x: setting.enabled ? 24 : 0 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
              
              <GlassCard className="p-4">
                <h3 className="font-semibold mb-4">Integrações</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Supabase', status: 'Conectado', icon: Database },
                    { name: 'TMDB API', status: healthStatus.find(h => h.service.includes('TMDB'))?.status === 'healthy' ? 'Conectado' : 'Degradado', icon: Film },
                    { name: 'Evolution API (WhatsApp)', status: 'Configurar', icon: MessageCircle },
                    { name: 'Cloudflare', status: 'Conectado', icon: Cloud },
                    { name: 'Resend (Email)', status: 'Configurar', icon: Mail },
                  ].map((integration, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <integration.icon className="w-5 h-5 text-cyan-500" />
                        <span>{integration.name}</span>
                      </div>
                      <NeonBadge color={integration.status === 'Conectado' ? 'green' : integration.status === 'Degradado' ? 'yellow' : 'cyan'}>
                        {integration.status}
                      </NeonBadge>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </main>
      
      {/* Pix Modal */}
      <AnimatePresence>
        {showPixModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPixModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Enviar Cobrança</h3>
                <button onClick={() => setShowPixModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-gray-400">{selectedUser.name}</p>
                <p className="text-3xl font-bold text-cyan-400">R$ {selectedUser.amount.toFixed(2)}</p>
                <p className="text-sm text-gray-400 mt-1">Plano {selectedUser.plan}</p>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl mb-4">
                <p className="text-xs text-gray-400 mb-2">Chave Pix Copia e Cola:</p>
                <code className="text-xs break-all text-cyan-400">
                  00020126580014BR.GOV.BCB.PIX0136{selectedUser.email}520400005303986540529.905802BR5913CINECASA6008SAOPAULO62070503***6304{selectedUser.id.slice(0, 4)}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX0136${selectedUser.email}520400005303986540529.905802BR5913CINECASA6008SAOPAULO62070503***6304${selectedUser.id.slice(0, 4)}`);
                    toast({ title: 'Copiado!', description: 'Código Pix copiado para a área de transferência' });
                  }}
                  className="mt-3 w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Código
                </button>
              </div>
              
              <ActionButton 
                onClick={() => {
                  toast({ title: 'WhatsApp', description: `Cobrança enviada para ${selectedUser.phone}` });
                  setShowPixModal(false);
                }}
                icon={Send}
                className="w-full justify-center"
              >
                Enviar via WhatsApp
              </ActionButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#141414] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Adicionar Novo Usuário</h3>
                <button onClick={() => setShowAddUserModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Nome *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Nome completo"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Telefone (WhatsApp)</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="5511999999999"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Plano</label>
                  <select
                    value={newUser.plan}
                    onChange={(e) => {
                      const plan = e.target.value as 'basic' | 'premium' | 'family';
                      const amount = plan === 'basic' ? 19.90 : plan === 'premium' ? 29.90 : 49.90;
                      setNewUser({ ...newUser, plan, amount });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="basic">Basic - R$ 19,90</option>
                    <option value="premium">Premium - R$ 29,90</option>
                    <option value="family">Family - R$ 49,90</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={newUser.due_date}
                    onChange={(e) => setNewUser({ ...newUser, due_date: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <ActionButton 
                  onClick={() => setShowAddUserModal(false)}
                  variant="secondary"
                  className="flex-1 justify-center"
                >
                  Cancelar
                </ActionButton>
                <ActionButton 
                  onClick={handleCreateUser}
                  variant="success"
                  icon={Plus}
                  loading={loading === 'create-user'}
                  className="flex-1 justify-center"
                >
                  Criar Usuário
                </ActionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

