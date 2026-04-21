-- CORRIGIR COLUNA USER_AGENT EM DEVICE_SESSIONS
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. ADICIONAR COLUNA USER_AGENT SE NÃO EXISTIR
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_sessions' 
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE public.device_sessions ADD COLUMN user_agent TEXT;
        RAISE NOTICE 'Coluna user_agent adicionada em device_sessions';
    ELSE
        RAISE NOTICE 'Coluna user_agent já existe em device_sessions';
    END IF;
END $$;

-- =====================================================
-- 2. VERIFICAR ESTRUTURA DA TABELA
-- =====================================================
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'device_sessions'
ORDER BY ordinal_position;
