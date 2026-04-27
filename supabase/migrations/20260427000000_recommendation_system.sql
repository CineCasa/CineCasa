-- Migration: Sistema de Recomendação Personalizado
-- Criado: 2026-04-27
-- Descrição: Tabelas e funções para sistema de recomendação baseado em comportamento do usuário
-- IMPORTANTE: Não altera tabelas existentes, apenas cria estruturas novas isoladas

-- ============================================
-- TABELA 1: Preferências de Gênero do Usuário
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_genre_preferences (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  genre text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, genre)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_user_id ON public.user_genre_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_score ON public.user_genre_preferences(score DESC);

-- RLS: Usuários só veem suas próprias preferências
ALTER TABLE public.user_genre_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" 
  ON public.user_genre_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
  ON public.user_genre_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON public.user_genre_preferences FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" 
  ON public.user_genre_preferences FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA 2: Log de Interações do Usuário
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  content_type text NOT NULL DEFAULT 'movie', -- 'movie' ou 'series'
  interaction_type text NOT NULL, -- 'watched', 'liked', 'saved', 'rated'
  rating integer, -- para interações do tipo 'rated' (1-10)
  genre text, -- gênero principal do conteúdo (para facilitar cálculo)
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON public.user_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_content ON public.user_interactions(content_id, content_type);

-- RLS: Usuários só veem suas próprias interações
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interactions" 
  ON public.user_interactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interactions" 
  ON public.user_interactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions" 
  ON public.user_interactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions" 
  ON public.user_interactions FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- FUNÇÃO: Atualizar Preferências baseado em Interação
-- ============================================
CREATE OR REPLACE FUNCTION public.update_user_preferences_from_interaction(
  p_user_id uuid,
  p_genre text,
  p_interaction_type text,
  p_rating integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points integer;
BEGIN
  -- Definir pontos baseado no tipo de interação
  CASE p_interaction_type
    WHEN 'watched' THEN v_points := 1;
    WHEN 'liked' THEN v_points := 2;
    WHEN 'saved' THEN v_points := 1;
    WHEN 'rated' THEN 
      -- Para avaliações: notas 8-10 = +3, 5-7 = +1, abaixo de 5 = 0
      IF p_rating >= 8 THEN v_points := 3;
      ELSIF p_rating >= 5 THEN v_points := 1;
      ELSE v_points := 0;
      END IF;
    ELSE v_points := 1;
  END CASE;

  -- Se não houver pontos (avaliação negativa), não fazer nada
  IF v_points = 0 THEN
    RETURN;
  END IF;

  -- Inserir ou atualizar preferência
  INSERT INTO public.user_genre_preferences (user_id, genre, score, updated_at)
  VALUES (p_user_id, p_genre, v_points, now())
  ON CONFLICT (user_id, genre)
  DO UPDATE SET 
    score = public.user_genre_preferences.score + v_points,
    updated_at = now();

END;
$$;

-- ============================================
-- FUNÇÃO: Registrar Interação e Atualizar Preferências
-- ============================================
CREATE OR REPLACE FUNCTION public.log_user_interaction(
  p_user_id uuid,
  p_content_id text,
  p_content_type text,
  p_interaction_type text,
  p_rating integer DEFAULT NULL,
  p_genre text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_interaction_id bigint;
BEGIN
  -- Inserir interação
  INSERT INTO public.user_interactions (
    user_id, 
    content_id, 
    content_type, 
    interaction_type, 
    rating, 
    genre, 
    created_at
  )
  VALUES (
    p_user_id, 
    p_content_id, 
    p_content_type, 
    p_interaction_type, 
    p_rating, 
    p_genre, 
    now()
  )
  RETURNING id INTO v_interaction_id;

  -- Atualizar preferências se tiver gênero
  IF p_genre IS NOT NULL THEN
    PERFORM public.update_user_preferences_from_interaction(
      p_user_id, 
      p_genre, 
      p_interaction_type, 
      p_rating
    );
  END IF;

  RETURN v_interaction_id;
END;
$$;

-- ============================================
-- FUNÇÃO: Obter Filmes Recomendados para Usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.get_recommended_movies(
  p_user_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  tmdb_id text,
  titulo text,
  poster text,
  year text,
  rating text,
  type text,
  genre_match text,
  relevance_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_preferences boolean;
BEGIN
  -- Verificar se usuário tem preferências
  SELECT EXISTS(
    SELECT 1 FROM public.user_genre_preferences 
    WHERE user_id = p_user_id
  ) INTO v_has_preferences;

  -- Se não tiver preferências, retornar filmes populares (fallback)
  IF NOT v_has_preferences THEN
    RETURN QUERY
    SELECT 
      c.id,
      c.tmdb_id,
      c.titulo,
      c.poster,
      c.year,
      c.rating,
      'movie'::text as type,
      'popular'::text as genre_match,
      0 as relevance_score
    FROM public.cinema c
    WHERE c.poster IS NOT NULL
    ORDER BY c.id DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Se tiver preferências, retornar filmes baseados nos gêneros preferidos
  RETURN QUERY
  WITH user_top_genres AS (
    SELECT genre, score
    FROM public.user_genre_preferences
    WHERE user_id = p_user_id
    ORDER BY score DESC
    LIMIT 5
  ),
  already_watched AS (
    SELECT DISTINCT content_id
    FROM public.user_interactions
    WHERE user_id = p_user_id
    AND interaction_type = 'watched'
  )
  SELECT DISTINCT ON (c.id)
    c.id,
    c.tmdb_id,
    c.titulo,
    c.poster,
    c.year,
    c.rating,
    'movie'::text as type,
    utg.genre as genre_match,
    utg.score as relevance_score
  FROM public.cinema c
  CROSS JOIN user_top_genres utg
  WHERE 
    c.poster IS NOT NULL
    AND (
      c.category ILIKE '%' || utg.genre || '%'
      OR c.genero ILIKE '%' || utg.genre || '%'
    )
    AND c.id::text NOT IN (SELECT content_id FROM already_watched)
  ORDER BY c.id, utg.score DESC
  LIMIT p_limit;

END;
$$;

-- ============================================
-- FUNÇÃO: Obter Séries Recomendadas para Usuário
-- ============================================
CREATE OR REPLACE FUNCTION public.get_recommended_series(
  p_user_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  tmdb_id text,
  titulo text,
  poster text,
  year text,
  rating text,
  type text,
  genre_match text,
  relevance_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_preferences boolean;
BEGIN
  -- Verificar se usuário tem preferências
  SELECT EXISTS(
    SELECT 1 FROM public.user_genre_preferences 
    WHERE user_id = p_user_id
  ) INTO v_has_preferences;

  -- Se não tiver preferências, retornar séries populares (fallback)
  IF NOT v_has_preferences THEN
    RETURN QUERY
    SELECT 
      s.id,
      s.tmdb_id,
      s.titulo,
      s.banner as poster,
      NULL::text as year,
      NULL::text as rating,
      'series'::text as type,
      'popular'::text as genre_match,
      0 as relevance_score
    FROM public.series s
    WHERE s.banner IS NOT NULL
    ORDER BY s.id DESC
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Se tiver preferências, retornar séries baseadas nos gêneros preferidos
  RETURN QUERY
  WITH user_top_genres AS (
    SELECT genre, score
    FROM public.user_genre_preferences
    WHERE user_id = p_user_id
    ORDER BY score DESC
    LIMIT 5
  ),
  already_watched AS (
    SELECT DISTINCT content_id
    FROM public.user_interactions
    WHERE user_id = p_user_id
    AND interaction_type = 'watched'
  )
  SELECT DISTINCT ON (s.id)
    s.id,
    s.tmdb_id,
    s.titulo,
    s.banner as poster,
    NULL::text as year,
    NULL::text as rating,
    'series'::text as type,
    utg.genre as genre_match,
    utg.score as relevance_score
  FROM public.series s
  CROSS JOIN user_top_genres utg
  WHERE 
    s.banner IS NOT NULL
    AND (
      s.genero ILIKE '%' || utg.genre || '%'
      OR s.categoria ILIKE '%' || utg.genre || '%'
    )
    AND s.id::text NOT IN (SELECT content_id FROM already_watched)
  ORDER BY s.id, utg.score DESC
  LIMIT p_limit;

END;
$$;

-- ============================================
-- FUNÇÃO: Obter Recomendações Combinadas (Filmes + Séries)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_recommended_content(
  p_user_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id text,
  tmdb_id text,
  title text,
  poster text,
  year text,
  rating text,
  type text,
  genre_match text,
  relevance_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH movies AS (
    SELECT 
      c.id::text as content_id,
      c.tmdb_id,
      c.titulo as title,
      c.poster,
      c.year,
      c.rating,
      'movie'::text as content_type,
      c.category as genre_match,
      COALESCE(ugp.score, 0) as rel_score
    FROM public.cinema c
    LEFT JOIN public.user_genre_preferences ugp 
      ON ugp.user_id = p_user_id 
      AND (c.category ILIKE '%' || ugp.genre || '%' OR c.genero ILIKE '%' || ugp.genre || '%')
    WHERE c.poster IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.user_interactions ui
      WHERE ui.user_id = p_user_id 
      AND ui.content_id = c.id::text 
      AND ui.interaction_type = 'watched'
    )
  ),
  series_data AS (
    SELECT 
      s.id::text as content_id,
      s.tmdb_id,
      s.titulo as title,
      s.banner as poster,
      NULL::text as year,
      NULL::text as rating,
      'series'::text as content_type,
      s.genero as genre_match,
      COALESCE(ugp.score, 0) as rel_score
    FROM public.series s
    LEFT JOIN public.user_genre_preferences ugp 
      ON ugp.user_id = p_user_id 
      AND (s.genero ILIKE '%' || ugp.genre || '%' OR s.categoria ILIKE '%' || ugp.genre || '%')
    WHERE s.banner IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.user_interactions ui
      WHERE ui.user_id = p_user_id 
      AND ui.content_id = s.id::text 
      AND ui.interaction_type = 'watched'
    )
  ),
  combined AS (
    SELECT * FROM movies
    UNION ALL
    SELECT * FROM series_data
  )
  SELECT 
    combined.content_id as id,
    combined.tmdb_id,
    combined.title,
    combined.poster,
    combined.year,
    combined.rating,
    combined.content_type as type,
    combined.genre_match,
    combined.rel_score as relevance_score
  FROM combined
  ORDER BY 
    CASE 
      WHEN combined.rel_score > 0 THEN combined.rel_score 
      ELSE combined.content_id::bigint 
    END DESC
  LIMIT p_limit;

END;
$$;

-- ============================================
-- Grant permissions
-- ============================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_genre_preferences TO authenticated;
GRANT ALL ON public.user_interactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_preferences_from_interaction(uuid, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_interaction(uuid, text, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_movies(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_series(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_content(uuid, integer) TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
