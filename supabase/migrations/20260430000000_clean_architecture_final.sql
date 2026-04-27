-- Migration: Arquitetura Final Limpa - Sistema sem Monetização
-- Data: 2026-04-30
-- Objetivo: Organizar sistema em 3 camadas (Auth, Experiência, Comportamento)

-- ============================================
-- 1. LIMPEZA DA TABELA PROFILES (Camada de Conta)
-- ============================================

-- Remover coluna 'approved' (não usamos mais sistema de aprovação)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS approved;

-- Remover coluna 'plan' se existir (sem monetização)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS plan;

-- Adicionar coluna 'updated_at' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada em profiles';
    END IF;
END $$;

-- Adicionar coluna 'display_name' se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN display_name TEXT;
        RAISE NOTICE 'Coluna display_name adicionada em profiles';
    END IF;
END $$;

-- Garantir que is_admin existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_admin adicionada em profiles';
    END IF;
END $$;

-- Garantir que avatar_customization existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_customization'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_customization JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna avatar_customization adicionada em profiles';
    END IF;
END $$;

-- ============================================
-- 2. GARANTIR ESTRUTURA DE USER_PROFILES (Experiência)
-- ============================================

-- Criar tabela user_profiles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name TEXT,
    bio TEXT DEFAULT '',
    avatar_customization JSONB DEFAULT '{}'::jsonb,
    points INTEGER DEFAULT 0,
    badges JSONB DEFAULT '[]'::jsonb,
    frames JSONB DEFAULT '[]'::jsonb,
    effects JSONB DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
);

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- RLS para user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user_profile" ON public.user_profiles;
CREATE POLICY "Users can view own user_profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_profile" ON public.user_profiles;
CREATE POLICY "Users can insert own user_profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_profile" ON public.user_profiles;
CREATE POLICY "Users can update own user_profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em user_profiles
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON public.user_profiles;
CREATE TRIGGER update_user_profiles_timestamp
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();

-- ============================================
-- 3. TRIGGER DE SINCRONIZAÇÃO AUTOMÁTICA
-- ============================================

-- Função para criar profiles e user_profiles automaticamente
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar registro em profiles (Camada de Conta)
    INSERT INTO public.profiles (id, email, is_active, is_admin, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        TRUE,           -- is_active
        FALSE,          -- is_admin (default)
        NOW(),          -- created_at
        NOW()           -- updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    -- Criar registro em user_profiles (Camada de Experiência)
    INSERT INTO public.user_profiles (user_id, name, bio, points, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        '',             -- bio
        0,              -- points
        NOW(),          -- created_at
        NOW()           -- updated_at
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar após INSERT em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile_on_signup();

-- ============================================
-- 4. CONFIGURAR USUÁRIO ADMIN
-- ============================================

-- Atualizar usuário admin (não altera senha, apenas marca como admin)
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email = 'mpaixaodesigner@gmail.com';

-- Verificar se o admin foi configurado
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE email = 'mpaixaodesigner@gmail.com' AND is_admin = TRUE
    ) INTO admin_exists;
    
    IF admin_exists THEN
        RAISE NOTICE '✅ Admin configurado: mpaixaodesigner@gmail.com';
    ELSE
        RAISE NOTICE '⚠️ Usuário admin não encontrado. Criar conta com este email primeiro.';
    END IF;
END $$;

-- ============================================
-- 5. GARANTIR TABELAS DE COMPORTAMENTO
-- ============================================

-- user_progress (Continue Assistindo)
-- Já criada em migration anterior

-- user_views (Histórico)
-- Já criada em migration anterior

-- favorites (Preferências)
-- Já criada em migration anterior

-- watchlist (Ver Depois)
-- Já criada em migration anterior

-- ============================================
-- 6. COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE public.profiles IS 'Camada de Conta: Dados de autenticação e identidade do usuário';
COMMENT ON TABLE public.user_profiles IS 'Camada de Experiência: Personalização, gamificação e perfil social';
COMMENT ON TABLE public.user_progress IS 'Camada de Comportamento: Continue assistindo';
COMMENT ON TABLE public.user_views IS 'Camada de Comportamento: Histórico de visualização';
COMMENT ON TABLE public.favorites IS 'Camada de Comportamento: Conteúdos favoritos';
COMMENT ON TABLE public.watchlist IS 'Camada de Comportamento: Lista para ver depois';

-- ============================================
-- 7. VALIDAÇÃO DE CONSISTÊNCIA
-- ============================================

DO $$
DECLARE
    profiles_count INTEGER;
    user_profiles_count INTEGER;
    auth_users_count INTEGER;
BEGIN
    -- Contar registros
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO user_profiles_count FROM public.user_profiles;
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VALIDAÇÃO DE CONSISTÊNCIA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'auth.users: %', auth_users_count;
    RAISE NOTICE 'profiles: %', profiles_count;
    RAISE NOTICE 'user_profiles: %', user_profiles_count;
    RAISE NOTICE '========================================';
    
    -- Verificar sincronização
    IF profiles_count = auth_users_count THEN
        RAISE NOTICE '✅ profiles sincronizado com auth.users';
    ELSE
        RAISE NOTICE '⚠️ profiles desincronizado: % vs %', profiles_count, auth_users_count;
    END IF;
    
    IF user_profiles_count = auth_users_count THEN
        RAISE NOTICE '✅ user_profiles sincronizado com auth.users';
    ELSE
        RAISE NOTICE '⚠️ user_profiles desincronizado: % vs %', user_profiles_count, auth_users_count;
    END IF;
END $$;

-- ============================================
-- RESUMO DA ARQUITETURA FINAL
-- ============================================

-- CAMADA 1: AUTHENTICATION / CONTA (profiles + auth.users)
-- - id, email, display_name, avatar_url, avatar_customization, is_active, is_admin, created_at, updated_at

-- CAMADA 2: EXPERIÊNCIA DO USUÁRIO (user_profiles)
-- - name, bio, avatar_customization, points, badges, frames, effects

-- CAMADA 3: COMPORTAMENTO (tabelas de tracking)
-- - user_progress, user_views, favorites, watchlist

-- SISTEMA: Sem monetização, sem planos, sem aprovação manual
-- ADMIN: mpaixaodesigner@gmail.com (is_admin = TRUE)
