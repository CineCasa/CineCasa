-- MIGRAÇÃO PARA APAGAR TODOS OS USUÁRIOS EXCETO O ADMIN
-- ⚠️ CUIDADO: Esta operação não pode ser desfeita!
-- Execute no Supabase SQL Editor

-- =====================================================
-- OPÇÃO 1: DESATIVAR USUÁRIOS (RECOMENDADO - reversível)
-- =====================================================
-- Desativa todos os usuários exceto admins em vez de apagar

UPDATE public.profiles
SET is_active = FALSE
WHERE is_admin = FALSE OR is_admin IS NULL;

-- =====================================================
-- OPÇÃO 2: APAGAR USUÁRIOS DEFINITIVAMENTE (PERIGOSO)
-- =====================================================
-- Descomente as linhas abaixo se quiser APAGAR definitivamente
-- ⚠️ Isso também apagará todos os dados relacionados (favoritos, progresso, etc)

-- DELETE FROM auth.users
-- WHERE id NOT IN (
--     SELECT id FROM public.profiles WHERE is_admin = TRUE
-- );

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Mostra quantos usuários restam ativos
SELECT 
    'Usuários ativos:' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_admin = TRUE) as admins,
    COUNT(*) FILTER (WHERE is_admin = FALSE OR is_admin IS NULL) as nao_admins
FROM public.profiles
WHERE is_active = TRUE;
