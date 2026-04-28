-- Migration: RLS Policies para generos
-- Data: 2025-06-28

-- Habilitar RLS
ALTER TABLE public.generos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cinema_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_genres ENABLE ROW LEVEL SECURITY;

-- Políticas para generos
DROP POLICY IF EXISTS "Anyone can view active genres" ON public.generos;
DROP POLICY IF EXISTS "Service role can manage genres" ON public.generos;

CREATE POLICY "Anyone can view active genres"
ON public.generos
FOR SELECT
TO authenticated, anon
USING (is_active = true);

CREATE POLICY "Service role can manage genres"
ON public.generos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Políticas para cinema_genres
DROP POLICY IF EXISTS "Anyone can view cinema genres" ON public.cinema_genres;
DROP POLICY IF EXISTS "Service role can manage cinema genres" ON public.cinema_genres;

CREATE POLICY "Anyone can view cinema genres"
ON public.cinema_genres
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Service role can manage cinema genres"
ON public.cinema_genres
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Políticas para series_genres
DROP POLICY IF EXISTS "Anyone can view series genres" ON public.series_genres;
DROP POLICY IF EXISTS "Service role can manage series genres" ON public.series_genres;

CREATE POLICY "Anyone can view series genres"
ON public.series_genres
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Service role can manage series genres"
ON public.series_genres
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grants
GRANT SELECT ON public.generos TO authenticated, anon;
GRANT SELECT ON public.cinema_genres TO authenticated, anon;
GRANT SELECT ON public.series_genres TO authenticated, anon;
GRANT ALL ON public.generos TO service_role;
GRANT ALL ON public.cinema_genres TO service_role;
GRANT ALL ON public.series_genres TO service_role;
