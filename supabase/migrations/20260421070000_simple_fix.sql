-- MIGRAÇÃO SIMPLIFICADA - Execute parte por parte
-- Parte 1: Criar device_sessions
DROP TABLE IF EXISTS public.device_sessions;

CREATE TABLE public.device_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    ip_address TEXT,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, device_fingerprint)
);

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "view_devices" ON public.device_sessions;
DROP POLICY IF EXISTS "insert_devices" ON public.device_sessions;
DROP POLICY IF EXISTS "update_devices" ON public.device_sessions;
DROP POLICY IF EXISTS "delete_devices" ON public.device_sessions;

CREATE POLICY "view_devices" ON public.device_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_devices" ON public.device_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_devices" ON public.device_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_devices" ON public.device_sessions FOR DELETE USING (auth.uid() = user_id);

-- Parte 2: Corrigir watch_history (adicionar episode_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'episode_id'
    ) THEN
        ALTER TABLE public.watch_history ADD COLUMN episode_id INTEGER;
    END IF;
END $$;

-- Parte 3: Criar user_progress se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress'
    ) THEN
        CREATE TABLE public.user_progress (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            content_id BIGINT NOT NULL,
            content_type TEXT NOT NULL,
            time_position BIGINT DEFAULT 0,
            duration BIGINT DEFAULT 0,
            percent_watched INTEGER DEFAULT 0,
            is_completed BOOLEAN DEFAULT false,
            season_number INTEGER,
            episode_number INTEGER,
            episode_id INTEGER,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(user_id, content_id, content_type)
        );
        
        ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "view_progress" ON public.user_progress;
        DROP POLICY IF EXISTS "insert_progress" ON public.user_progress;
        DROP POLICY IF EXISTS "update_progress" ON public.user_progress;
        DROP POLICY IF EXISTS "delete_progress" ON public.user_progress;
        
        CREATE POLICY "view_progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "insert_progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "update_progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "delete_progress" ON public.user_progress FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON public.device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content ON public.user_progress(content_id);
