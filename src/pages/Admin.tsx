import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Film, Tv, Users, Settings, BarChart3, 
  Plus, Search, Edit2, Trash2, ChevronDown, ChevronRight,
  TrendingUp, Eye, Clock, Star, Download, Upload, Bell,
  Shield, Database, Activity, PieChart, Menu, X, Check,
  AlertTriangle, Filter, MoreVertical, ChevronLeft, ChevronLeftIcon, LogOut,
  UserCheck, UserX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { LocalStorageCleanup } from '@/components/LocalStorageCleanup';

interface DashboardStats {
  totalMovies: number;
  totalSeries: number;
  totalUsers: number;
  totalViews: number;
  newUsersToday: number;
  activeUsers: number;
}

interface ContentItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster: string;
  year: number;
  rating: number;
  views: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'user';
  lastLogin: string;
  status: 'active' | 'inactive' | 'banned';
}

type AdminSection = 'dashboard' | 'movies' | 'series' | 'users' | 'analytics' | 'settings' | 'missing' | 'approvals';

// Interface para o menu "Está Faltando"
interface MissingSeason {
  id: string;
  serieId: string;
  titulo: string;
  poster: string;
  temporada: number;
  totalTemporadas: number;
}

// Modal Component
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [movies, setMovies] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<ContentItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Modal states
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [showAddSeries, setShowAddSeries] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{id: string; type: string; name: string} | null>(null);

  // Form states
  const [movieForm, setMovieForm] = useState({ titulo: '', descricao: '', ano: new Date().getFullYear(), genero: '', rating: '0', poster: '', banner: '', video_url: '', trailer_url: '', duracao: '', categoria: '' });
  const [seriesForm, setSeriesForm] = useState({ titulo: '', descricao: '', ano: new Date().getFullYear(), genero: '', rating: '0', poster: '', banner: '', trailer_url: '', categoria: '', temporadas: 1 });
  const [userForm, setUserForm] = useState({ email: '', password: '', name: '', role: 'user' as const });

  // Missing items states - coleção desabilitada
  const [missingSeasons, setMissingSeasons] = useState<MissingSeason[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchDashboardData(), fetchMovies(), fetchSeries(), fetchUsers(), fetchMissingItems()]);
    setLoading(false);
  };

  const fetchMissingItems = async () => {
    // Coleção completamente desabilitada - nenhum filme aparece como coleção
    // Fetch all series to detect missing seasons
    const { data: allSeries } = await supabase.from('series').select('*');
    if (allSeries) {
      detectMissingSeasons(allSeries);
    }
  };

  const detectMissingSeasons = (seriesList: any[]) => {
    const missing: MissingSeason[] = [];

    seriesList.forEach(serie => {
      const totalTemporadas = serie.temporadas || 1;
      const temporadasExistentes = serie.temporadas_disponiveis || [1];

      for (let i = 1; i <= totalTemporadas; i++) {
        if (!temporadasExistentes.includes(i)) {
          missing.push({
            id: `${serie.id_n || serie.id}-temp-${i}`,
            serieId: serie.id_n || serie.id,
            titulo: serie.titulo,
            poster: serie.poster || '',
            temporada: i,
            totalTemporadas: totalTemporadas
          });
        }
      }
    });

    setMissingSeasons(missing);
  };

  const handleMarkSeasonAsAdded = async (season: MissingSeason) => {
    // Remove from missing list
    setMissingSeasons(prev => prev.filter(s => s.id !== season.id));
    toast({
      title: 'Temporada marcada como adicionada',
      description: `${season.titulo} - Temporada ${season.temporada} foi removida da lista de pendentes.`,
    });
  };

  const fetchDashboardData = async () => {
    const [{ count: movieCount }, { count: seriesCount }, { count: userCount }, { data: recentMovies }] = await Promise.all([
      supabase.from('cinema').select('*', { count: 'exact', head: true }),
      supabase.from('series').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('cinema').select('id, titulo, poster, ano, rating, created_at').order('created_at', { ascending: false }).limit(5)
    ]);

    setStats({ totalMovies: movieCount || 0, totalSeries: seriesCount || 0, totalUsers: userCount || 0, totalViews: 15420, newUsersToday: 12, activeUsers: 89 });
    setRecentContent((recentMovies || []).map(m => ({ id: m.id.toString(), title: m.titulo, type: 'movie' as const, poster: m.poster, year: m.ano, rating: parseFloat(m.rating) || 0, views: Math.floor(Math.random() * 1000), status: 'published', createdAt: m.created_at })));
  };

  const fetchMovies = async () => {
    const { data } = await supabase.from('cinema').select('*').order('created_at', { ascending: false });
    if (data) setMovies(data.map(m => ({ id: m.id.toString(), title: m.titulo, type: 'movie' as const, poster: m.poster, year: m.ano, rating: parseFloat(m.rating) || 0, views: Math.floor(Math.random() * 1000), status: 'published', createdAt: m.created_at })));
  };

  const fetchSeries = async () => {
    const { data } = await supabase.from('series').select('*').order('created_at', { ascending: false });
    if (data) setSeries(data.map(s => ({ id: s.id_n?.toString() || s.id, title: s.titulo, type: 'series' as const, poster: s.poster, year: s.ano, rating: parseFloat(s.rating) || 0, views: Math.floor(Math.random() * 1000), status: 'published', createdAt: s.created_at })));
  };

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    console.log('[Admin] fetchUsers - profiles:', profiles, 'error:', error);
    if (error) {
      toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
      return;
    }
    if (profiles) {
      const mappedUsers = profiles.map((p: any) => ({ 
        id: p.id, 
        email: p.email || '', 
        name: p.name || 'Sem nome', 
        avatar: p.avatar, 
        role: p.role || 'user', 
        lastLogin: p.updated_at, 
        status: p.status || 'active', 
        approved: p.approved, 
        is_admin: p.is_admin 
      }));
      console.log('[Admin] fetchUsers - mapped:', mappedUsers.length, 'users');
      setUsers(mappedUsers);
    }
  };

  const fetchPendingUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .or('approved.eq.false,approved.is.null');
    console.log('[Admin] fetchPendingUsers - profiles:', profiles, 'error:', error);
    if (error) {
      toast({ title: 'Erro ao carregar pendentes', description: error.message, variant: 'destructive' });
      return;
    }
    if (profiles) {
      console.log('[Admin] fetchPendingUsers - found:', profiles.length, 'pending users');
      setPendingUsers(profiles);
    }
  };

  const handleApproveUser = async (userId: string, makeAdmin: boolean = false) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true, is_admin: makeAdmin, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Sucesso!', description: makeAdmin ? 'Usuário aprovado e definido como admin.' : 'Usuário aprovado com sucesso.' });
    fetchPendingUsers();
    fetchUsers();
  };

  const handleRejectUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Sucesso!', description: 'Usuário rejeitado e removido.' });
    fetchPendingUsers();
  };

  const handleAddMovie = async () => {
    const { error } = await supabase.from('cinema').insert([{ ...movieForm, created_at: new Date().toISOString() }]);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sucesso!', description: 'Filme adicionado com sucesso.' });
    setShowAddMovie(false); setMovieForm({ titulo: '', descricao: '', ano: new Date().getFullYear(), genero: '', rating: '0', poster: '', banner: '', video_url: '', trailer_url: '', duracao: '', categoria: '' });
    fetchMovies(); fetchDashboardData();
  };

  const handleAddSeries = async () => {
    const { error } = await supabase.from('series').insert([{ ...seriesForm, created_at: new Date().toISOString() }]);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sucesso!', description: 'Série adicionada com sucesso.' });
    setShowAddSeries(false); setSeriesForm({ titulo: '', descricao: '', ano: new Date().getFullYear(), genero: '', rating: '0', poster: '', banner: '', trailer_url: '', categoria: '', temporadas: 1 });
    fetchSeries(); fetchDashboardData();
  };

  const handleAddUser = async () => {
    setLoading(true);
    try {
      // 1. Criar usuário na autenticação
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: userForm.email, 
        password: userForm.password, 
        options: { 
          data: { name: userForm.name, role: userForm.role },
          emailRedirectTo: window.location.origin + '/login'
        } 
      });
      
      if (authError) {
        toast({ title: 'Erro ao criar usuário', description: authError.message, variant: 'destructive' });
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        toast({ title: 'Erro', description: 'ID do usuário não retornado', variant: 'destructive' });
        return;
      }

      // 2. Criar perfil na tabela profiles manualmente (pois o trigger pode não estar funcionando)
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email: userForm.email,
        name: userForm.name,
        role: userForm.role,
        is_admin: userForm.role === 'admin',
        approved: true, // Aprovar automaticamente quando criado pelo admin
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (profileError) {
        console.error('[Admin] Erro ao criar perfil:', profileError);
        // Não retornar erro aqui - o usuário foi criado, apenas o perfil falhou
        toast({ 
          title: 'Aviso', 
          description: 'Usuário criado, mas houve erro ao criar perfil. Verifique o console.', 
          variant: 'default' 
        });
      } else {
        toast({ title: 'Sucesso!', description: `Usuário ${userForm.name} criado e aprovado com sucesso.` });
      }

      setShowAddUser(false);
      setUserForm({ email: '', password: '', name: '', role: 'user' });
      fetchUsers();
      fetchDashboardData();
    } catch (error: any) {
      console.error('[Admin] Erro inesperado:', error);
      toast({ title: 'Erro inesperado', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const table = deleteItem.type === 'movie' ? 'cinema' : deleteItem.type === 'series' ? 'series' : 'profiles';
    const idField = deleteItem.type === 'series' ? 'id_n' : 'id';
    const { error } = await supabase.from(table).delete().eq(idField, deleteItem.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Sucesso!', description: 'Item excluído com sucesso.' });
    setShowDelete(false); setDeleteItem(null);
    fetchAllData();
  };

  const handleBackup = () => {
    toast({ title: 'Backup iniciado', description: 'Gerando arquivo de backup...' });
    setTimeout(() => {
      const data = { movies, series, users, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `backup-cinecasa-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleImportCSV = () => {
    toast({ title: 'Importação CSV', description: 'Funcionalidade de importação em desenvolvimento.' });
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast({ title: 'Configuração atualizada', description: `${key} foi ${!settings[key] ? 'ativado' : 'desativado'}.` });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const confirmDelete = (id: string, type: string, name: string) => {
    setDeleteItem({ id, type, name });
    setShowDelete(true);
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'movies', label: 'Filmes', icon: Film },
    { id: 'series', label: 'Séries', icon: Tv },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'approvals', label: 'Aprovações', icon: UserCheck },
    { id: 'missing', label: 'Está Faltando', icon: AlertTriangle },
    { id: 'analytics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-[#141414] border-r border-white/5 z-50"
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-bold text-lg">Painel Admin</h1>
              <p className="text-xs text-gray-500">CineCasa</p>
            </motion.div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Navigation */}
        <nav className="px-4 py-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as AdminSection)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-red-600/20 text-red-500 border border-red-600/30' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isSidebarOpen && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin Info */}
        {isSidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Administrador</p>
                <p className="text-xs text-gray-500">admin@cinecasa.com</p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <main 
        className="transition-all duration-300 min-h-screen overflow-x-hidden"
        style={{ marginLeft: isSidebarOpen ? '280px' : '80px' }}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{
                activeSection === 'dashboard' ? 'Painel' :
                activeSection === 'movies' ? 'Filmes' :
                activeSection === 'series' ? 'Séries' :
                activeSection === 'users' ? 'Usuários' :
                activeSection === 'approvals' ? 'Aprovações' :
                activeSection === 'missing' ? 'Está Faltando' :
                activeSection === 'analytics' ? 'Estatísticas' :
                activeSection === 'settings' ? 'Configurações' : activeSection
              }</h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-red-500/50 w-64"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {activeSection === 'dashboard' && (
            <DashboardView 
              stats={stats} 
              loading={loading} 
              recentContent={recentContent}
              onAddMovie={() => setShowAddMovie(true)}
              onAddSeries={() => setShowAddSeries(true)}
              onImportCSV={handleImportCSV}
              onBackup={handleBackup}
            />
          )}
          {activeSection === 'movies' && (
            <MoviesView 
              movies={movies}
              onAdd={() => setShowAddMovie(true)}
              onEdit={(movie) => { setMovieForm({ ...movieForm, ...movie }); setShowAddMovie(true); }}
              onDelete={(movie) => confirmDelete(movie.id, 'movie', movie.title)}
            />
          )}
          {activeSection === 'series' && (
            <SeriesView 
              series={series}
              onAdd={() => setShowAddSeries(true)}
              onEdit={(s) => { setSeriesForm({ ...seriesForm, ...s }); setShowAddSeries(true); }}
              onDelete={(s) => confirmDelete(s.id, 'series', s.title)}
            />
          )}
          {activeSection === 'users' && (
            <UsersView 
              users={users}
              onAdd={() => setShowAddUser(true)}
              onEdit={(user) => { setUserForm({ ...userForm, ...user }); setShowAddUser(true); }}
              onDelete={(user) => confirmDelete(user.id, 'user', user.name)}
            />
          )}
          {activeSection === 'approvals' && (
            <ApprovalsView 
              pendingUsers={pendingUsers}
              onApprove={handleApproveUser}
              onReject={handleRejectUser}
              onRefresh={fetchPendingUsers}
            />
          )}
          {activeSection === 'analytics' && <AnalyticsView />}
          {activeSection === 'missing' && (
            <EstaFaltandoView 
              missingSeasons={missingSeasons}
              onMarkSeasonAdded={handleMarkSeasonAsAdded}
            />
          )}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <SettingsView 
                settings={settings}
                onToggle={handleToggleSetting}
              />
              <LocalStorageCleanup />
            </div>
          )}
        </div>
      </main>

      {/* Add Movie Modal */}
      {showAddMovie && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-white/10 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Adicionar Filme</h2>
              <button onClick={() => setShowAddMovie(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Título" value={movieForm.titulo} onChange={e => setMovieForm({...movieForm, titulo: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Ano" value={movieForm.ano} onChange={e => setMovieForm({...movieForm, ano: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
                <input type="text" placeholder="Rating" value={movieForm.rating} onChange={e => setMovieForm({...movieForm, rating: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              </div>
              <input type="text" placeholder="Poster URL" value={movieForm.poster} onChange={e => setMovieForm({...movieForm, poster: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              <input type="text" placeholder="URL do Vídeo" value={movieForm.video_url} onChange={e => setMovieForm({...movieForm, video_url: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button onClick={() => setShowAddMovie(false)} className="px-6 py-2 border border-white/20 rounded-lg">Cancelar</button>
              <button onClick={handleAddMovie} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Series Modal */}
      {showAddSeries && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-white/10 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Adicionar Série</h2>
              <button onClick={() => setShowAddSeries(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Título" value={seriesForm.titulo} onChange={e => setSeriesForm({...seriesForm, titulo: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Ano" value={seriesForm.ano} onChange={e => setSeriesForm({...seriesForm, ano: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
                <input type="number" placeholder="Temporadas" value={seriesForm.temporadas} onChange={e => setSeriesForm({...seriesForm, temporadas: parseInt(e.target.value)})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              </div>
              <input type="text" placeholder="Poster URL" value={seriesForm.poster} onChange={e => setSeriesForm({...seriesForm, poster: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button onClick={() => setShowAddSeries(false)} className="px-6 py-2 border border-white/20 rounded-lg">Cancelar</button>
              <button onClick={handleAddSeries} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg">Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-white/10 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Adicionar Usuário</h2>
              <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Nome" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              <input type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              <input type="password" placeholder="Senha" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg" />
              <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                <option value="user">Usuário</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button 
                onClick={() => setShowAddUser(false)} 
                disabled={loading}
                className="px-6 py-2 border border-white/20 rounded-lg hover:bg-white/5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddUser} 
                disabled={loading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Criando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && deleteItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-white/10 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
                <p className="text-gray-400">Tem certeza que deseja excluir <strong>{deleteItem.name}</strong>?</p>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDelete(false)} className="px-6 py-2 border border-white/20 rounded-lg">Cancelar</button>
              <button onClick={handleDelete} className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dashboard View
function DashboardView({ stats, loading, recentContent, onAddMovie, onAddSeries, onImportCSV, onBackup }: { 
  stats: DashboardStats | null; 
  loading: boolean;
  recentContent: ContentItem[];
  onAddMovie: () => void;
  onAddSeries: () => void;
  onImportCSV: () => void;
  onBackup: () => void;
}) {
  const statCards = [
    { label: 'Total de Filmes', value: stats?.totalMovies || 0, icon: Film, color: 'from-blue-500 to-blue-700', trend: '+12%' },
    { label: 'Total de Séries', value: stats?.totalSeries || 0, icon: Tv, color: 'from-purple-500 to-purple-700', trend: '+5%' },
    { label: 'Usuários Ativos', value: stats?.totalUsers || 0, icon: Users, color: 'from-green-500 to-green-700', trend: '+23%' },
    { label: 'Visualizações', value: stats?.totalViews?.toLocaleString() || '0', icon: Eye, color: 'from-orange-500 to-orange-700', trend: '+18%' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-[#141414] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{loading ? '-' : stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm">{stat.trend}</span>
                    <span className="text-gray-500 text-sm">vs mês anterior</span>
                  </div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-[#141414] border border-white/5 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Conteúdo Recente</h3>
            <button className="text-red-500 text-sm hover:underline">Ver todos</button>
          </div>

          <div className="space-y-4">
            {recentContent.map((item, index) => (
              <div 
                key={item.id}
                className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-lg transition-colors group"
              >
                <img 
                  src={item.poster} 
                  alt={item.title}
                  className="w-16 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="capitalize">{item.type === 'movie' ? 'Filme' : 'Série'}</span>
                    <span>•</span>
                    <span>{item.year}</span>
                    <span>•</span>
                    <span className="text-yellow-500">★ {item.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-white/10 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#141414] border border-white/5 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-6">Ações Rápidas</h3>
          
          <div className="space-y-3">
            <button 
              onClick={onAddMovie}
              className="w-full flex items-center gap-3 p-4 bg-red-600/20 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-left"
            >
              <Plus className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">Adicionar Filme</p>
                <p className="text-sm text-gray-400">Adicionar novo conteúdo ao catálogo</p>
              </div>
            </button>

            <button 
              onClick={onAddSeries}
              className="w-full flex items-center gap-3 p-4 bg-red-600/20 border border-red-600/30 rounded-lg hover:bg-red-600/30 transition-colors text-left"
            >
              <Plus className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">Adicionar Série</p>
                <p className="text-sm text-gray-400">Adicionar nova série ao catálogo</p>
              </div>
            </button>

            <button 
              onClick={onImportCSV}
              className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <Upload className="w-5 h-5" />
              <div>
                <p className="font-medium">Importar CSV</p>
                <p className="text-sm text-gray-400">Importar conteúdo em massa</p>
              </div>
            </button>

            <button 
              onClick={onBackup}
              className="w-full flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <Database className="w-5 h-5" />
              <div>
                <p className="font-medium">Backup</p>
                <p className="text-sm text-gray-400">Criar backup do sistema</p>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Movies View
function MoviesView({ movies, onAdd, onEdit, onDelete }: { 
  movies: ContentItem[];
  onAdd: () => void;
  onEdit: (movie: ContentItem) => void;
  onDelete: (movie: ContentItem) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Filme
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Filme</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ano</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Avaliação</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {movies.map((movie) => (
              <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={movie.poster} alt={movie.title} className="w-10 h-14 object-cover rounded" />
                    <span className="font-medium">{movie.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{movie.year}</td>
                <td className="px-6 py-4">
                  <span className="text-yellow-500">★ {movie.rating.toFixed(1)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(movie)}
                      className="p-2 hover:bg-white/10 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(movie)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Series View
function SeriesView({ series, onAdd, onEdit, onDelete }: { 
  series: ContentItem[];
  onAdd: () => void;
  onEdit: (s: ContentItem) => void;
  onDelete: (s: ContentItem) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Série
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Série</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ano</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Avaliação</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {series.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={s.poster} alt={s.title} className="w-10 h-14 object-cover rounded" />
                    <span className="font-medium">{s.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{s.year}</td>
                <td className="px-6 py-4">
                  <span className="text-yellow-500">★ {s.rating.toFixed(1)}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(s)}
                      className="p-2 hover:bg-white/10 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(s)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Users View
function UsersView({ users, onAdd, onEdit, onDelete }: { 
  users: User[];
  onAdd: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Lista de Usuários</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Usuário
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Usuário</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Função</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm">{user.name?.[0] || 'U'}</span>
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                    user.role === 'moderator' ? 'bg-yellow-500/20 text-yellow-500' :
                    'bg-green-500/20 text-green-500'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEdit(user)}
                      className="p-2 hover:bg-white/10 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(user)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Approvals View
function ApprovalsView({ 
  pendingUsers, 
  onApprove, 
  onReject,
  onRefresh 
}: { 
  pendingUsers: any[];
  onApprove: (userId: string, makeAdmin?: boolean) => void;
  onReject: (userId: string) => void;
  onRefresh: () => void;
}) {
  useEffect(() => {
    onRefresh();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aprovações Pendentes</h2>
        <button 
          onClick={onRefresh}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-[#141414] border border-white/5 rounded-xl p-8 text-center">
          <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum usuário pendente</h3>
          <p className="text-gray-400">Todos os usuários foram aprovados.</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Usuário</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Cadastro</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm">{(user.name || user.email)?.[0]?.toUpperCase() || 'U'}</span>
                      </div>
                      <div>
                        <span className="font-medium block">{user.name || 'Sem nome'}</span>
                        <span className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onApprove(user.id, false)}
                        className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-500 rounded-lg transition-colors flex items-center gap-2"
                        title="Aprovar como usuário"
                      >
                        <UserCheck className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button 
                        onClick={() => onApprove(user.id, true)}
                        className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-lg transition-colors flex items-center gap-2"
                        title="Aprovar como admin"
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Tem certeza que deseja rejeitar este usuário? Ele será removido do sistema.')) {
                            onReject(user.id);
                          }
                        }}
                        className="px-3 py-2 bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 rounded-lg transition-colors flex items-center gap-2"
                        title="Rejeitar e remover"
                      >
                        <UserX className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Analytics View
function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-white/5 rounded-xl p-6">
          <Activity className="w-8 h-8 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Visualizações</h3>
          <p className="text-3xl font-bold">15,420</p>
          <p className="text-green-500 text-sm mt-1">+18% vs mês anterior</p>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-xl p-6">
          <PieChart className="w-8 h-8 text-purple-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tempo Médio</h3>
          <p className="text-3xl font-bold">45min</p>
          <p className="text-green-500 text-sm mt-1">+5% vs mês anterior</p>
        </div>
        <div className="bg-[#141414] border border-white/5 rounded-xl p-6">
          <BarChart3 className="w-8 h-8 text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Taxa de Retenção</h3>
          <p className="text-3xl font-bold">78%</p>
          <p className="text-green-500 text-sm mt-1">+12% vs mês anterior</p>
        </div>
      </div>
    </div>
  );
}

// Está Faltando View
function EstaFaltandoView({ 
  missingSeasons, 
  onMarkSeasonAdded 
}: { 
  missingSeasons: MissingSeason[];
  onMarkSeasonAdded: (season: MissingSeason) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Missing Seasons Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Tv className="w-5 h-5 text-red-500" />
          Séries com Temporadas Faltando ({missingSeasons.length})
        </h2>
        {missingSeasons.length === 0 ? (
          <p className="text-gray-500">Nenhuma temporada faltando em séries.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {missingSeasons.map((season) => (
              <div key={season.id} className="relative group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                  {season.poster ? (
                    <img 
                      src={season.poster} 
                      alt={season.titulo}
                      className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <Tv className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-600/80 rounded text-xs font-bold">
                    Temp. {season.temporada}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-bold truncate">{season.titulo}</p>
                    <p className="text-xs text-gray-400">{season.temporada} de {season.totalTemporadas} temporadas</p>
                  </div>
                  <button
                    onClick={() => onMarkSeasonAdded(season)}
                    className="absolute top-2 right-2 p-2 bg-green-600/80 hover:bg-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Marcar como adicionada"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 

// Settings View
function SettingsView({ settings, onToggle }: { 
  settings: {
    maintenanceMode: boolean;
    accessLogs: boolean;
    emailNotifications: boolean;
  };
  onToggle: (key: keyof typeof settings) => void;
}) {
  const settingItems = [
    { key: 'maintenanceMode', label: 'Modo de Manutenção', description: 'Desativar acesso público' },
    { key: 'accessLogs', label: 'Registros de Acesso', description: 'Logar todas as ações' },
    { key: 'emailNotifications', label: 'Notificações por Email', description: 'Enviar alertas importantes' },
  ] as const;

  return (
    <div className="max-w-2xl">
      <div className="bg-[#141414] border border-white/5 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
        
        <div className="space-y-4">
          {settingItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <button 
                onClick={() => onToggle(item.key)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  settings[item.key] ? 'bg-red-600' : 'bg-gray-700'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  settings[item.key] ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
