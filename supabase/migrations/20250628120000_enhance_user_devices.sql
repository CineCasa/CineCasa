-- Migration: Melhorias Enterprise na tabela user_devices
-- Data: 2025-06-28
-- Descrição: Adiciona campos enterprise para gestão profissional de dispositivos

-- Adicionar colunas enterprise à tabela existente
ALTER TABLE public.user_devices 
  ADD COLUMN IF NOT EXISTS ip_address inet NULL,
  ADD COLUMN IF NOT EXISTS user_agent text NULL,
  ADD COLUMN IF NOT EXISTS os varchar(100) NULL,
  ADD COLUMN IF NOT EXISTS browser varchar(100) NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS screen_resolution varchar(50) NULL,
  ADD COLUMN IF NOT EXISTS timezone varchar(100) NULL,
  ADD COLUMN IF NOT EXISTS language varchar(10) NULL,
  ADD COLUMN IF NOT EXISTS fingerprint varchar(255) NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_devices_fingerprint 
  ON public.user_devices(fingerprint) 
  WHERE fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_devices_is_active 
  ON public.user_devices(is_current, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_devices_last_active 
  ON public.user_devices(last_active DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_devices_updated_at ON public.user_devices;

CREATE TRIGGER user_devices_updated_at
  BEFORE UPDATE ON public.user_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_devices_updated_at();

-- Função RPC: Registrar ou atualizar dispositivo (UPSERT)
CREATE OR REPLACE FUNCTION register_device(
  p_user_id uuid,
  p_device_id varchar(255),
  p_device_name varchar(255),
  p_device_type varchar(50),
  p_location varchar(255) DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_os varchar(100) DEFAULT NULL,
  p_browser varchar(100) DEFAULT NULL,
  p_screen_resolution varchar(50) DEFAULT NULL,
  p_timezone varchar(100) DEFAULT NULL,
  p_language varchar(10) DEFAULT NULL,
  p_fingerprint varchar(255) DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_device_uuid uuid;
BEGIN
  -- Tentar atualizar dispositivo existente
  UPDATE public.user_devices
  SET 
    device_name = COALESCE(p_device_name, device_name),
    location = COALESCE(p_location, location),
    last_active = NOW(),
    updated_at = NOW(),
    is_current = true,
    is_active = true,
    ip_address = COALESCE(p_ip_address, ip_address),
    user_agent = COALESCE(p_user_agent, user_agent),
    os = COALESCE(p_os, os),
    browser = COALESCE(p_browser, browser),
    screen_resolution = COALESCE(p_screen_resolution, screen_resolution),
    timezone = COALESCE(p_timezone, timezone),
    language = COALESCE(p_language, language),
    fingerprint = COALESCE(p_fingerprint, fingerprint)
  WHERE user_id = p_user_id 
    AND device_id = p_device_id
  RETURNING id INTO v_device_uuid;
  
  -- Se não encontrou, inserir novo
  IF v_device_uuid IS NULL THEN
    INSERT INTO public.user_devices (
      user_id, device_id, device_name, device_type, location,
      ip_address, user_agent, os, browser, screen_resolution,
      timezone, language, fingerprint, is_current, is_active,
      last_active, created_at, updated_at
    ) VALUES (
      p_user_id, p_device_id, p_device_name, p_device_type, p_location,
      p_ip_address, p_user_agent, p_os, p_browser, p_screen_resolution,
      p_timezone, p_language, p_fingerprint, true, true,
      NOW(), NOW(), NOW()
    )
    RETURNING id INTO v_device_uuid;
  END IF;
  
  -- Marcar outros dispositivos do usuário como não correntes
  UPDATE public.user_devices
  SET is_current = false
  WHERE user_id = p_user_id 
    AND device_id != p_device_id;
  
  RETURN v_device_uuid;
END;
$$;

-- Função RPC: Atualizar última atividade do dispositivo
CREATE OR REPLACE FUNCTION update_device_activity(
  p_device_id varchar(255),
  p_user_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.user_devices
  SET 
    last_active = NOW(),
    updated_at = NOW()
  WHERE device_id = p_device_id
    AND (p_user_id IS NULL OR user_id = p_user_id);
    
  RETURN FOUND;
END;
$$;

-- Função RPC: Buscar dispositivos do usuário
CREATE OR REPLACE FUNCTION get_user_devices(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  device_id varchar(255),
  device_name varchar(255),
  device_type varchar(50),
  location varchar(255),
  last_active timestamptz,
  is_current boolean,
  is_active boolean,
  created_at timestamptz,
  ip_address inet,
  os varchar(100),
  browser varchar(100),
  screen_resolution varchar(50),
  timezone varchar(100)
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ud.id,
    ud.device_id,
    ud.device_name,
    ud.device_type,
    ud.location,
    ud.last_active,
    ud.is_current,
    ud.is_active,
    ud.created_at,
    ud.ip_address,
    ud.os,
    ud.browser,
    ud.screen_resolution,
    ud.timezone
  FROM public.user_devices ud
  WHERE ud.user_id = p_user_id
    AND ud.is_active = true
  ORDER BY ud.is_current DESC, ud.last_active DESC;
$$;

-- Função RPC: Remover dispositivo (soft delete)
CREATE OR REPLACE FUNCTION remove_device(
  p_device_id varchar(255),
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_was_current boolean;
BEGIN
  -- Verificar se é o dispositivo atual
  SELECT is_current INTO v_was_current
  FROM public.user_devices
  WHERE device_id = p_device_id AND user_id = p_user_id;
  
  -- Soft delete
  UPDATE public.user_devices
  SET 
    is_active = false,
    is_current = false,
    updated_at = NOW()
  WHERE device_id = p_device_id
    AND user_id = p_user_id;
    
  -- Se era o dispositivo atual, marcar o mais recente como atual
  IF v_was_current THEN
    UPDATE public.user_devices
    SET is_current = true
    WHERE user_id = p_user_id
      AND is_active = true
      AND device_id != p_device_id
    ORDER BY last_active DESC
    LIMIT 1;
  END IF;
    
  RETURN FOUND;
END;
$$;

-- Função RPC: Marcar dispositivo como atual
CREATE OR REPLACE FUNCTION mark_current_device(
  p_device_id varchar(255),
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Desmarcar todos os outros
  UPDATE public.user_devices
  SET is_current = false
  WHERE user_id = p_user_id;
  
  -- Marcar o especificado
  UPDATE public.user_devices
  SET 
    is_current = true,
    last_active = NOW(),
    updated_at = NOW()
  WHERE device_id = p_device_id
    AND user_id = p_user_id
    AND is_active = true;
    
  RETURN FOUND;
END;
$$;

-- Função RPC: Fazer logout em outros dispositivos
CREATE OR REPLACE FUNCTION logout_other_devices(
  p_current_device_id varchar(255),
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.user_devices
  SET 
    is_active = false,
    is_current = false,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND device_id != p_current_device_id
    AND is_active = true;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Função RPC: Contar dispositivos ativos do usuário
CREATE OR REPLACE FUNCTION count_active_devices(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.user_devices
  WHERE user_id = p_user_id
    AND is_active = true;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.user_devices IS 'Tabela de dispositivos dos usuários com rastreamento de sessão';
COMMENT ON COLUMN public.user_devices.device_id IS 'ID único do dispositivo (fingerprint persistente)';
COMMENT ON COLUMN public.user_devices.fingerprint IS 'Hash fingerprint do dispositivo para detecção';
COMMENT ON COLUMN public.user_devices.is_current IS 'Indica se é o dispositivo ativo na sessão atual';
COMMENT ON COLUMN public.user_devices.is_active IS 'Soft delete - false quando dispositivo é removido';
