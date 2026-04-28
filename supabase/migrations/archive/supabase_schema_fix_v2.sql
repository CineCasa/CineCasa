-- ============================================
-- SUPABASE SCHEMA FIX V2 - CineCasa
-- Correções adicionais após execução inicial
-- ============================================

-- 1. FUNÇÃO RPC: register_device_session_simple
CREATE OR REPLACE FUNCTION public.register_device_session_simple(
    p_device_name TEXT,
    p_device_type TEXT,
    p_device_id TEXT,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_user_id UUID
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
        p_user_id,
        p_device_name,
        p_device_type,
        p_device_id,
        p_ip_address,
        true,
        now()
    )
    ON CONFLICT (user_id, device_id) 
    DO UPDATE SET 
        last_active = now(),
        is_current = true,
        location = p_ip_address
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$;

-- Permissão para executar função
GRANT EXECUTE ON FUNCTION public.register_device_session_simple(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ============================================

-- 2. CORREÇÃO: Política RLS para notifications - Permitir INSERT
-- Remover políticas existentes e recriar
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

CREATE POLICY "Allow insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Ou mais restritivo - apenas para o próprio usuário:
-- CREATE POLICY "Users can insert own notifications" 
-- ON public.notifications 
-- FOR INSERT 
-- WITH CHECK (auth.uid() = user_id);

-- ============================================

-- 3. CORREÇÃO: Garantir que user_profiles aceite consultas por user_id apenas
-- Remover constraint UNIQUE complicada se existir
-- Adicionar índice para busca eficiente
CREATE INDEX IF NOT EXISTS idx_user_profiles_lookup 
ON public.user_profiles(user_id, id);

-- ============================================

-- 4. FUNÇÃO AUXILIAR: Criar perfil se não existir
CREATE OR REPLACE FUNCTION public.get_or_create_profile(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile JSONB;
BEGIN
    -- Tentar buscar perfil existente
    SELECT to_jsonb(user_profiles.*) INTO v_profile
    FROM public.user_profiles
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- Se não existe, criar um novo
    IF v_profile IS NULL THEN
        INSERT INTO public.user_profiles (user_id, name, plan)
        VALUES (p_user_id, 'Usuário', 'free')
        RETURNING to_jsonb(user_profiles.*) INTO v_profile;
    END IF;
    
    RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_profile(UUID) TO authenticated;

-- ============================================
-- FIM DO SCRIPT V2
-- ============================================
