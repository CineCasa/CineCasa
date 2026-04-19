-- ============================================
-- QUICK FIX - Correções rápidas
-- ============================================

-- 1. CORRIGIR FUNÇÃO: register_device_session_simple
-- A função existe mas com nomes de parâmetros diferentes
DROP FUNCTION IF EXISTS public.register_device_session_simple(TEXT, TEXT, TEXT, TEXT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.register_device_session_simple(
    device_name TEXT,
    device_type TEXT,
    device_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    user_id_param UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO public.user_devices (
        user_id,
        device_name,
        device_type,
        device_id,
        location,
        is_current,
        last_active
    ) VALUES (
        user_id_param,
        device_name,
        device_type,
        device_id,
        ip_address,
        true,
        now()
    )
    ON CONFLICT (user_id, device_id) 
    DO UPDATE SET 
        last_active = now(),
        is_current = true,
        location = ip_address
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$;

-- Permissão para executar função
GRANT EXECUTE ON FUNCTION public.register_device_session_simple(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_device_session_simple(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO anon;

-- ============================================

-- 2. CORREÇÃO: Adicionar constraint UNIQUE em user_devices se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'user_devices_user_device_unique'
    ) THEN
        CREATE UNIQUE INDEX user_devices_user_device_unique 
        ON public.user_devices(user_id, device_id);
    END IF;
END $$;

-- ============================================
-- FIM
-- ============================================
