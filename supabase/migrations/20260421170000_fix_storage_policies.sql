-- MIGRAÇÃO PARA CORRIGIR POLÍTICAS DE STORAGE (AVATAR)
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. POLÍTICAS PARA BUCKET PROFILES (AVATARES)
-- =====================================================

-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Política para permitir upload (apenas próprios arquivos)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir leitura pública
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Política para permitir atualização (apenas próprios arquivos)
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para permitir exclusão (apenas próprios arquivos)
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 2. VERIFICAÇÃO
-- =====================================================
SELECT 
    'Políticas de storage configuradas com sucesso!' as status;
