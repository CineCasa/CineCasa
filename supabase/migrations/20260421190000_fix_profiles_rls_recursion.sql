-- CORRIGIR RECURSÃO INFINITA NAS POLÍTICAS RLS DE PROFILES
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- =====================================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- =====================================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
        RAISE NOTICE 'Política % removida', policy_record.policyname;
    END LOOP;
END $$;

-- =====================================================
-- 3. RECRIAR POLÍTICAS SIMPLES SEM RECURSÃO
-- =====================================================

-- Política 1: Permitir SELECT para usuários autenticados verem seus próprios perfis
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Política 2: Permitir INSERT apenas se o ID corresponder ao usuário autenticado
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Política 3: Permitir UPDATE apenas para o próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política 4: Permitir DELETE apenas para o próprio perfil
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Política 5: Permitir SELECT para usuários anônimos (se necessário para signup)
CREATE POLICY "Allow select for anon"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- =====================================================
-- 4. REATIVAR RLS
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';
