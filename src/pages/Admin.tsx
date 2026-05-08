import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import {
  Film, Tv, Users, Home, Bell, BarChart2, Plus, Trash2,
  Edit3, Save, X, ChevronUp, ChevronDown, Eye, EyeOff, RefreshCw
} from 'lucide-react';

type Tab = 'dashboard' | 'filmes' | 'series' | 'usuarios' | 'home' | 'notificacoes';

const NEON = '#00B7FF';
const BG = '#070A10';
const CARD = 'rgba(255,255,255,0.04)';
const BORDER = 'rgba(255,255,255,0.08)';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ filmes: 0, series: 0, usuarios: 0, episodios: 0 });

  // Conteúdo
  const [filmes, setFilmes] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [homeSections, setHomeSections] = useState<any[]>([]);
  const [editingSection, setEditingSection] = useState<any | null>(null);
  const [newSection, setNewSection] = useState({ nome: '', tipo: 'categoria', query: '', ordem: 0 });

  // Notificações
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Modal de edição de conteúdo
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editTable, setEditTable] = useState<'cinema' | 'series'>('cinema');

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user?.id) { navigate('/login'); return; }
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
    if (!data?.is_admin) { navigate('/'); toast.error('Acesso negado'); return; }
    setIsAdmin(true);
    loadStats();
    setLoading(false);
  };

  const loadStats = async () => {
    const [f, s, u, e] = await Promise.all([
      supabase.from('cinema').select('id', { count: 'exact', head: true }),
      supabase.from('series').select('id_n', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('episodios').select('id_n', { count: 'exact', head: true }),
    ]);
    setStats({ filmes: f.count||0, series: s.count||0, usuarios: u.count||0, episodios: e.count||0 });
  };

  const loadFilmes = async () => {
    const { data } = await supabase.from('cinema').select('id,titulo,poster,year,rating,category').order('id', { ascending: false }).limit(50);
    setFilmes(data || []);
  };

  const loadSeries = async () => {
    const { data } = await supabase.from('series').select('id_n,titulo,capa,ano,rating,genero').order('id_n', { ascending: false }).limit(50);
    setSeries(data || []);
  };

  const loadUsuarios = async () => {
    const { data } = await supabase.from('profiles').select('id,email,display_name,is_active,is_admin,created_at').order('created_at', { ascending: false }).limit(100);
    setUsuarios(data || []);
  };

  const loadHomeSections = async () => {
    const { data } = await supabase.from('home_sections').select('*').order('ordem', { ascending: true });
    setHomeSections(data || []);
  };

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === 'filmes') loadFilmes();
    if (tab === 'series') loadSeries();
    if (tab === 'usuarios') loadUsuarios();
    if (tab === 'home') loadHomeSections();
  }, [tab, isAdmin]);

  // ── Salvar edição de conteúdo ──
  const saveEdit = async () => {
    if (!editItem) return;
    const table = editTable;
    const idCol = table === 'cinema' ? 'id' : 'id_n';
    const { error } = await supabase.from(table).update(editItem).eq(idCol, editItem[idCol]);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success('Salvo com sucesso!');
    setEditItem(null);
    if (table === 'cinema') loadFilmes(); else loadSeries();
  };

  // ── Excluir conteúdo ──
  const deleteContent = async (table: 'cinema' | 'series', id: number) => {
    if (!confirm('Excluir este conteúdo?')) return;
    const idCol = table === 'cinema' ? 'id' : 'id_n';
    const { error } = await supabase.from(table).delete().eq(idCol, id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Excluído');
    if (table === 'cinema') loadFilmes(); else loadSeries();
    loadStats();
  };

  // ── Toggle admin ──
  const toggleAdmin = async (userId: string, current: boolean) => {
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId);
    loadUsuarios();
  };

  // ── Toggle ativo ──
  const toggleActive = async (userId: string, current: boolean) => {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', userId);
    loadUsuarios();
  };

  // ── Home sections ──
  const saveSection = async () => {
    if (!newSection.nome) { toast.error('Nome obrigatório'); return; }
    const { error } = await supabase.from('home_sections').insert([newSection]);
    if (error) { toast.error(error.message); return; }
    toast.success('Seção criada!');
    setNewSection({ nome: '', tipo: 'categoria', query: '', ordem: 0 });
    loadHomeSections();
  };

  const updateSection = async (id: string, updates: any) => {
    await supabase.from('home_sections').update(updates).eq('id', id);
    loadHomeSections();
  };

  const deleteSection = async (id: string) => {
    if (!confirm('Excluir seção?')) return;
    await supabase.from('home_sections').delete().eq('id', id);
    loadHomeSections();
  };

  const moveSection = async (id: string, direction: 'up' | 'down') => {
    const idx = homeSections.findIndex(s => s.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === homeSections.length - 1) return;
    const other = homeSections[direction === 'up' ? idx - 1 : idx + 1];
    await Promise.all([
      supabase.from('home_sections').update({ ordem: other.ordem }).eq('id', id),
      supabase.from('home_sections').update({ ordem: homeSections[idx].ordem }).eq('id', other.id),
    ]);
    loadHomeSections();
  };

  // ── Enviar notificação ──
  const sendNotification = async () => {
    if (!notifTitle || !notifBody) { toast.error('Preencha título e mensagem'); return; }
    setSendingNotif(true);
    const { data: users } = await supabase.from('profiles').select('id').eq('is_active', true).limit(500);
    if (!users?.length) { toast.error('Nenhum usuário ativo'); setSendingNotif(false); return; }

    const inserts = users.map(u => ({
      user_id: u.id, title: notifTitle, body: notifBody,
      type: 'announcement', read: false,
    }));

    const { error } = await supabase.from('notifications').insert(inserts);
    if (error) { toast.error('Erro: ' + error.message); }
    else { toast.success(`Notificação enviada para ${users.length} usuários!`); setNotifTitle(''); setNotifBody(''); }
    setSendingNotif(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: NEON }}>Verificando permissões...</div>
    </div>
  );

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { key: 'filmes', label: 'Filmes', icon: Film },
    { key: 'series', label: 'Séries', icon: Tv },
    { key: 'usuarios', label: 'Usuários', icon: Users },
    { key: 'home', label: 'Home', icon: Home },
    { key: 'notificacoes', label: 'Notificações', icon: Bell },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#EAF6FF', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: 'rgba(0,0,0,0.5)', borderRight: `1px solid ${BORDER}`, padding: '24px 12px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 32, paddingLeft: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: NEON }}>CineCasa</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Painel Administrativo</div>
        </div>
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 4, fontWeight: 600, fontSize: 13, transition: 'all 0.15s', background: tab === t.key ? `rgba(0,183,255,0.15)` : 'transparent', color: tab === t.key ? NEON : 'rgba(255,255,255,0.55)', width: '100%', textAlign: 'left' }}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
        <div style={{ marginTop: 'auto' }}>
          <button onClick={() => navigate('/')} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontSize: 13 }}>
            ← Voltar ao site
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Filmes', value: stats.filmes, icon: '🎬', color: '#3b82f6' },
                { label: 'Séries', value: stats.series, icon: '📺', color: '#8b5cf6' },
                { label: 'Episódios', value: stats.episodios, icon: '🎞️', color: '#f59e0b' },
                { label: 'Usuários', value: stats.usuarios, icon: '👥', color: '#10b981' },
              ].map((s, i) => (
                <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px' }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: s.color, marginTop: 8 }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={loadStats} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: `rgba(0,183,255,0.15)`, border: `1px solid rgba(0,183,255,0.3)`, borderRadius: 10, color: NEON, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              <RefreshCw size={14} /> Atualizar stats
            </button>
          </div>
        )}

        {/* FILMES */}
        {tab === 'filmes' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Gerenciar Filmes</h1>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Poster','Título','Ano','Nota','Categoria','Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filmes.map(f => (
                    <tr key={f.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '8px 16px' }}>
                        {f.poster && <img src={f.poster.startsWith('http') ? f.poster : `https://image.tmdb.org/t/p/w92${f.poster}`} style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 6 }} alt="" />}
                      </td>
                      <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, maxWidth: 200 }}>{f.titulo}</td>
                      <td style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{f.year}</td>
                      <td style={{ padding: '8px 16px', fontSize: 12 }}>{f.rating ? `⭐ ${f.rating}` : '—'}</td>
                      <td style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{f.category}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditItem({...f}); setEditTable('cinema'); }} style={{ padding: '5px 10px', background: 'rgba(0,183,255,0.15)', border: `1px solid rgba(0,183,255,0.3)`, borderRadius: 6, color: NEON, cursor: 'pointer', fontSize: 11 }}>
                            <Edit3 size={12} />
                          </button>
                          <button onClick={() => deleteContent('cinema', f.id)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 11 }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERIES */}
        {tab === 'series' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Gerenciar Séries</h1>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Capa','Título','Ano','Nota','Gênero','Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {series.map(s => (
                    <tr key={s.id_n} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '8px 16px' }}>
                        {s.capa && <img src={s.capa.startsWith('http') ? s.capa : `https://image.tmdb.org/t/p/w92${s.capa}`} style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 6 }} alt="" />}
                      </td>
                      <td style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>{s.titulo}</td>
                      <td style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.ano}</td>
                      <td style={{ padding: '8px 16px', fontSize: 12 }}>{s.rating ? `⭐ ${s.rating}` : '—'}</td>
                      <td style={{ padding: '8px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{s.genero}</td>
                      <td style={{ padding: '8px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditItem({...s}); setEditTable('series'); }} style={{ padding: '5px 10px', background: 'rgba(0,183,255,0.15)', border: `1px solid rgba(0,183,255,0.3)`, borderRadius: 6, color: NEON, cursor: 'pointer', fontSize: 11 }}><Edit3 size={12} /></button>
                          <button onClick={() => deleteContent('series', s.id_n)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 11 }}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USUÁRIOS */}
        {tab === 'usuarios' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Usuários ({usuarios.length})</h1>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    {['Email','Nome','Status','Admin','Cadastro','Ações'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '10px 16px', fontSize: 13 }}>{u.email}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13 }}>{u.display_name || '—'}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: u.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: u.is_active ? '#10b981' : '#ef4444' }}>
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: u.is_admin ? 'rgba(0,183,255,0.15)' : 'rgba(255,255,255,0.05)', color: u.is_admin ? NEON : 'rgba(255,255,255,0.4)' }}>
                          {u.is_admin ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => toggleActive(u.id, u.is_active)} style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11 }}>
                            {u.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          {u.id !== user?.id && (
                            <button onClick={() => toggleAdmin(u.id, u.is_admin)} style={{ padding: '4px 10px', background: u.is_admin ? 'rgba(239,68,68,0.1)' : 'rgba(0,183,255,0.1)', border: `1px solid ${u.is_admin ? 'rgba(239,68,68,0.3)' : 'rgba(0,183,255,0.3)'}`, borderRadius: 6, color: u.is_admin ? '#ef4444' : NEON, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                              {u.is_admin ? 'Remover admin' : 'Tornar admin'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HOME SECTIONS */}
        {tab === 'home' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Seções da Home</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
              Configure as seções exibidas na página inicial. A ordem aqui define a ordem na home.
            </p>

            {/* Nova seção */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: NEON }}>+ Nova Seção</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Nome da seção *</label>
                  <input value={newSection.nome} onChange={e => setNewSection(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Lançamentos, Em Alta..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Tipo</label>
                  <select value={newSection.tipo} onChange={e => setNewSection(p => ({ ...p, tipo: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#0a0a1a', border: `1px solid ${BORDER}`, borderRadius: 10, color: 'white', fontSize: 13, outline: 'none' }}>
                    <option value="categoria">Por Categoria/Gênero</option>
                    <option value="lancamentos">Lançamentos</option>
                    <option value="recomendados">Recomendados</option>
                    <option value="continuar">Continuar Assistindo</option>
                    <option value="watchlist">Minha Lista</option>
                    <option value="top10">Top 10</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Query / Filtro (opcional)</label>
                  <input value={newSection.query} onChange={e => setNewSection(p => ({ ...p, query: e.target.value }))} placeholder="Ex: Ação, Drama, 2024..." style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Ordem</label>
                  <input type="number" value={newSection.ordem} onChange={e => setNewSection(p => ({ ...p, ordem: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <button onClick={saveSection} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: NEON, border: 'none', borderRadius: 10, color: 'black', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                <Plus size={14} /> Criar Seção
              </button>
            </div>

            {/* Lista de seções */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {homeSections.map((s, idx) => (
                <div key={s.id} style={{ background: CARD, border: `1px solid ${s.ativo ? 'rgba(0,183,255,0.2)' : BORDER}`, borderRadius: 12, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, opacity: s.ativo ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => moveSection(s.id, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}><ChevronUp size={14} /></button>
                    <button onClick={() => moveSection(s.id, 'down')} disabled={idx === homeSections.length - 1} style={{ background: 'none', border: 'none', cursor: idx === homeSections.length - 1 ? 'not-allowed' : 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}><ChevronDown size={14} /></button>
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', minWidth: 24 }}>#{s.ordem}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.nome}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.tipo} {s.query && `• "${s.query}"`}</div>
                  </div>
                  <button onClick={() => updateSection(s.id, { ativo: !s.ativo })} style={{ padding: '6px 14px', background: s.ativo ? 'rgba(0,183,255,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${s.ativo ? 'rgba(0,183,255,0.3)' : BORDER}`, borderRadius: 8, color: s.ativo ? NEON : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                    {s.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button onClick={() => deleteSection(s.id)} style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICAÇÕES */}
        {tab === 'notificacoes' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Enviar Notificação</h1>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 32, maxWidth: 560 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                A notificação será enviada para todos os usuários ativos da plataforma.
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Título *</label>
                <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Ex: Novo conteúdo disponível!" maxLength={80} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 12, color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>Mensagem *</label>
                <textarea value={notifBody} onChange={e => setNotifBody(e.target.value)} placeholder="Conteúdo da notificação..." maxLength={300} rows={4} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 12, color: 'white', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <button onClick={sendNotification} disabled={sendingNotif || !notifTitle || !notifBody} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: NEON, border: 'none', borderRadius: 12, color: 'black', fontWeight: 700, cursor: sendingNotif ? 'wait' : 'pointer', fontSize: 14, opacity: (!notifTitle || !notifBody) ? 0.5 : 1 }}>
                <Bell size={16} /> {sendingNotif ? 'Enviando...' : 'Enviar para todos'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal edição */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}>
          <div style={{ background: '#0d1117', border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Editar {editTable === 'cinema' ? 'Filme' : 'Série'}</h3>
              <button onClick={() => setEditItem(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            {Object.entries(editItem).filter(([k]) => !['id','id_n','created_at'].includes(k)).map(([key, val]) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }}>{key}</label>
                <input value={val as string || ''} onChange={e => setEditItem((p: any) => ({ ...p, [key]: e.target.value }))} style={{ width: '100%', padding: '9px 14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 8, color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setEditItem(null)} style={{ flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, borderRadius: 10, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={saveEdit} style={{ flex: 1, padding: '11px', background: NEON, border: 'none', borderRadius: 10, color: 'black', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Save size={14} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
