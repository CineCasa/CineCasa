-- Migration: Cria tabela user_profiles
-- Data: 2026-05-03
-- Descrição: Tabela para armazenar perfis de usuários com gamificação e customização

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função específica para user_profiles (se não existir)
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name CHARACTER VARYING(255) NULL,
  bio TEXT NULL,
  avatar_url CHARACTER VARYING(500) NULL,
  avatar_customization JSONB NULL DEFAULT '{}'::JSONB,
  points INTEGER NULL DEFAULT 0,
  special_items UUID[] NULL DEFAULT '{}'::UUID[],
  badges UUID[] NULL DEFAULT '{}'::UUID[],
  frames UUID[] NULL DEFAULT '{}'::UUID[],
  effects UUID[] NULL DEFAULT '{}'::UUID[],
  plan CHARACTER VARYING(50) NULL DEFAULT 'free'::CHARACTER VARYING,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_lookup ON public.user_profiles USING btree (user_id, id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles USING btree (user_id) TABLESPACE pg_default;

-- Criar trigger para atualizar updated_at (usando a função genérica)
DROP TRIGGER IF EXISTS update_user_profiles_timestamp ON public.user_profiles;
CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger alternativo (manter compatibilidade)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver seus próprios perfis
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Política: Usuários só podem inserir seu próprio perfil
CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuários só podem atualizar seus próprios perfis
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: Usuários só podem deletar seus próprios perfis
CREATE POLICY "user_profiles_delete_own" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, name, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'free'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Comentários na tabela
COMMENT ON TABLE public.user_profiles IS 'Tabela para armazenar perfis de usuários com sistema de gamificação e customização de avatar';
COMMENT ON COLUMN public.user_profiles.avatar_customization IS 'JSON com customização do avatar (cores, acessórios, etc)';
COMMENT ON COLUMN public.user_profiles.points IS 'Pontos de gamificação do usuário';
COMMENT ON COLUMN public.user_profiles.special_items IS 'IDs dos itens especiais adquiridos pelo usuário';
COMMENT ON COLUMN public.user_profiles.badges IS 'IDs das conquistas/badges do usuário';
COMMENT ON COLUMN public.user_profiles.frames IS 'IDs dos frames de avatar adquiridos';
COMMENT ON COLUMN public.user_profiles.effects IS 'IDs dos efeitos visuais adquiridos';
COMMENT ON COLUMN public.user_profiles.plan IS 'Plano do usuário: free, basic, standard, premium';
