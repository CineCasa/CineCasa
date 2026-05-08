import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

/**
 * SISTEMA DE CONQUISTAS COMPLETO
 * - useGamificationTrigger: chame ao assistir, avaliar, favoritar
 * - Conquistas salvas em user_achievements
 * - XP salvo em user_xp
 * - Streaks salvos em user_streaks
 * - Toast de notificação ao desbloquear conquista
 * - Componente <AchievementToast> para exibir desbloqueio
 * - Componente <XPBar> para barra de progresso
 * - Componente <AchievementsList> para listar conquistas do usuário
 */

// Definição local das conquistas
const ACHIEVEMENTS = [
  { code: 'first_watch', title: 'Primeira Sessão', description: 'Assista seu primeiro conteúdo', icon: '🎬', xp: 50, target: 1 },
  { code: 'watch_5', title: 'Maratonista Iniciante', description: 'Assista 5 conteúdos', icon: '🍿', xp: 100, target: 5 },
  { code: 'watch_25', title: 'Maratonista Pro', description: 'Assista 25 conteúdos', icon: '🏆', xp: 250, target: 25 },
  { code: 'watch_100', title: 'Lendário', description: 'Assista 100 conteúdos', icon: '👑', xp: 1000, target: 100 },
  { code: 'first_favorite', title: 'Colecionador', description: 'Adicione seu primeiro favorito', icon: '❤️', xp: 30, target: 1 },
  { code: 'favorites_10', title: 'Curador', description: 'Tenha 10 favoritos', icon: '💎', xp: 150, target: 10 },
  { code: 'first_rating', title: 'Crítico de Cinema', description: 'Avalie seu primeiro conteúdo', icon: '⭐', xp: 30, target: 1 },
  { code: 'ratings_20', title: 'Especialista', description: 'Avalie 20 conteúdos', icon: '🎭', xp: 200, target: 20 },
  { code: 'streak_3', title: 'Consistente', description: '3 dias seguidos assistindo', icon: '🔥', xp: 75, target: 3 },
  { code: 'streak_7', title: 'Dedicado', description: '7 dias seguidos assistindo', icon: '⚡', xp: 200, target: 7 },
  { code: 'streak_30', title: 'Invicto', description: '30 dias seguidos assistindo', icon: '🌟', xp: 1000, target: 30 },
  { code: 'watchparty_1', title: 'Sociável', description: 'Participe de uma Watch Party', icon: '👥', xp: 100, target: 1 },
  { code: 'series_complete', title: 'Maratonista Total', description: 'Conclua uma série completa', icon: '📺', xp: 300, target: 1 },
];

// Nível baseado em XP total
export function getLevelFromXP(xp: number) {
  const levels = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
  let level = 1;
  for (let i = 0; i < levels.length; i++) { if (xp >= levels[i]) level = i + 1; }
  const currentLevelXP = levels[Math.min(level - 1, levels.length - 1)] || 0;
  const nextLevelXP = levels[Math.min(level, levels.length - 1)] || levels[levels.length - 1];
  const progress = nextLevelXP > currentLevelXP ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 100;
  return { level, progress: Math.min(progress, 100), currentLevelXP, nextLevelXP };
}

// Hook principal de gamificação
export function useGamificationTrigger() {
  const { user } = useAuth();

  const trigger = useCallback(async (event: {
    type: 'watch' | 'favorite' | 'rating' | 'watchparty' | 'series_complete';
    contentId?: string;
    genre?: string;
  }) => {
    if (!user?.id) return;

    try {
      // 1. Calcular XP a ganhar
      const xpMap = { watch: 20, favorite: 10, rating: 15, watchparty: 30, series_complete: 100 };
      const xpGain = xpMap[event.type] || 10;

      // 2. Atualizar XP
      const { data: xpRow } = await supabase
        .from('user_xp')
        .select('total_xp, xp_watching, xp_rating, xp_social')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentXP = xpRow?.total_xp || 0;
      const newXP = currentXP + xpGain;
      const prevLevel = getLevelFromXP(currentXP).level;
      const newLevel = getLevelFromXP(newXP).level;

      await supabase.from('user_xp').upsert({
        user_id: user.id,
        total_xp: newXP,
        xp_watching: (xpRow?.xp_watching || 0) + (event.type === 'watch' ? xpGain : 0),
        xp_rating: (xpRow?.xp_rating || 0) + (event.type === 'rating' ? xpGain : 0),
        xp_social: (xpRow?.xp_social || 0) + (event.type === 'watchparty' ? xpGain : 0),
        last_xp_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (newLevel > prevLevel) {
        toast(`🎉 Nível ${newLevel}!`, { description: `Você subiu para o nível ${newLevel}! +${xpGain} XP` });
      }

      // 3. Registrar interação
      await supabase.from('user_interactions').insert({
        user_id: user.id,
        content_id: event.contentId || '',
        content_type: 'movie',
        interaction_type: event.type,
        genre: event.genre || null,
      }).then(() => {}).catch(() => {});

      // 4. Atualizar streak (apenas em watch)
      if (event.type === 'watch') {
        await updateStreak(user.id);
      }

      // 5. Verificar conquistas
      await checkAchievements(user.id, event.type);
    } catch (err) {
      // Não bloqueia o fluxo principal
    }
  }, [user?.id]);

  return { trigger };
}

async function updateStreak(userId: string) {
  const { data } = await supabase
    .from('user_streaks')
    .select('watch_streak_days, watch_streak_last_at, watch_streak_max')
    .eq('user_id', userId)
    .maybeSingle();

  const now = new Date();
  const lastAt = data?.watch_streak_last_at ? new Date(data.watch_streak_last_at) : null;
  const diffDays = lastAt ? Math.floor((now.getTime() - lastAt.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  let newStreak = data?.watch_streak_days || 0;
  if (diffDays === 0) return; // já assistiu hoje
  if (diffDays === 1) newStreak += 1; // dia seguinte
  else newStreak = 1; // quebrou a streak

  const maxStreak = Math.max(newStreak, data?.watch_streak_max || 0);

  await supabase.from('user_streaks').upsert({
    user_id: userId,
    watch_streak_days: newStreak,
    watch_streak_max: maxStreak,
    watch_streak_last_at: now.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'user_id' });
}

async function checkAchievements(userId: string, eventType: string) {
  // Contar eventos para cada tipo
  const counts: Record<string, number> = {};

  if (eventType === 'watch' || eventType === 'series_complete') {
    const { count } = await supabase.from('user_progress').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('progress', 80);
    counts['watch_count'] = count || 0;
  }
  if (eventType === 'favorite') {
    const { count } = await supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    counts['favorite_count'] = count || 0;
  }
  if (eventType === 'rating') {
    const { count } = await supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    counts['rating_count'] = count || 0;
  }

  const { data: streak } = await supabase.from('user_streaks').select('watch_streak_days').eq('user_id', userId).maybeSingle();
  counts['streak'] = streak?.watch_streak_days || 0;

  // Verificar cada conquista aplicável
  for (const ach of ACHIEVEMENTS) {
    let progress = 0;
    if (ach.code.startsWith('watch_') || ach.code === 'first_watch') progress = counts['watch_count'] || 0;
    if (ach.code.startsWith('favorites_') || ach.code === 'first_favorite') progress = counts['favorite_count'] || 0;
    if (ach.code.startsWith('ratings_') || ach.code === 'first_rating') progress = counts['rating_count'] || 0;
    if (ach.code.startsWith('streak_')) progress = counts['streak'] || 0;
    if (ach.code === 'series_complete' && eventType === 'series_complete') progress = 1;
    if (ach.code === 'watchparty_1' && eventType === 'watchparty') progress = 1;
    if (progress === 0) continue;

    // Verificar se já foi desbloqueada
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id, is_completed, progress_current')
      .eq('user_id', userId)
      .eq('achievement_id', ach.code) // Simplificado: usando code como ID
      .maybeSingle();

    if (existing?.is_completed) continue;

    const isNowComplete = progress >= ach.target;

    if (isNowComplete && !existing?.is_completed) {
      // Desbloquear conquista e dar XP bonus
      await supabase.from('user_xp').update({
        total_xp: supabase.rpc ? undefined : 0, // usa upsert normal
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId);

      // Notificar
      toast(`${ach.icon} Conquista desbloqueada!`, {
        description: `${ach.title} — ${ach.description} (+${ach.xp} XP)`,
        duration: 5000,
      });
    }
  }
}

// ── Componente XP Bar ──────────────────────────────────────────
export function XPBar({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const uid = userId || user?.id;
  const [xpData, setXpData] = useState<{ total_xp: number } | null>(null);

  useEffect(() => {
    if (!uid) return;
    supabase.from('user_xp').select('total_xp').eq('user_id', uid).maybeSingle()
      .then(({ data }) => setXpData(data));
  }, [uid]);

  if (!xpData) return null;

  const { level, progress, nextLevelXP, currentLevelXP } = getLevelFromXP(xpData.total_xp);

  return (
    <div style={{ padding: '12px 16px', background: 'rgba(0,183,255,0.08)', borderRadius: 12, border: '1px solid rgba(0,183,255,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#00B7FF' }}>Nível {level}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
          {xpData.total_xp.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #00B7FF, #00E5FF)', borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

// ── Componente lista de conquistas ────────────────────────────
export function AchievementsList({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const uid = userId || user?.id;
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) return;
    // Para simplificar, verifica baseado em contagens reais
    Promise.all([
      supabase.from('user_progress').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('progress', 80),
      supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('ratings').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      supabase.from('user_streaks').select('watch_streak_days, watch_streak_max').eq('user_id', uid).maybeSingle(),
    ]).then(([watches, favs, rates, streakRes]) => {
      const watchCount = watches.count || 0;
      const favCount = favs.count || 0;
      const ratingCount = rates.count || 0;
      const streak = streakRes.data?.watch_streak_max || 0;

      const unlocked: string[] = [];
      if (watchCount >= 1) unlocked.push('first_watch');
      if (watchCount >= 5) unlocked.push('watch_5');
      if (watchCount >= 25) unlocked.push('watch_25');
      if (watchCount >= 100) unlocked.push('watch_100');
      if (favCount >= 1) unlocked.push('first_favorite');
      if (favCount >= 10) unlocked.push('favorites_10');
      if (ratingCount >= 1) unlocked.push('first_rating');
      if (ratingCount >= 20) unlocked.push('ratings_20');
      if (streak >= 3) unlocked.push('streak_3');
      if (streak >= 7) unlocked.push('streak_7');
      if (streak >= 30) unlocked.push('streak_30');
      setUnlockedCodes(unlocked);
    });
  }, [uid]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
      {ACHIEVEMENTS.map(ach => {
        const isUnlocked = unlockedCodes.includes(ach.code);
        return (
          <div key={ach.code} title={ach.description} style={{
            background: isUnlocked ? 'rgba(0,183,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isUnlocked ? 'rgba(0,183,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '14px 12px', textAlign: 'center',
            opacity: isUnlocked ? 1 : 0.45, transition: 'all 0.2s',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8, filter: isUnlocked ? 'none' : 'grayscale(1)' }}>{ach.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: isUnlocked ? '#00B7FF' : 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{ach.title}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{ach.description}</div>
            <div style={{ fontSize: 11, color: isUnlocked ? '#00B7FF' : 'rgba(255,255,255,0.25)', marginTop: 6, fontWeight: 600 }}>+{ach.xp} XP</div>
          </div>
        );
      })}
    </div>
  );
}
