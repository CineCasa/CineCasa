-- DESABILITAR CONFIRMAÇÃO DE EMAIL - CINECASA
-- Este script remove a necessidade de confirmação de email
-- Usuários ficam ativos apenas quando liberados pelo admin

-- 1. Remover trigger automático de criação de perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Criar novo trigger que não ativa automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Inserir perfil com is_active = false (esperando liberação do admin)
  INSERT INTO public.profiles (id, email, is_active, is_admin)
  VALUES (new.id, new.email, false, false);
  
  -- Não confirmar email automaticamente
  -- O usuário precisará ser liberado pelo admin
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar trigger com nova lógica
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Atualizar perfis existentes para is_active = false (exceto admin)
UPDATE public.profiles 
SET is_active = false 
WHERE is_admin = false;

-- 5. Desabilitar confirmação de email no nível do Supabase
-- (Isso é feito via dashboard do Supabase em Authentication > Settings)

-- 6. Criar política para que usuários não autenticados não vejam nada
CREATE POLICY "No access for inactive users" 
ON public.profiles FOR ALL 
USING (auth.uid() = id AND is_active = true);

-- 7. Garantir que apenas admins possam alterar status
CREATE POLICY "Only admins can change active status" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 8. Criar função para admin liberar usuário
CREATE OR REPLACE FUNCTION public.activate_user(user_id UUID, plan TEXT DEFAULT 'basic')
RETURNS BOOLEAN AS $$
DECLARE
  admin_check BOOLEAN;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) INTO admin_check;
  
  IF NOT admin_check THEN
    RETURN FALSE;
  END IF;
  
  -- Ativar usuário e definir plano
  UPDATE public.profiles 
  SET is_active = true, 
      plan = plan,
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar função para admin desativar usuário
CREATE OR REPLACE FUNCTION public.deactivate_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_check BOOLEAN;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  ) INTO admin_check;
  
  IF NOT admin_check THEN
    RETURN FALSE;
  END IF;
  
  -- Desativar usuário
  UPDATE public.profiles 
  SET is_active = false, 
      updated_at = NOW()
  WHERE id = user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Permissões para as novas funções
GRANT EXECUTE ON FUNCTION public.activate_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_user TO authenticated;

-- 11. Log de alterações (opcional, para auditoria)
CREATE TABLE IF NOT EXISTS public.user_activation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  activated_by UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- 'activated' ou 'deactivated'
  plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Trigger para log de ativações
CREATE OR REPLACE FUNCTION public.log_user_activation() 
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.is_active <> NEW.is_active THEN
      INSERT INTO public.user_activation_log (user_id, activated_by, action, plan)
      VALUES (NEW.id, auth.uid(), 
              CASE WHEN NEW.is_active = true THEN 'activated' ELSE 'deactivated' END,
              NEW.plan);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER user_activation_log_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.log_user_activation();

COMMIT;
