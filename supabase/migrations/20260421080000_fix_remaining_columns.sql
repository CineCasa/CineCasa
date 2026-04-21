-- MIGRAÇÃO DEFINITIVA - Corrigir todas as colunas restantes
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. DEVICE_SESSIONS - Renomear last_active para last_activity
-- =====================================================
DO $$
BEGIN
    -- Verificar se existe a coluna last_active (nome antigo)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_sessions' AND column_name = 'last_active'
    ) THEN
        -- Renomear para last_activity
        ALTER TABLE public.device_sessions RENAME COLUMN last_active TO last_activity;
        RAISE NOTICE 'Coluna last_active renomeada para last_activity';
    END IF;
    
    -- Verificar se existe a coluna last_activity (nome correto)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_sessions' AND column_name = 'last_activity'
    ) THEN
        -- Criar a coluna se não existir
        ALTER TABLE public.device_sessions ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT now();
        RAISE NOTICE 'Coluna last_activity adicionada';
    END IF;
END $$;

-- =====================================================
-- 2. WATCH_HISTORY - Adicionar colunas faltantes
-- =====================================================
DO $$
BEGIN
    -- titulo
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'titulo'
    ) THEN
        ALTER TABLE public.watch_history ADD COLUMN titulo TEXT;
        RAISE NOTICE 'Coluna titulo adicionada em watch_history';
    END IF;
    
    -- episode_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'episode_id'
    ) THEN
        ALTER TABLE public.watch_history ADD COLUMN episode_id INTEGER;
        RAISE NOTICE 'Coluna episode_id adicionada em watch_history';
    END IF;
    
    -- season_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'season_number'
    ) THEN
        ALTER TABLE public.watch_history ADD COLUMN season_number INTEGER;
        RAISE NOTICE 'Coluna season_number adicionada em watch_history';
    END IF;
    
    -- episode_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'episode_number'
    ) THEN
        ALTER TABLE public.watch_history ADD COLUMN episode_number INTEGER;
        RAISE NOTICE 'Coluna episode_number adicionada em watch_history';
    END IF;
END $$;

-- =====================================================
-- 3. USER_PROGRESS - Adicionar colunas faltantes
-- =====================================================
DO $$
BEGIN
    -- episode_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'episode_id'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN episode_id INTEGER;
        RAISE NOTICE 'Coluna episode_id adicionada em user_progress';
    END IF;
    
    -- season_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'season_number'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN season_number INTEGER;
        RAISE NOTICE 'Coluna season_number adicionada em user_progress';
    END IF;
    
    -- episode_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'episode_number'
    ) THEN
        ALTER TABLE public.user_progress ADD COLUMN episode_number INTEGER;
        RAISE NOTICE 'Coluna episode_number adicionada em user_progress';
    END IF;
END $$;

-- =====================================================
-- 4. WATCH_PROGRESS - Adicionar colunas faltantes
-- =====================================================
DO $$
BEGIN
    -- user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_progress' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.watch_progress ADD COLUMN user_id UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Coluna user_id adicionada em watch_progress';
    END IF;
    
    -- episode_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_progress' AND column_name = 'episode_id'
    ) THEN
        ALTER TABLE public.watch_progress ADD COLUMN episode_id INTEGER;
        RAISE NOTICE 'Coluna episode_id adicionada em watch_progress';
    END IF;
    
    -- season_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_progress' AND column_name = 'season_number'
    ) THEN
        ALTER TABLE public.watch_progress ADD COLUMN season_number INTEGER;
        RAISE NOTICE 'Coluna season_number adicionada em watch_progress';
    END IF;
    
    -- episode_number
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_progress' AND column_name = 'episode_number'
    ) THEN
        ALTER TABLE public.watch_progress ADD COLUMN episode_number INTEGER;
        RAISE NOTICE 'Coluna episode_number adicionada em watch_progress';
    END IF;
END $$;

-- Mensagem de sucesso
SELECT 'Migração concluída! Todas as colunas foram corrigidas.' as status;
