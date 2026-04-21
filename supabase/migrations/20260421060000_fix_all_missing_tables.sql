-- =====================================================
-- MIGRAÇÃO CONSOLIDADA - Correção de todas as tabelas
-- Data: 2026-04-21
-- =====================================================

-- 1. CRIAR TABELA device_sessions (dropar e recriar se incompleta)
-- Primeiro dropar políticas se existirem
DROP POLICY IF EXISTS "Users can view their own devices" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can insert their own devices" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can update their own devices" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can delete their own devices" ON public.device_sessions;

-- Dropar tabela se existir para garantir estrutura correta
DROP TABLE IF EXISTS public.device_sessions;

-- Criar tabela com todas as colunas
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

-- Políticas RLS para device_sessions
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
    ON public.device_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices"
    ON public.device_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
    ON public.device_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
    ON public.device_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- 2. ADICIONAR COLUNAS A watch_history (se não existirem)
DO $$
BEGIN
    -- Adicionar episode_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'episode_id'
    ) THEN
        ALTER TABLE public.watch_history ADD COLUMN episode_id INTEGER;
        RAISE NOTICE 'Coluna episode_id adicionada em watch_history';
    END IF;

    -- Verificar se content_id é INTEGER ou BIGINT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'content_id' 
        AND data_type = 'bigint'
    ) THEN
        -- Já está correto como bigint
        RAISE NOTICE 'content_id já é bigint em watch_history';
    END IF;
END $$;

-- 3. VERIFICAR/CORRIGIR watch_progress
DO $$
BEGIN
    -- Verificar se tabela watch_progress existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'watch_progress'
    ) THEN
        -- Adicionar user_id se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'watch_progress' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE public.watch_progress ADD COLUMN user_id UUID REFERENCES auth.users(id);
            RAISE NOTICE 'Coluna user_id adicionada em watch_progress';
        END IF;

        -- Adicionar episode_id se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'watch_progress' AND column_name = 'episode_id'
        ) THEN
            ALTER TABLE public.watch_progress ADD COLUMN episode_id INTEGER;
            RAISE NOTICE 'Coluna episode_id adicionada em watch_progress';
        END IF;

        -- Adicionar season_number se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'watch_progress' AND column_name = 'season_number'
        ) THEN
            ALTER TABLE public.watch_progress ADD COLUMN season_number INTEGER;
            RAISE NOTICE 'Coluna season_number adicionada em watch_progress';
        END IF;

        -- Adicionar episode_number se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'watch_progress' AND column_name = 'episode_number'
        ) THEN
            ALTER TABLE public.watch_progress ADD COLUMN episode_number INTEGER;
            RAISE NOTICE 'Coluna episode_number adicionada em watch_progress';
        END IF;
    ELSE
        RAISE NOTICE 'Tabela watch_progress não existe - precisa ser criada';
    END IF;
END $$;

-- 4. VERIFICAR/CRIAR user_progress se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_progress'
    ) THEN
        CREATE TABLE public.user_progress (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            content_id BIGINT NOT NULL,
            content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
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
        
        -- Remover políticas existentes antes de criar
        DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
        DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
        DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
        DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;
        
        CREATE POLICY "Users can view own progress" 
            ON public.user_progress FOR SELECT 
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own progress" 
            ON public.user_progress FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own progress" 
            ON public.user_progress FOR UPDATE 
            USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete own progress" 
            ON public.user_progress FOR DELETE 
            USING (auth.uid() = user_id);
            
        RAISE NOTICE 'Tabela user_progress criada';
    ELSE
        RAISE NOTICE 'Tabela user_progress já existe';
    END IF;
END $$;

-- 5. ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_episode_id ON public.watch_history(episode_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content_id ON public.user_progress(content_id);

-- 6. Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em device_sessions
DROP TRIGGER IF EXISTS update_device_sessions_updated_at ON public.device_sessions;
CREATE TRIGGER update_device_sessions_updated_at
    BEFORE UPDATE ON public.device_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger em user_progress (se existir)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_progress'
    ) THEN
        DROP TRIGGER IF EXISTS update_user_progress_updated_at ON public.user_progress;
        CREATE TRIGGER update_user_progress_updated_at
            BEFORE UPDATE ON public.user_progress
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Mensagem final
SELECT 'Migração concluída! Execute \dt para ver as tabelas.' as status;
