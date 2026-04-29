-- Migration fix: Correções para erros de colunas e funções
-- Data: 2025-06-28

-- Fix 1: Adicionar coluna deleted_at na tabela ratings se não existir
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Fix 2: Adicionar coluna username na tabela profiles se não existir
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

-- Fix 3: Adicionar coluna deleted_at na tabela user_devices se não existir
ALTER TABLE public.user_devices ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Fix 5: Dropar função get_user_devices se existir para recriar com assinatura correta
DROP FUNCTION IF EXISTS public.get_user_devices(uuid);

-- Fix 6: Recriar função get_user_devices com assinatura correta
CREATE OR REPLACE FUNCTION public.get_user_devices(p_user_id uuid)
RETURNS TABLE (
  id bigint,
  user_id uuid,
  device_id text,
  device_name text,
  device_type text,
  location text,
  last_active timestamptz,
  is_current boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  ip_address text,
  user_agent text,
  os text,
  browser text,
  screen_resolution text,
  timezone text,
  language text,
  fingerprint text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ud.id,
    ud.user_id,
    ud.device_id,
    ud.device_name,
    ud.device_type,
    ud.location,
    ud.last_active,
    ud.is_current,
    ud.is_active,
    ud.created_at,
    ud.updated_at,
    ud.ip_address,
    ud.user_agent,
    ud.os,
    ud.browser,
    ud.screen_resolution,
    ud.timezone,
    ud.language,
    ud.fingerprint
  FROM public.user_devices ud
  WHERE ud.user_id = p_user_id
    AND ud.is_active = true
    AND ud.deleted_at IS NULL
  ORDER BY ud.last_active DESC;
$$;

-- Fix 7: Corrigir funções que referenciam p.username
-- Verificar se existe função que usa p.username e corrigir
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    p.email,
    COALESCE(p.username, p.full_name, 'Usuário') as username,
    p.full_name,
    p.avatar_url,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = p_user_id;
$$;
