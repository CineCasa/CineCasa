-- MIGRAÇÃO PARA CORRIGIR CADASTRO DE NOVOS USUÁRIOS
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. GARANTIR QUE A TABELA PROFILES EXISTE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    approved BOOLEAN DEFAULT FALSE,
    plan TEXT DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 2. HABILITAR RLS NA TABELA PROFILES
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CRIAR POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Política para permitir que usuários vejam seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Política para permitir que usuários atualizem seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Política para permitir que admins vejam todos os perfis
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Política para permitir que admins atualizem qualquer perfil
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Política para permitir insert no próprio perfil (necessário para o trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- =====================================================
-- 4. CRIAR FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir novo perfil quando usuário é criado
    INSERT INTO public.profiles (id, email, is_admin, is_active, approved, plan, created_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        FALSE,      -- is_admin
        TRUE,       -- is_active
        FALSE,      -- approved (aguardando aprovação)
        'none',     -- plan
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Evitar erro se perfil já existir
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. CRIAR TRIGGER PARA NOVOS USUÁRIOS
-- =====================================================
-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. CRIAR PERFIL PARA USUÁRIOS EXISTENTES SEM PERFIL
-- =====================================================
INSERT INTO public.profiles (id, email, is_admin, is_active, approved, plan, created_at)
SELECT 
    au.id,
    au.email,
    FALSE,
    TRUE,
    FALSE,
    'none',
    COALESCE(au.created_at, NOW())
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- 7. CRIAR ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON public.profiles(approved) WHERE approved = FALSE;

-- Mensagem de sucesso
SELECT 'Configuração de cadastro de usuários concluída!' as status;
