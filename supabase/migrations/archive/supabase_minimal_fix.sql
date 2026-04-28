-- ============================================
-- SQL MÍNIMO PARA CORREÇÃO DO SCHEMA
-- ============================================

-- Tabela user_devices
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    device_type TEXT,
    ip_address TEXT,
    user_agent TEXT,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_type, ip_address)
);

-- Tabela user_progress
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
    "current_time" INTEGER DEFAULT 0,
    progress REAL DEFAULT 0,
    duration INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- Tabela watch_history
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

-- Tabela user_views
CREATE TABLE IF NOT EXISTS public.user_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    watched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- Tabela watch_progress
CREATE TABLE IF NOT EXISTS public.watch_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
    progress REAL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- Função segura
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION public.register_device_session_simple(
        p_user_id UUID,
        p_device_type TEXT,
        p_ip_address TEXT,
        p_user_agent TEXT,
        p_user_id_param UUID
    ) RETURNS VOID AS $func$
    BEGIN
        INSERT INTO public.user_devices (
            user_id, device_type, ip_address, user_agent, last_active, created_at
        ) VALUES (
            p_user_id, p_device_type, p_ip_address, p_user_agent, NOW(), NOW()
        )
        ON CONFLICT (user_id, device_type, ip_address) 
        DO UPDATE SET last_active = NOW(), user_agent = p_user_agent;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Função pode já existir ou erro: %', SQLERRM;
END $$;
