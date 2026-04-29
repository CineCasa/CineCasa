-- Migration fix: Adicionar colunas enterprise à tabela generos
-- Cada ALTER TABLE separado para evitar syntax error

ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS popularity_score numeric(5,2) DEFAULT 0;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS tmdb_id integer;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS content_count integer DEFAULT 0;
ALTER TABLE public.generos ADD COLUMN IF NOT EXISTS avg_rating numeric(3,1) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_generos_slug ON public.generos(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_generos_popularity ON public.generos(popularity_score DESC) WHERE is_active = true;
