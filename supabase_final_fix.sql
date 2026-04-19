-- ============================================
-- SQL FINAL - CORREÇÃO COMPLETA DO SCHEMA
-- ============================================

-- 1. Verificar e adicionar colunas na user_progress
-- ============================================
DO $$
BEGIN
    -- Adicionar current_time se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'current_time') THEN
        ALTER TABLE public.user_progress ADD COLUMN "current_time" INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna current_time adicionada à user_progress';
    END IF;

    -- Adicionar last_watched se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'last_watched') THEN
        ALTER TABLE public.user_progress ADD COLUMN last_watched TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Coluna last_watched adicionada à user_progress';
    END IF;
END $$;

-- 2. Verificar e adicionar colunas na watch_history
-- ============================================
DO $$
BEGIN
    -- Adicionar content_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'watch_history' 
                   AND column_name = 'content_type') THEN
        ALTER TABLE public.watch_history ADD COLUMN content_type TEXT;
        RAISE NOTICE 'Coluna content_type adicionada à watch_history';
    END IF;

    -- Adicionar current_time se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'watch_history' 
                   AND column_name = 'current_time') THEN
        ALTER TABLE public.watch_history ADD COLUMN "current_time" INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna current_time adicionada à watch_history';
    END IF;
END $$;

-- 3. Criar função register_device_session_simple
-- ============================================
DROP FUNCTION IF EXISTS public.register_device_session_simple(UUID, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.register_device_session_simple(
    p_user_id UUID,
    p_device_type TEXT,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_user_id_param UUID
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_devices (user_id, device_type, ip_address, user_agent, last_active)
    VALUES (p_user_id, p_device_type, p_ip_address, p_user_agent, NOW())
    ON CONFLICT (user_id, device_type, ip_address) 
    DO UPDATE SET last_active = NOW(), user_agent = p_user_agent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIM
-- ============================================
