-- Migration: RLS Policies para ratings
-- Data: 2025-06-28
-- Descrição: Políticas de segurança para a tabela ratings

-- Habilitar RLS na tabela
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para recriar
DROP POLICY IF EXISTS "Anyone can view approved ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can view own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can create own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Service role bypass" ON public.ratings;

-- Política: Qualquer um pode ver avaliações aprovadas (leitura pública)
CREATE POLICY "Anyone can view approved ratings"
ON public.ratings
FOR SELECT
TO authenticated, anon
USING (
  deleted_at IS NULL 
  AND status = 'approved'
);

-- Política: Usuários podem ver suas próprias avaliações (mesmo se pending/rejected)
CREATE POLICY "Users can view own ratings"
ON public.ratings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Política: Usuários podem criar avaliações para si mesmos
CREATE POLICY "Users can create own ratings"
ON public.ratings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND rating >= 1 
  AND rating <= 5
);

-- Política: Usuários podem atualizar suas próprias avaliações
CREATE POLICY "Users can update own ratings"
ON public.ratings
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
)
WITH CHECK (
  user_id = auth.uid()
  AND rating >= 1 
  AND rating <= 5
);

-- Política: Usuários podem deletar (soft) suas próprias avaliações
CREATE POLICY "Users can delete own ratings"
ON public.ratings
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
);

-- Política especial para service role
CREATE POLICY "Service role bypass"
ON public.ratings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.ratings TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;

-- Comentários
COMMENT ON POLICY "Anyone can view approved ratings" ON public.ratings IS 'Leitura pública de avaliações aprovadas';
COMMENT ON POLICY "Users can view own ratings" ON public.ratings IS 'Usuários veem suas próprias avaliações mesmo pendentes';
COMMENT ON POLICY "Users can create own ratings" ON public.ratings IS 'Usuários só criam avaliações para si mesmos';
COMMENT ON POLICY "Users can update own ratings" ON public.ratings IS 'Usuários só editam suas próprias avaliações';
COMMENT ON POLICY "Users can delete own ratings" ON public.ratings IS 'Usuários só removem suas próprias avaliações';
