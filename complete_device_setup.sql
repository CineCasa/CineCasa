-- ====================================================================
-- SISTEMA COMPLETO DE CONTROLE DE ACESSO - CINECASA
-- ====================================================================
-- Execute este script completo no Supabase SQL Editor

-- 1. Criar tabela de registros de acesso por dispositivo
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  session_token TEXT UNIQUE
);

-- 2. Tabela de limites de plano
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan TEXT PRIMARY KEY,
  max_devices INTEGER NOT NULL,
  max_ip_addresses INTEGER NOT NULL
);

-- 3. Inserir limites dos planos
INSERT INTO public.plan_limits (plan, max_devices, max_ip_addresses) 
VALUES 
  ('basic', 1, 1),
  ('pro', 2, 2)
ON CONFLICT (plan) DO NOTHING;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_fingerprint ON public.device_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_sessions_ip_address ON public.device_sessions(ip_address);
CREATE INDEX IF NOT EXISTS idx_device_sessions_active ON public.device_sessions(is_active);

-- 5. Habilitar RLS
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de segurança para device_sessions
CREATE POLICY "Users can view own device sessions" 
ON public.device_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device sessions" 
ON public.device_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device sessions" 
ON public.device_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own device sessions" 
ON public.device_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Políticas para plan_limits (somente admin)
CREATE POLICY "Admins can view plan limits" 
ON public.plan_limits FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 8. Função para gerar fingerprint do dispositivo
CREATE OR REPLACE FUNCTION public.generate_device_fingerprint(user_agent TEXT, ip_address TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN md5(user_agent || ip_address || extract(epoch from now())::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Função para verificar limite de dispositivos
CREATE OR REPLACE FUNCTION public.check_device_limit(user_id_param UUID, new_fingerprint TEXT, new_ip TEXT)
RETURNS TABLE(can_access BOOLEAN, message TEXT) AS $$
DECLARE
  user_plan TEXT;
  max_devices INTEGER;
  max_ips INTEGER;
  current_devices INTEGER;
  current_ips INTEGER;
BEGIN
  -- Obter plano do usuário
  SELECT plan INTO user_plan 
  FROM public.profiles 
  WHERE id = user_id_param;
  
  -- Obter limites do plano
  SELECT max_devices, max_ip_addresses INTO max_devices, max_ips
  FROM public.plan_limits 
  WHERE plan = user_plan;
  
  -- Contar dispositivos ativos
  SELECT COUNT(*) INTO current_devices
  FROM public.device_sessions 
  WHERE user_id = user_id_param AND is_active = true;
  
  -- Contar IPs únicos
  SELECT COUNT(DISTINCT ip_address) INTO current_ips
  FROM public.device_sessions 
  WHERE user_id = user_id_param AND is_active = true;
  
  -- Verificar limites
  IF current_devices >= max_devices THEN
    RETURN QUERY SELECT false, 'Limite de dispositivos atingido. Plano ' || user_plan || ' permite máximo ' || max_devices || ' dispositivo(s).';
    RETURN;
  END IF;
  
  IF current_ips >= max_ips THEN
    RETURN QUERY SELECT false, 'Limite de endereços IP atingido. Plano ' || user_plan || ' permite máximo ' || max_ips || ' endereço(s) IP.';
    RETURN;
  END IF;
  
  -- Verificar se fingerprint já existe
  IF EXISTS(SELECT 1 FROM public.device_sessions WHERE user_id = user_id_param AND device_fingerprint = new_fingerprint AND is_active = true) THEN
    RETURN QUERY SELECT true, 'Dispositivo já registrado.';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Acesso permitido.';
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Função para registrar nova sessão
CREATE OR REPLACE FUNCTION public.register_device_session(user_id_param UUID, device_fingerprint TEXT, ip_address TEXT, user_agent TEXT)
RETURNS TABLE(session_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
  access_check RECORD;
  new_session_id UUID;
BEGIN
  -- Verificar limites
  SELECT * INTO access_check FROM public.check_device_limit(user_id_param, device_fingerprint, ip_address);
  
  IF NOT access_check.can_access THEN
    RETURN QUERY SELECT NULL::UUID, false, access_check.message;
    RETURN;
  END IF;
  
  -- Criar nova sessão ou atualizar existente
  BEGIN
    INSERT INTO public.device_sessions (user_id, device_fingerprint, ip_address, user_agent, session_token)
    VALUES (user_id_param, device_fingerprint, ip_address, user_agent, md5(random()::text || clock_timestamp()::text))
    RETURNING id INTO new_session_id;
    
    RETURN QUERY SELECT new_session_id, true, 'Sessão registrada com sucesso.';
  EXCEPTION 
    WHEN unique_violation THEN
      -- Atualizar sessão existente
      UPDATE public.device_sessions 
      SET last_active = timezone('utc'::text, now()), is_active = true
      WHERE user_id = user_id_param AND device_fingerprint = device_fingerprint
      RETURNING id INTO new_session_id;
      
      RETURN QUERY SELECT new_session_id, true, 'Sessão atualizada com sucesso.';
  END;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Função para limpar sessões inativas
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.device_sessions 
  SET is_active = false 
  WHERE last_active < timezone('utc'::text, now()) - interval '30 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Funções auxiliares simplificadas
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id_param UUID)
RETURNS TABLE(id UUID, email TEXT, plan TEXT, is_active BOOLEAN, is_admin BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.plan, p.is_active, p.is_admin
  FROM public.profiles p
  WHERE p.id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.count_active_devices(user_id_param UUID)
RETURNS TABLE(id UUID, device_fingerprint TEXT, ip_address TEXT, user_agent TEXT, created_at TIMESTAMP WITH TIME ZONE, last_active TIMESTAMP WITH TIME ZONE, is_active BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT ds.id, ds.device_fingerprint, ds.ip_address, ds.user_agent, ds.created_at, ds.last_active, ds.is_active
  FROM public.device_sessions ds
  WHERE ds.user_id = user_id_param AND ds.is_active = true
  ORDER BY ds.last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.register_device_session_simple(user_id_param UUID, device_fingerprint TEXT, ip_address TEXT, user_agent TEXT)
RETURNS TABLE(id UUID, created_at TIMESTAMP WITH TIME ZONE, last_active TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  new_session_id UUID;
  existing_session RECORD;
BEGIN
  -- Verificar se já existe sessão para este dispositivo
  SELECT * INTO existing_session
  FROM public.device_sessions
  WHERE user_id = user_id_param AND device_fingerprint = device_fingerprint AND is_active = true;
  
  IF found THEN
    -- Atualizar sessão existente
    UPDATE public.device_sessions
    SET last_active = timezone('utc'::text, now())
    WHERE id = existing_session.id;
    
    RETURN QUERY SELECT existing_session.id, existing_session.created_at, timezone('utc'::text, now());
  ELSE
    -- Criar nova sessão
    INSERT INTO public.device_sessions (user_id, device_fingerprint, ip_address, user_agent, session_token)
    VALUES (user_id_param, device_fingerprint, ip_address, user_agent, md5(random()::text || clock_timestamp()::text))
    RETURNING id, created_at, last_active;
    
    RETURN QUERY SELECT id, created_at, last_active FROM public.device_sessions WHERE id = new_session_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_devices(user_id_param UUID)
RETURNS TABLE(id UUID, device_fingerprint TEXT, ip_address TEXT, user_agent TEXT, created_at TIMESTAMP WITH TIME ZONE, last_active TIMESTAMP WITH TIME ZONE, is_active BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT ds.id, ds.device_fingerprint, ds.ip_address, ds.user_agent, ds.created_at, ds.last_active, ds.is_active
  FROM public.device_sessions ds
  WHERE ds.user_id = user_id_param AND ds.is_active = true
  ORDER BY ds.last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.deactivate_device(session_id_param UUID, user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.device_sessions
  SET is_active = false
  WHERE id = session_id_param AND user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_device_activity(session_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.device_sessions
  SET last_active = timezone('utc'::text, now())
  WHERE id = session_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_device_limit_simple(user_id_param UUID, max_devices INTEGER, max_ips INTEGER)
RETURNS TABLE(can_access BOOLEAN, current_devices INTEGER, current_ips INTEGER) AS $$
DECLARE
  device_count INTEGER;
  ip_count INTEGER;
BEGIN
  -- Contar dispositivos ativos
  SELECT COUNT(*) INTO device_count
  FROM public.device_sessions
  WHERE user_id = user_id_param AND is_active = true;
  
  -- Contar IPs únicos
  SELECT COUNT(DISTINCT ip_address) INTO ip_count
  FROM public.device_sessions
  WHERE user_id = user_id_param AND is_active = true;
  
  -- Verificar limites
  RETURN QUERY SELECT (device_count < max_devices AND ip_count < max_ips), device_count, ip_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger para limpeza automática
CREATE OR REPLACE FUNCTION public.auto_cleanup_sessions()
RETURNS trigger AS $$
BEGIN
  PERFORM public.cleanup_inactive_sessions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa a cada nova sessão
DROP TRIGGER IF EXISTS trigger_auto_cleanup_sessions ON public.device_sessions;
CREATE TRIGGER trigger_auto_cleanup_sessions
  AFTER INSERT ON public.device_sessions
  FOR EACH ROW EXECUTE FUNCTION public.auto_cleanup_sessions();

-- ====================================================================
-- SISTEMA PRONTO PARA USO!
-- ====================================================================
-- Resumo do que foi criado:
-- 1. Tabelas: device_sessions, plan_limits
-- 2. Índices para performance
-- 3. Políticas RLS para segurança
-- 4. Funções completas para controle de acesso
-- 5. Trigger para limpeza automática
--
-- Limites configurados:
-- - Plano Basic: 1 dispositivo, 1 IP
-- - Plano Pro: 2 dispositivos, 2 IPs
--
-- Funcionalidades:
-- - Fingerprinting avançado
-- - Controle por IP
-- - Monitoramento contínuo
-- - Bloqueio automático
-- - Limpeza de sessões inativas
-- ====================================================================
