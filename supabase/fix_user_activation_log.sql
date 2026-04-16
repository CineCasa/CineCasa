-- Criar tabela de log de ativação de usuários
CREATE TABLE IF NOT EXISTS public.user_activation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activated_by UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('activated', 'deactivated')),
    plan VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar comentários
COMMENT ON TABLE public.user_activation_log IS 'Log de ativação e desativação de usuários';
COMMENT ON COLUMN public.user_activation_log.user_id IS 'ID do usuário afetado';
COMMENT ON COLUMN public.user_activation_log.activated_by IS 'ID do administrador que executou a ação';
COMMENT ON COLUMN public.user_activation_log.action IS 'Tipo de ação: activated ou deactivated';
COMMENT ON COLUMN public.user_activation_log.plan IS 'Plano do usuário no momento da ação';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_activation_log_user_id ON public.user_activation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activation_log_created_at ON public.user_activation_log(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_activation_log ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem ver todos os logs
CREATE POLICY "Admins can view all activation logs"
ON public.user_activation_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Política: usuários podem ver seus próprios logs
CREATE POLICY "Users can view own activation logs"
ON public.user_activation_log FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política: apenas admins podem inserir logs
CREATE POLICY "Admins can insert activation logs"
ON public.user_activation_log FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Trigger function para logar ativação automática (opcional)
CREATE OR REPLACE FUNCTION log_user_activation()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
        INSERT INTO public.user_activation_log (user_id, activated_by, action, plan)
        VALUES (
            NEW.id,
            COALESCE(auth.uid(), NEW.id),
            CASE WHEN NEW.is_active = true THEN 'activated' ELSE 'deactivated' END,
            NEW.plan
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_log_user_activation ON public.profiles;
CREATE TRIGGER trigger_log_user_activation
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activation();
