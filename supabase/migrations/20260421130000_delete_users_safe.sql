-- MIGRAÇÃO PARA APAGAR TODOS OS USUÁRIOS EXCETO ADMIN (PERMANENTE) - VERSÃO SEGURA
-- ⚠️ AVISO: Esta operação NÃO PODE SER DESFEITA!
-- Execute no Supabase SQL Editor

-- =====================================================
-- ETAPA 1: Verificar se existe admin antes de prosseguir
-- =====================================================
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM public.profiles 
    WHERE is_admin = TRUE;
    
    RAISE NOTICE 'Admins encontrados: %', admin_count;
    
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'Nenhum admin encontrado! Operação abortada para segurança.';
    END IF;
END $$;

-- =====================================================
-- ETAPA 2: Apagar dados relacionados (verificando colunas primeiro)
-- =====================================================

-- Apagar favoritos (se existir user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'favorites' AND column_name = 'user_id'
    ) THEN
        DELETE FROM public.favorites
        WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);
        RAISE NOTICE 'Favorites limpo';
    END IF;
END $$;

-- Apagar watch_history (se existir user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_history' AND column_name = 'user_id'
    ) THEN
        DELETE FROM public.watch_history
        WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);
        RAISE NOTICE 'Watch_history limpo';
    END IF;
END $$;

-- Apagar user_progress (se existir user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'user_id'
    ) THEN
        DELETE FROM public.user_progress
        WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);
        RAISE NOTICE 'User_progress limpo';
    END IF;
END $$;

-- Apagar watch_progress (se existir user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'watch_progress' AND column_name = 'user_id'
    ) THEN
        DELETE FROM public.watch_progress
        WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);
        RAISE NOTICE 'Watch_progress limpo';
    END IF;
END $$;

-- Apagar device_sessions (se existir user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_sessions' AND column_name = 'user_id'
    ) THEN
        DELETE FROM public.device_sessions
        WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);
        RAISE NOTICE 'Device_sessions limpo';
    END IF;
END $$;

-- =====================================================
-- ETAPA 3: Apagar perfis de usuários não-admin
-- =====================================================
DELETE FROM public.profiles
WHERE is_admin = FALSE OR is_admin IS NULL;

-- =====================================================
-- ETAPA 4: Apagar usuários da tabela auth.users
-- =====================================================
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
SELECT 
    'Usuários restantes:' as info,
    COUNT(*) as total_usuarios
FROM auth.users;
