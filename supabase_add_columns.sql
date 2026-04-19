-- ============================================
-- ADICIONAR COLUNAS FALTANTES
-- ============================================

-- Adicionar coluna current_time na user_progress (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_progress' AND column_name = 'current_time') THEN
        ALTER TABLE public.user_progress ADD COLUMN "current_time" INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna current_time adicionada';
    ELSE
        RAISE NOTICE 'Coluna current_time já existe';
    END IF;
END $$;

-- Adicionar coluna content_type na watch_history (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'watch_history' AND column_name = 'content_type') THEN
        ALTER TABLE public.watch_history ADD COLUMN content_type TEXT;
        RAISE NOTICE 'Coluna content_type adicionada';
    ELSE
        RAISE NOTICE 'Coluna content_type já existe';
    END IF;
END $$;

-- Verificar se a função existe, se não, criar
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
$$ LANGUAGE plpgsql;

-- ============================================
-- FIM
-- ============================================
