-- CORRIGIR CONSTRAINT DE DEVICE_SESSIONS
-- Execute no Supabase SQL Editor

-- ==========================================
-- 1. REMOVER CONSTRAINT PROBLEMÁTICA
-- ==========================================

-- Dropar a constraint (não o índice diretamente)
ALTER TABLE public.device_sessions 
DROP CONSTRAINT IF EXISTS device_sessions_user_id_device_fingerprint_key;

-- ==========================================
-- 2. CRIAR NOVO ÍNDICE COM HASH
-- ==========================================

-- Criar índice hash para user_id (mais eficiente para UUIDs)
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id_hash 
ON public.device_sessions USING hash (user_id);

-- Criar índice simples para device_fingerprint
CREATE INDEX IF NOT EXISTS idx_device_sessions_fingerprint 
ON public.device_sessions (device_fingerprint) 
WHERE device_fingerprint IS NOT NULL;

-- ==========================================
-- 3. VERIFICAR
-- ==========================================

SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'device_sessions';
