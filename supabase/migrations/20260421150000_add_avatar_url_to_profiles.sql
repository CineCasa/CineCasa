-- MIGRAÇÃO PARA ADICIONAR COLUNA AVATAR_URL À TABELA PROFILES
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. ADICIONAR COLUNA AVATAR_URL
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Coluna avatar_url adicionada em profiles';
    END IF;
END $$;

-- =====================================================
-- 2. CRIAR BUCKET DE STORAGE PARA AVATARES (se não existir)
-- =====================================================
-- Nota: Buckets devem ser criados via interface do Supabase ou API
-- Este é um placeholder - o bucket deve ser criado manualmente

-- =====================================================
-- 3. MENSAGEM DE SUCESSO
-- =====================================================
SELECT 'Coluna avatar_url configurada com sucesso!' as status;
