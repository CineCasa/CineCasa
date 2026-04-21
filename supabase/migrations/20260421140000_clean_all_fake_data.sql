-- MIGRAÇÃO PARA LIMPAR TODOS OS DADOS FAKE - DEIXAR SISTEMA PRONTO PARA PRODUÇÃO
-- ⚠️ AVISO: Esta operação apaga dados de usuários mas mantém conteúdo (filmes/séries)
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. LIMPAR TODOS OS DADOS DE USUÁRIOS (exceto admin)
-- =====================================================

-- Limpar favoritos
TRUNCATE TABLE public.favorites;

-- Limpar histórico de visualização
TRUNCATE TABLE public.watch_history;

-- Limpar progresso do usuário
TRUNCATE TABLE public.user_progress;

-- Limpar watch_progress (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'watch_progress') THEN
        EXECUTE 'TRUNCATE TABLE public.watch_progress';
    END IF;
END $$;

-- Limpar sessões de dispositivos
TRUNCATE TABLE public.device_sessions;

-- =====================================================
-- 2. LIMPAR PERFIS (exceto admin)
-- =====================================================
DELETE FROM public.profiles WHERE is_admin = FALSE OR is_admin IS NULL;

-- =====================================================
-- 3. LIMPAR USUÁRIOS DO AUTH (exceto admin)
-- =====================================================
DELETE FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles WHERE is_admin = TRUE);

-- =====================================================
-- 4. LIMPAR LOGS E DADOS AUXILIARES
-- =====================================================

-- Limpar activation_logs (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activation_logs') THEN
        EXECUTE 'TRUNCATE TABLE public.activation_logs';
    END IF;
END $$;

-- Limpar user_approvals (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_approvals') THEN
        EXECUTE 'TRUNCATE TABLE public.user_approvals';
    END IF;
END $$;

-- =====================================================
-- 5. RESETAR SEQUENCES (se houver)
-- =====================================================
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_record.sequence_name);
    END LOOP;
END $$;

-- =====================================================
-- 6. VERIFICAÇÃO FINAL - Sistema limpo
-- =====================================================
SELECT 
    'SISTEMA LIMPO - Status:' as status,
    (SELECT COUNT(*) FROM auth.users) as total_usuarios,
    (SELECT COUNT(*) FROM public.profiles WHERE is_admin = TRUE) as admins,
    (SELECT COUNT(*) FROM public.favorites) as favorites,
    (SELECT COUNT(*) FROM public.watch_history) as watch_history,
    (SELECT COUNT(*) FROM public.user_progress) as user_progress,
    (SELECT COUNT(*) FROM public.device_sessions) as device_sessions,
    (SELECT COUNT(*) FROM public.cinema) as filmes,  -- Conteúdo real mantido
    (SELECT COUNT(*) FROM public.series) as series;  -- Conteúdo real mantido
