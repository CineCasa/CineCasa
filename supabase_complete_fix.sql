-- ============================================
-- CORREÇÃO COMPLETA DO SCHEMA SUPABASE
-- ============================================

-- 1. FUNÇÃO: register_device_session_simple
-- ============================================
CREATE OR REPLACE FUNCTION public.register_device_session_simple(
    p_user_id UUID,
    p_device_type TEXT,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_user_id_param UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_devices (
        user_id,
        device_type,
        ip_address,
        user_agent,
        last_active,
        created_at
    ) VALUES (
        p_user_id,
        p_device_type,
        p_ip_address,
        p_user_agent,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, device_type, ip_address) 
    DO UPDATE SET 
        last_active = NOW(),
        user_agent = p_user_agent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TABELA: user_progress (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
    current_time INTEGER DEFAULT 0,
    progress REAL DEFAULT 0,
    duration INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- RLS para user_progress
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own progress"
    ON public.user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own progress"
    ON public.user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own progress"
    ON public.user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. TABELA: watch_history (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, content_id)
);

-- RLS para watch_history
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own history"
    ON public.watch_history FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own history"
    ON public.watch_history FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY IF NOT EXISTS "Users can update their own history"
    ON public.watch_history FOR UPDATE
    USING (auth.uid() = profile_id);

-- 4. TABELA: user_views (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- RLS para user_views
ALTER TABLE public.user_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own views"
    ON public.user_views FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own views"
    ON public.user_views FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- 5. TABELA: watch_progress (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.watch_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
    progress REAL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- RLS para watch_progress
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own watch progress"
    ON public.watch_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own watch progress"
    ON public.watch_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own watch progress"
    ON public.watch_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- 6. TABELA: user_devices (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type TEXT,
    ip_address TEXT,
    user_agent TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_type, ip_address)
);

-- RLS para user_devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own devices"
    ON public.user_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own devices"
    ON public.user_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content ON public.user_progress(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_watch_history_profile ON public.watch_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_views_user ON public.user_views(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_progress_user ON public.watch_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices(user_id);

-- ============================================
-- FIM DAS CORREÇÕES
-- ============================================
