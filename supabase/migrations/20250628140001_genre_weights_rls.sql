-- Migration: RLS Policies para genre_weights
-- Data: 2025-06-28

-- Habilitar RLS
ALTER TABLE public.genre_weights ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Anyone can view genre weights" ON public.genre_weights;
DROP POLICY IF EXISTS "Service role can manage genre weights" ON public.genre_weights;

-- Política: Leitura pública (todos podem ver pesos de gênero)
CREATE POLICY "Anyone can view genre weights"
ON public.genre_weights
FOR SELECT
TO authenticated, anon
USING (true);

-- Política: Service role pode gerenciar
CREATE POLICY "Service role can manage genre weights"
ON public.genre_weights
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grants
GRANT SELECT ON public.genre_weights TO authenticated, anon, service_role;
GRANT ALL ON public.genre_weights TO service_role;

COMMENT ON POLICY "Anyone can view genre weights" ON public.genre_weights IS 'Leitura pública dos pesos de gênero para recommendation engine';
