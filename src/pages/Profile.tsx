import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Image as ImageIcon, Edit3, LogOut, ChevronRight,
  Heart, MonitorPlay, Clock, Trophy, Bell, Shield, Settings,
  Star, TrendingUp, Zap, Crown, Check, X
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { XPBar, AchievementsList, getLevelFromXP } from '@/components/GamificationSystem';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const NEON = '#00d4ff';
const BG = '#000000';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'perfil' | 'conquistas' | 'atividade'>('perfil');
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ movies: 0, series: 0, minutes: 0, favorites: 0 });
  const [xpData, setXpData] = useState<any>(null);
  const [streakData, setStreakData] = useState<any>(null);
  const [activity, setActivity] = useState<{ month: string; hours: number }[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edição de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => { if (user?.id) loadAll(); }, [user?.id]);

  const loadAll = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profRes, xpRes, streakRes, progressRes, favRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_xp').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('user_progress').select('content_id, content_type, progress, duration, updated_at, title').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setProfile(profRes.data);
      setXpData(xpRes.data);
      setStreakData(streakRes.data);
      setEditName(profRes.data?.name || user.email?.split('@')[0] || '');
      setEditBio(profRes.data?.bio || '');

      const prog = progressRes.data || [];
      const movies = prog.filter(p => p.content_type === 'movie' && p.progress >= 80).length;
      const series = prog.filter(p => p.content_type === 'series' && p.progress >= 80).length;
      const minutes = prog.reduce((acc, p) => acc + Math.round(((p.duration || 0) / 60) * Math.min(p.progress || 0, 100) / 100), 0);
      setStats({ movies, series, minutes, favorites: favRes.count || 0 });
      setRecentItems(prog.slice(0, 6));

      // Atividade mensal
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const now = new Date();
      const map: Record<string, number> = {};
      prog.forEach(p => {
        if (!p.updated_at) return;
        const m = months[new Date(p.updated_at).getMonth()];
        map[m] = (map[m] || 0) + ((p.duration || 0) / 3600);
      });
      const act = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = months[d.getMonth()];
        act.push({ month: label, hours: Math.round(map[label] || 0) });
      }
      setActivity(act);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Upload de foto ──────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Foto deve ter no máximo 5MB'); return; }

    setUploadingPhoto(true);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      // Upload para Supabase Storage
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}/profile.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

      await supabase.from('user_profiles').upsert({
        user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setProfile((p: any) => ({ ...p, avatar_url: publicUrl }));
      toast.success('Foto atualizada! 📸');
    } catch (err: any) {
      // Fallback: salvar como base64 se storage não estiver configurado
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        await supabase.from('user_profiles').upsert({
          user_id: user.id, avatar_url: base64, updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        setProfile((p: any) => ({ ...p, avatar_url: base64 }));
        toast.success('Foto atualizada!');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  }, [user?.id]);

  const saveProfile = async () => {
    if (!user?.id || !editName.trim()) return;
    const { error } = await supabase.from('user_profiles').upsert({
      user_id: user.id, name: editName.trim(), bio: editBio.trim(), updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) { toast.error('Erro ao salvar'); return; }
    setProfile((p: any) => ({ ...p, name: editName, bio: editBio }));
    setIsEditing(false);
    toast.success('Perfil atualizado!');
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const level = xpData ? getLevelFromXP(xpData.total_xp) : null;
  const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = previewUrl || profile?.avatar_url;
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';

  const TABS = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'conquistas', label: 'Conquistas' },
    { key: 'atividade', label: 'Atividade' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, border: `3px solid ${NEON}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: BG, color: 'white', paddingBottom: 80 }}>
      {/* ── Header banner + avatar ── */}
      <div style={{ position: 'relative', height: 200, background: `linear-gradient(135deg, #0a0a1a 0%, #0d1a2e 50%, #071020 100%)`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${NEON}20 0%, transparent 60%)` }} />
        {/* Bokeh decorativo */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: `${NEON}08`, width: 40 + i * 30, height: 40 + i * 30, top: `${10 + i * 12}%`, left: `${5 + i * 15}%`, filter: 'blur(20px)' }} />
        ))}

        {/* Avatar */}
        <div style={{ position: 'absolute', bottom: -50, left: 24, zIndex: 10 }}>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', border: `3px solid ${NEON}`, overflow: 'hidden', background: '#1a1a2e', boxShadow: `0 0 20px ${NEON}40` }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: NEON, background: `${NEON}15` }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              {uploadingPhoto && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  <div style={{ width: 24, height: 24, border: `2px solid ${NEON}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              )}
            </div>

            {/* Botões de câmera */}
            <div style={{ position: 'absolute', bottom: 0, right: 0, display: 'flex', gap: 4 }}>
              {/* Câmera (capture) */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{ width: 30, height: 30, borderRadius: '50%', background: NEON, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                title="Tirar foto"
              >
                <Camera size={14} color="black" />
              </button>
              {/* Galeria */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ width: 30, height: 30, borderRadius: '50%', background: '#1a1a2e', border: `1px solid ${NEON}50`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
                title="Escolher da galeria"
              >
                <ImageIcon size={12} color={NEON} />
              </button>
            </div>

            {/* Inputs ocultos */}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      {/* ── Info do usuário ── */}
      <div style={{ padding: '60px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            {isEditing ? (
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40} style={{ fontSize: 22, fontWeight: 700, background: 'rgba(255,255,255,0.08)', border: `1px solid ${NEON}50`, borderRadius: 8, padding: '4px 12px', color: 'white', outline: 'none', marginBottom: 4 }} />
            ) : (
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{displayName}</h1>
            )}
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0' }}>Membro desde {memberSince}</p>
          </div>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setIsEditing(false)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}><X size={16} /></button>
              <button onClick={saveProfile} style={{ width: 36, height: 36, borderRadius: '50%', background: NEON, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={16} color="black" /></button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: `1px solid rgba(255,255,255,0.15)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)' }}>
              <Edit3 size={16} />
            </button>
          )}
        </div>

        {/* Bio */}
        {isEditing ? (
          <textarea value={editBio} onChange={e => setEditBio(e.target.value)} maxLength={160} placeholder="Escreva uma bio..." rows={2} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13, resize: 'none', outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
        ) : profile?.bio ? (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>{profile.bio}</p>
        ) : null}

        {/* Badges nível + streak */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {level && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: `${NEON}20`, color: NEON, border: `1px solid ${NEON}40` }}>
              <Zap size={11} style={{ display: 'inline', marginRight: 4 }} />Nível {level.level}
            </span>
          )}
          {xpData?.total_xp > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(250,204,21,0.15)', color: '#facc15', border: '1px solid rgba(250,204,21,0.3)' }}>
              {xpData.total_xp.toLocaleString()} XP
            </span>
          )}
          {streakData?.watch_streak_days > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
              🔥 {streakData.watch_streak_days} dias seguidos
            </span>
          )}
          {profile?.plan && profile.plan !== 'free' && (
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Crown size={11} style={{ display: 'inline', marginRight: 4 }} />{profile.plan}
            </span>
          )}
        </div>

        {/* XP Bar */}
        {user?.id && <div style={{ marginBottom: 20 }}><XPBar userId={user.id} /></div>}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Filmes', value: stats.movies, icon: '🎬', color: '#3b82f6' },
            { label: 'Séries', value: stats.series, icon: '📺', color: '#8b5cf6' },
            { label: 'Horas', value: Math.round(stats.minutes / 60), icon: '⏱️', color: NEON },
            { label: 'Favoritos', value: stats.favorites, icon: '❤️', color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ flex: 1, padding: '12px 8px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t.key ? NEON : 'transparent'}`, color: activeTab === t.key ? NEON : 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Perfil ── */}
        {activeTab === 'perfil' && (
          <div>
            {/* Últimos assistidos */}
            {recentItems.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: NEON }}>Assistidos recentemente</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentItems.map((item, i) => (
                    <div key={i} onClick={() => navigate(`/details/${item.content_type === 'movie' ? 'cinema' : 'series'}/${item.content_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, cursor: 'pointer' }}>
                      <span style={{ fontSize: 18 }}>{item.content_type === 'movie' ? '🎬' : '📺'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Sem título'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                            <div style={{ width: `${item.progress}%`, height: '100%', background: NEON, borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.progress}%</span>
                        </div>
                      </div>
                      <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Menu */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
              {[
                { icon: <Heart size={18} />, label: 'Meus Favoritos', path: '/favorites', color: '#ef4444' },
                { icon: <Bell size={18} />, label: 'Notificações', path: '/notifications', color: NEON },
                { icon: <Shield size={18} />, label: 'Dispositivos', path: '/devices', color: '#f59e0b' },
                { icon: <Settings size={18} />, label: 'Configurações', path: '/settings/notifications', color: 'rgba(255,255,255,0.5)' },
                { icon: <Shield size={18} />, label: 'Termos e Privacidade', path: '/termos', color: 'rgba(255,255,255,0.5)' },
              ].map((item, i) => (
                <button key={i} onClick={() => navigate(item.path)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', color: item.color }}>
                  {item.icon}
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 500, color: 'white' }}>{item.label}</span>
                  <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
                </button>
              ))}
            </div>

            <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              <LogOut size={16} /> Sair da conta
            </button>
          </div>
        )}

        {/* ── Tab: Conquistas ── */}
        {activeTab === 'conquistas' && user?.id && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: NEON }}>Suas Conquistas</h3>
            <AchievementsList userId={user.id} />
          </div>
        )}

        {/* ── Tab: Atividade ── */}
        {activeTab === 'atividade' && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: NEON }}>Atividade — últimos 6 meses</h3>
            {activity.some(a => a.hours > 0) ? (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={activity}>
                    <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0a0a0f', border: `1px solid ${NEON}30`, borderRadius: 8 }} labelStyle={{ color: 'white' }} formatter={(v: number) => [`${v}h`, 'Horas']} />
                    <Line type="monotone" dataKey="hours" stroke={NEON} strokeWidth={2} dot={{ fill: NEON, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)' }}>
                <TrendingUp size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>Nenhuma atividade registrada ainda</p>
              </div>
            )}
            {/* Streaks */}
            {streakData && (
              <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>🔥</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f97316' }}>{streakData.watch_streak_days}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Dias seguidos</div>
                </div>
                <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28 }}>🏆</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#facc15' }}>{streakData.watch_streak_max}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Recorde pessoal</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
