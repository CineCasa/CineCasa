-- Adicionar campo 'approved' na tabela profiles para controle de aprovação de usuários
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Criar política RLS para permitir que apenas admins vejam usuários não aprovados
-- Primeiro, garantir que RLS está habilitado
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
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

-- Política para permitir que admins atualizem qualquer perfil (para aprovar)
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Função para verificar se usuário está aprovado antes de permitir login
CREATE OR REPLACE FUNCTION check_user_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o usuário existe na tabela profiles e está aprovado ou é admin
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.id 
    AND (approved = TRUE OR is_admin = TRUE)
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Se não existe na tabela profiles, criar registro não aprovado
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    INSERT INTO profiles (id, email, approved, is_admin, is_active, created_at)
    VALUES (NEW.id, NEW.email, FALSE, FALSE, TRUE, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para verificar aprovação no momento do login
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION check_user_approval();

-- Índice para buscar usuários pendentes de aprovação
CREATE INDEX IF NOT EXISTS idx_profiles_approved ON profiles(approved) 
WHERE approved = FALSE;

-- Comentários
COMMENT ON COLUMN profiles.approved IS 'Indica se o usuário foi aprovado pelo administrador';
