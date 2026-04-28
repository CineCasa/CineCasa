-- Migration: Criar tabela de preferências de gênero
-- Data: 2025-06-28
-- Autor: Sistema de Recomendação CineCasa

-- Criar tabela de preferências de gênero
CREATE TABLE IF NOT EXISTS public.user_genre_preferences (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  genre text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  CONSTRAINT user_genre_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_genre_preferences_user_id_genre_key UNIQUE (user_id, genre),
  CONSTRAINT user_genre_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_genre_preferences_score_check CHECK (score >= -1000 AND score <= 10000)
);

-- Comentários para documentação
COMMENT ON TABLE public.user_genre_preferences IS 'Armazena as preferências de gênero dos usuários para sistema de recomendação';
COMMENT ON COLUMN public.user_genre_preferences.score IS 'Pontuação do gênero: pode ser negativa (evitar) ou positiva (favorito). Range: -1000 a 10000';
COMMENT ON COLUMN public.user_genre_preferences.genre IS 'Nome do gênero (ex: Ação, Drama, Comédia)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_user_id 
ON public.user_genre_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_score 
ON public.user_genre_preferences(score DESC);

CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_updated_at 
ON public.user_genre_preferences(updated_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_genre_preferences_updated_at 
ON public.user_genre_preferences;

CREATE TRIGGER update_user_genre_preferences_updated_at
    BEFORE UPDATE ON public.user_genre_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.user_genre_preferences ENABLE ROW LEVEL SECURITY;

-- Policies RLS
-- Policy: Usuários só podem ver suas próprias preferências
CREATE POLICY "Users can view own genre preferences" 
ON public.user_genre_preferences 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Usuários só podem inserir suas próprias preferências
CREATE POLICY "Users can insert own genre preferences" 
ON public.user_genre_preferences 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários só podem atualizar suas próprias preferências
CREATE POLICY "Users can update own genre preferences" 
ON public.user_genre_preferences 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários só podem deletar suas próprias preferências
CREATE POLICY "Users can delete own genre preferences" 
ON public.user_genre_preferences 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Função RPC: Atualizar preferências de gênero (UPSERT)
CREATE OR REPLACE FUNCTION public.update_genre_preferences(
  p_user_id uuid,
  p_genres text[],
  p_score_delta integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_genre text;
BEGIN
  -- Loop através de todos os gêneros fornecidos
  FOREACH v_genre IN ARRAY p_genres
  LOOP
    -- UPSERT: Inserir se não existir, ou atualizar score se existir
    INSERT INTO public.user_genre_preferences (user_id, genre, score)
    VALUES (p_user_id, v_genre, GREATEST(-1000, LEAST(10000, p_score_delta)))
    ON CONFLICT (user_id, genre)
    DO UPDATE SET 
      score = GREATEST(-1000, LEAST(10000, public.user_genre_preferences.score + p_score_delta)),
      updated_at = now();
  END LOOP;
END;
$$;

-- Função RPC: Obter gêneros preferidos do usuário (ordenados por score)
CREATE OR REPLACE FUNCTION public.get_user_favorite_genres(
  p_user_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (genre text, score integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ugp.genre,
    ugp.score
  FROM public.user_genre_preferences ugp
  WHERE ugp.user_id = p_user_id
    AND ugp.score > 0
  ORDER BY ugp.score DESC
  LIMIT p_limit;
END;
$$;

-- Função RPC: Obter conteúdo recomendado por gênero
CREATE OR REPLACE FUNCTION public.get_content_by_genre_preferences(
  p_user_id uuid,
  p_content_type text DEFAULT 'movie',
  p_limit integer DEFAULT 20,
  p_exclude_watched boolean DEFAULT true
)
RETURNS TABLE (
  id bigint,
  content_type text,
  title text,
  poster text,
  year text,
  rating text,
  genre text,
  genre_match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_table text;
  v_id_column text;
BEGIN
  -- Determinar tabela e coluna baseado no tipo
  IF p_content_type = 'movie' THEN
    v_content_table := 'cinema';
    v_id_column := 'id';
  ELSE
    v_content_table := 'series';
    v_id_column := 'id_n';
  END IF;

  -- Retornar conteúdo baseado nos gêneros preferidos do usuário
  RETURN QUERY EXECUTE format('
    WITH user_genres AS (
      SELECT genre, score
      FROM public.user_genre_preferences
      WHERE user_id = $1
        AND score > 0
      ORDER BY score DESC
      LIMIT 5
    ),
    watched_content AS (
      SELECT content_id
      FROM public.user_progress
      WHERE user_id = $1
        AND completed = true
    )
    SELECT 
      c.%I::bigint as id,
      $2::text as content_type,
      c.titulo as title,
      c.poster,
      c.year::text,
      c.rating::text,
      c.category as genre,
      ug.score as genre_match_score
    FROM %I c
    INNER JOIN user_genres ug 
      ON c.category ILIKE ''%%'' || ug.genre || ''%%''
      OR c.genero ILIKE ''%%'' || ug.genre || ''%%''
    WHERE CASE WHEN $4 THEN
      c.%I::text NOT IN (SELECT content_id FROM watched_content)
    ELSE true END
    ORDER BY ug.score DESC, c.year DESC NULLS LAST
    LIMIT $3
  ', v_id_column, v_content_table, v_id_column)
  USING p_user_id, p_content_type, p_limit, p_exclude_watched;
END;
$$;

-- Função RPC: Resetar preferências de gênero do usuário
CREATE OR REPLACE FUNCTION public.reset_genre_preferences(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_genre_preferences
  WHERE user_id = p_user_id;
END;
$$;

-- Conceder permissões
GRANT ALL ON public.user_genre_preferences TO authenticated;
GRANT ALL ON public.user_genre_preferences TO service_role;
GRANT EXECUTE ON FUNCTION public.update_genre_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_favorite_genres TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_content_by_genre_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_genre_preferences TO authenticated;
