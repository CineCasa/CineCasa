-- Migration: RLS Policies para user_devices
-- Data: 2025-06-28
-- Descrição: Políticas de segurança para a tabela user_devices

-- Habilitar RLS na tabela
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Users can view their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Users can insert their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Users can update their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Users can delete their own devices" ON public.user_devices;
DROP POLICY IF EXISTS "Allow RPC operations via service role" ON public.user_devices;

-- Política: Usuários podem ver seus próprios dispositivos
CREATE POLICY "Users can view their own devices"
ON public.user_devices
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política: Usuários podem inserir dispositivos para si mesmos
CREATE POLICY "Users can insert their own devices"
ON public.user_devices
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem atualizar seus próprios dispositivos
CREATE POLICY "Users can update their own devices"
ON public.user_devices
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política: Usuários podem remover (soft delete) seus próprios dispositivos
CREATE POLICY "Users can delete their own devices"
ON public.user_devices
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Política especial para service role (usada pelas funções RPC SECURITY DEFINER)
CREATE POLICY "Service role bypass"
ON public.user_devices
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;

-- Grant sequence usage
GRANT USAGE ON SEQUENCE user_devices_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE user_devices_id_seq TO service_role;

-- Comentários
COMMENT ON POLICY "Users can view their own devices" ON public.user_devices IS 'Usuários autenticados só podem ver seus próprios dispositivos';
COMMENT ON POLICY "Users can insert their own devices" ON public.user_devices IS 'Usuários só podem registrar dispositivos para sua própria conta';
COMMENT ON POLICY "Users can update their own devices" ON public.user_devices IS 'Usuários só podem atualizar seus próprios dispositivos';
COMMENT ON POLICY "Users can delete their own devices" ON public.user_devices IS 'Usuários só podem remover seus próprios dispositivos';
