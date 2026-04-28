-- Migration: Melhorias Enterprise na tabela ratings
-- Data: 2025-06-28
-- Descrição: Adiciona campos enterprise para sistema profissional de avaliações

-- Adicionar colunas enterprise à tabela existente
ALTER TABLE public.ratings 
  ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contains_spoilers boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ratings_content_id 
  ON public.ratings(content_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ratings_content_type 
  ON public.ratings(content_type, content_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ratings_user_id 
  ON public.ratings(user_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ratings_rating 
  ON public.ratings(rating DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ratings_created_at 
  ON public.ratings(created_at DESC) 
  WHERE deleted_at IS NULL;

-- Constraint para status válido
ALTER TABLE public.ratings 
  DROP CONSTRAINT IF EXISTS ratings_status_check;

ALTER TABLE public.ratings 
  ADD CONSTRAINT ratings_status_check 
  CHECK (status IN ('approved', 'pending', 'rejected', 'spam'));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ratings_updated_at ON public.ratings;

CREATE TRIGGER ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_ratings_updated_at();

-- Função RPC: Criar ou atualizar avaliação (UPSERT)
CREATE OR REPLACE FUNCTION create_or_update_rating(
  p_user_id uuid,
  p_content_id varchar(255),
  p_content_type varchar(50),
  p_rating integer,
  p_review text DEFAULT NULL,
  p_contains_spoilers boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rating_id uuid;
BEGIN
  -- Validar rating
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating deve estar entre 1 e 5';
  END IF;
  
  -- Validar content_type
  IF p_content_type NOT IN ('movie', 'series') THEN
    RAISE EXCEPTION 'Content type deve ser movie ou series';
  END IF;

  -- Tentar atualizar avaliação existente
  UPDATE public.ratings
  SET 
    rating = p_rating,
    review = p_review,
    contains_spoilers = p_contains_spoilers,
    updated_at = NOW(),
    deleted_at = NULL, -- Restaurar se estava deletada
    status = 'approved'
  WHERE user_id = p_user_id 
    AND content_id = p_content_id
    AND content_type = p_content_type
  RETURNING id INTO v_rating_id;
  
  -- Se não encontrou, inserir nova
  IF v_rating_id IS NULL THEN
    INSERT INTO public.ratings (
      user_id, content_id, content_type, rating, review,
      contains_spoilers, status, helpful_count, metadata,
      created_at, updated_at
    ) VALUES (
      p_user_id, p_content_id, p_content_type, p_rating, p_review,
      p_contains_spoilers, 'approved', 0, '{}',
      NOW(), NOW()
    )
    RETURNING id INTO v_rating_id;
  END IF;
  
  RETURN v_rating_id;
END;
$$;

-- Função RPC: Deletar avaliação (soft delete)
CREATE OR REPLACE FUNCTION delete_rating(
  p_user_id uuid,
  p_content_id varchar(255)
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ratings
  SET 
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id 
    AND content_id = p_content_id
    AND deleted_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Função RPC: Buscar avaliação do usuário
CREATE OR REPLACE FUNCTION get_user_rating(
  p_user_id uuid,
  p_content_id varchar(255)
)
RETURNS TABLE (
  id uuid,
  rating integer,
  review text,
  contains_spoilers boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    r.id,
    r.rating,
    r.review,
    r.contains_spoilers,
    r.created_at,
    r.updated_at
  FROM public.ratings r
  WHERE r.user_id = p_user_id 
    AND r.content_id = p_content_id
    AND r.deleted_at IS NULL
  LIMIT 1;
$$;

-- Função RPC: Buscar média de avaliações de conteúdo
CREATE OR REPLACE FUNCTION get_content_average_rating(p_content_id varchar(255))
RETURNS TABLE (
  average_rating numeric,
  total_reviews integer,
  rating_1_count integer,
  rating_2_count integer,
  rating_3_count integer,
  rating_4_count integer,
  rating_5_count integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as average_rating,
    COUNT(*)::integer as total_reviews,
    COUNT(*) FILTER (WHERE r.rating = 1)::integer as rating_1_count,
    COUNT(*) FILTER (WHERE r.rating = 2)::integer as rating_2_count,
    COUNT(*) FILTER (WHERE r.rating = 3)::integer as rating_3_count,
    COUNT(*) FILTER (WHERE r.rating = 4)::integer as rating_4_count,
    COUNT(*) FILTER (WHERE r.rating = 5)::integer as rating_5_count
  FROM public.ratings r
  WHERE r.content_id = p_content_id
    AND r.deleted_at IS NULL
    AND r.status = 'approved';
$$;

-- Função RPC: Buscar reviews de conteúdo (com paginação)
CREATE OR REPLACE FUNCTION get_content_reviews(
  p_content_id varchar(255),
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  rating integer,
  review text,
  contains_spoilers boolean,
  helpful_count integer,
  created_at timestamptz,
  username text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    r.id,
    r.user_id,
    r.rating,
    r.review,
    r.contains_spoilers,
    r.helpful_count,
    r.created_at,
    p.username::text,
    p.avatar_url::text
  FROM public.ratings r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.content_id = p_content_id
    AND r.deleted_at IS NULL
    AND r.status = 'approved'
    AND (r.review IS NOT NULL AND r.review != '')
  ORDER BY r.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Função RPC: Buscar avaliações recentes do usuário
CREATE OR REPLACE FUNCTION get_user_recent_ratings(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content_id varchar(255),
  content_type varchar(50),
  rating integer,
  review text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    r.id,
    r.content_id,
    r.content_type,
    r.rating,
    r.review,
    r.created_at
  FROM public.ratings r
  WHERE r.user_id = p_user_id
    AND r.deleted_at IS NULL
  ORDER BY r.created_at DESC
  LIMIT p_limit;
$$;

-- Função RPC: Buscar conteúdos mais bem avaliados
CREATE OR REPLACE FUNCTION get_top_rated_contents(
  p_content_type varchar(50) DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_min_reviews integer DEFAULT 3
)
RETURNS TABLE (
  content_id varchar(255),
  content_type varchar(50),
  average_rating numeric,
  total_reviews integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    r.content_id,
    r.content_type,
    ROUND(AVG(r.rating)::numeric, 1) as average_rating,
    COUNT(*)::integer as total_reviews
  FROM public.ratings r
  WHERE r.deleted_at IS NULL
    AND r.status = 'approved'
    AND (p_content_type IS NULL OR r.content_type = p_content_type)
  GROUP BY r.content_id, r.content_type
  HAVING COUNT(*) >= p_min_reviews
  ORDER BY AVG(r.rating) DESC, COUNT(*) DESC
  LIMIT p_limit;
$$;

-- Função RPC: Incrementar helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(p_rating_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ratings
  SET helpful_count = helpful_count + 1
  WHERE id = p_rating_id
    AND deleted_at IS NULL;
    
  RETURN FOUND;
END;
$$;

-- Função RPC: Contar avaliações do usuário
CREATE OR REPLACE FUNCTION count_user_ratings(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.ratings
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;
$$;

-- Comentários para documentação
COMMENT ON TABLE public.ratings IS 'Tabela de avaliações e reviews dos usuários';
COMMENT ON COLUMN public.ratings.helpful_count IS 'Quantidade de usuários que acharam o review útil';
COMMENT ON COLUMN public.ratings.contains_spoilers IS 'Indica se o review contém spoilers';
COMMENT ON COLUMN public.ratings.status IS 'Status da avaliação: approved, pending, rejected, spam';
COMMENT ON COLUMN public.ratings.metadata IS 'Dados adicionais em JSON';
COMMENT ON COLUMN public.ratings.deleted_at IS 'Soft delete timestamp';
