-- Parte 2: XP, Levels e Streaks

-- 1. Tabela user_xp
CREATE TABLE IF NOT EXISTS public.user_xp (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    xp_watching INTEGER DEFAULT 0,
    xp_rating INTEGER DEFAULT 0,
    xp_social INTEGER DEFAULT 0,
    xp_achievements INTEGER DEFAULT 0,
    xp_special INTEGER DEFAULT 0,
    last_xp_at TIMESTAMP WITH TIME ZONE,
    active_multiplier DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_xp_total ON public.user_xp(total_xp DESC);

-- 2. Tabela user_levels
CREATE TABLE IF NOT EXISTS public.user_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1,
    current_title VARCHAR(100) DEFAULT 'Novato',
    xp_for_current_level INTEGER DEFAULT 0,
    xp_needed_for_next INTEGER DEFAULT 100,
    total_levels_achieved INTEGER DEFAULT 1,
    max_level_reached INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_levels_current ON public.user_levels(current_level DESC);

-- 3. Tabela user_streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    watch_streak_days INTEGER DEFAULT 0,
    watch_streak_max INTEGER DEFAULT 0,
    watch_streak_last_at TIMESTAMP WITH TIME ZONE,
    login_streak_days INTEGER DEFAULT 0,
    login_streak_max INTEGER DEFAULT 0,
    login_streak_last_at TIMESTAMP WITH TIME ZONE,
    rating_streak_days INTEGER DEFAULT 0,
    rating_streak_max INTEGER DEFAULT 0,
    rating_streak_last_at TIMESTAMP WITH TIME ZONE,
    streak_freezes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela xp_logs
CREATE TABLE IF NOT EXISTS public.xp_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,
    source_id UUID,
    xp_amount INTEGER NOT NULL,
    xp_multiplier DECIMAL(3,2) DEFAULT 1.00,
    xp_final INTEGER NOT NULL,
    level_at_moment INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON public.xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_logs_created ON public.xp_logs(created_at DESC);

-- 5. Tabela level_config
CREATE TABLE IF NOT EXISTS public.level_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    level INTEGER NOT NULL UNIQUE,
    title VARCHAR(100) NOT NULL,
    xp_required INTEGER NOT NULL,
    xp_for_level INTEGER NOT NULL,
    features_unlocked JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Triggers updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_xp_updated_at ON public.user_xp;
CREATE TRIGGER update_user_xp_updated_at BEFORE UPDATE ON public.user_xp FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_levels_updated_at ON public.user_levels;
CREATE TRIGGER update_user_levels_updated_at BEFORE UPDATE ON public.user_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON public.user_streaks;
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
