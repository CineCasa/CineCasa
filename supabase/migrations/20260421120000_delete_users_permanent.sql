-- MIGRAÇÃO PARA APAGAR TODOS OS USUÁRIOS EXCETO ADMIN (PERMANENTE)
-- ⚠️ AVISO: Esta operação NÃO PODE SER DESFEITA!
-- Execute no Supabase SQL Editor

-- =====================================================
-- ETAPA 1: Mostrar usuários que serão mantidos (admins)
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
-- ETAPA 2: Apagar dados relacionados primeiro (evitar erros de FK)
-- =====================================================

-- Apagar favoritos de usuários não-admin
DELETE FROM public.favorites
WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);

-- Apagar watch_history de usuários não-admin  
DELETE FROM public.watch_history
WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);

-- Apagar user_progress de usuários não-admin
DELETE FROM public.user_progress
WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);

-- Apagar watch_progress de usuários não-admin
DELETE FROM public.watch_progress
WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);

-- Apagar device_sessions de usuários não-admin
DELETE FROM public.device_sessions
WHERE user_id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);

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
    COUNT(*) as total_usuarios,
    (SELECT COUNT(*) FROM public.profiles WHERE is_admin = TRUE) as admins,
    (SELECT COUNT(*) FROM public.profiles WHERE is_admin = FALSE OR is_admin IS NULL) as outros
FROM auth.users;
