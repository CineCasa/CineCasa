-- ============================================
-- CRIAR FUNÇÃO register_device_session_simple APENAS
-- ============================================

-- Remover função existente se houver
DROP FUNCTION IF EXISTS public.register_device_session_simple(UUID, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.register_device_session_simple(UUID, TEXT, TEXT, TEXT);

-- Criar tabela user_devices se não existir
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

-- Criar a função
CREATE OR REPLACE FUNCTION public.register_device_session_simple(
    p_user_id UUID,
    p_device_type TEXT,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar se a função foi criada
SELECT 
    routine_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'register_device_session_simple';
