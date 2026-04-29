-- Parte 3: RLS Policies e Segurança

-- Avatar items: leitura pública
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view avatar items" ON public.avatar_items;
CREATE POLICY "Public can view avatar items" ON public.avatar_items
    FOR SELECT TO public USING (true);

-- User avatar items: apenas próprio usuário
ALTER TABLE public.user_avatar_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own items" ON public.user_avatar_items;
CREATE POLICY "Users view own items" ON public.user_avatar_items
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- User equipped avatar: apenas próprio usuário
ALTER TABLE public.user_equipped_avatar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own equipped" ON public.user_equipped_avatar;
CREATE POLICY "Users manage own equipped" ON public.user_equipped_avatar
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- Achievements: leitura pública
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view achievements" ON public.achievements;
CREATE POLICY "Public can view achievements" ON public.achievements
    FOR SELECT TO public USING (true);

-- User achievements: apenas próprio usuário
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own achievements" ON public.user_achievements;
CREATE POLICY "Users view own achievements" ON public.user_achievements
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- User XP: apenas próprio usuário
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own XP" ON public.user_xp;
CREATE POLICY "Users view own XP" ON public.user_xp
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- User levels: leitura pública (para ranking), atualização sistema
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view levels" ON public.user_levels;
CREATE POLICY "Public view levels" ON public.user_levels
    FOR SELECT TO public USING (true);

-- User streaks: apenas próprio usuário
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own streaks" ON public.user_streaks;
CREATE POLICY "Users view own streaks" ON public.user_streaks
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- XP logs: apenas próprio usuário
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own XP logs" ON public.xp_logs;
CREATE POLICY "Users view own XP logs" ON public.xp_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Level config: leitura pública
ALTER TABLE public.level_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view level config" ON public.level_config;
CREATE POLICY "Public view level config" ON public.level_config
    FOR SELECT TO public USING (true);
