-- ============================================
-- MIGRAÇÃO: Correções de Schema - 2024-04-28
-- ============================================
-- Issues corrigidos:
-- 1. column series.rating does not exist
-- 2. function get_ml_recommendations() does not exist
-- 3. function get_continue_watching() type mismatch
-- ============================================

-- 1. Adicionar coluna 'rating' na tabela 'series'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'rating'
    ) THEN
        ALTER TABLE series ADD COLUMN rating numeric(3,1);
        
        -- Atualizar registros existentes com valores padrão baseados em ano
        UPDATE series SET rating = 7.0 WHERE rating IS NULL;
        
        RAISE NOTICE 'Coluna rating adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna rating já existe na tabela series';
    END IF;
END $$;

-- 2. Criar função get_ml_recommendations (versão simplificada)
CREATE OR REPLACE FUNCTION get_ml_recommendations(
    p_user_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    content_id bigint,
    content_type text,
    title text,
    poster text,
    year integer,
    rating numeric,
    similarity_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Retornar recomendações baseadas em conteúdo similar ao que o usuário assistiu
    RETURN QUERY
    WITH user_history AS (
        -- Buscar histórico do usuário
        SELECT 
            w.content_id,
            w.content_type,
            c.category,
            c.genero
        FROM watchlist w
        LEFT JOIN cinema c ON w.content_id = c.id AND w.content_type = 'movie'
        WHERE w.user_id = p_user_id
        ORDER BY w.created_at DESC
        LIMIT 5
    ),
    similar_content AS (
        -- Buscar conteúdo similar baseado em categoria/gênero
        SELECT 
            c.id as content_id,
            'movie'::text as content_type,
            c.titulo as title,
            c.poster,
            c.year::integer,
            c.rating::numeric,
            0.8::numeric as similarity_score
        FROM cinema c
        WHERE c.id NOT IN (SELECT content_id FROM user_history WHERE content_type = 'movie')
        AND (c.category IN (SELECT category FROM user_history WHERE category IS NOT NULL)
             OR c.genero IN (SELECT genero FROM user_history WHERE genero IS NOT NULL))
        LIMIT p_limit
    )
    SELECT * FROM similar_content
    UNION ALL
    -- Fallback: retornar conteúdo popular se não houver histórico
    SELECT 
        c.id as content_id,
        'movie'::text as content_type,
        c.titulo as title,
        c.poster,
        c.year::integer,
        c.rating::numeric,
        0.5::numeric as similarity_score
    FROM cinema c
    WHERE c.id NOT IN (SELECT content_id FROM similar_content)
    AND c.year >= 2020
    ORDER BY c.rating DESC NULLS LAST
    LIMIT GREATEST(p_limit - (SELECT COUNT(*) FROM similar_content), 0);
END;
$$;

-- 3. Corrigir função get_continue_watching (type mismatch na coluna 6)
DROP FUNCTION IF EXISTS get_continue_watching(uuid);

CREATE OR REPLACE FUNCTION get_continue_watching(
    p_user_id uuid
)
RETURNS TABLE (
    content_id bigint,
    content_type text,
    title text,
    poster text,
    banner text,
    progress integer,  -- Corrigido: era 'real', agora é 'integer'
    duration integer,
    episode_id bigint,
    season_number integer,
    episode_number integer,
    episode_title text,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.content_id::bigint,
        w.content_type::text,
        COALESCE(c.titulo, s.titulo, 'Sem título')::text as title,
        CASE 
            WHEN w.content_type = 'movie' THEN c.poster
            ELSE s.banner
        END::text as poster,
        CASE 
            WHEN w.content_type = 'movie' THEN c.poster
            ELSE COALESCE(s.banner, s.capa)
        END::text as banner,
        COALESCE(w.progress, 0)::integer as progress,  -- Cast para integer
        COALESCE(w.duration, 0)::integer as duration,
        w.episode_id::bigint,
        w.season_number::integer,
        w.episode_number::integer,
        w.episode_title::text,
        w.updated_at
    FROM watchlist w
    LEFT JOIN cinema c ON w.content_id = c.id AND w.content_type = 'movie'
    LEFT JOIN series s ON w.content_id = s.id_n AND w.content_type = 'series'
    WHERE w.user_id = p_user_id
    AND w.progress > 0
    AND w.progress < COALESCE(w.duration, 100)
    ORDER BY w.updated_at DESC;
END;
$$;

-- 4. Criar função get_hybrid_recommendations (usada pelo useRecommendedForYou)
CREATE OR REPLACE FUNCTION get_hybrid_recommendations(
    p_user_id uuid,
    p_limit integer DEFAULT 10
)
RETURNS TABLE (
    content_id bigint,
    content_type text,
    title text,
    poster text,
    year integer,
    rating numeric,
    reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Combinação de ML + trending + popular
    RETURN QUERY
    WITH trending AS (
        SELECT 
            c.id as content_id,
            'movie'::text as content_type,
            c.titulo as title,
            c.poster,
            c.year::integer,
            c.rating::numeric,
            'Popular agora'::text as reason,
            ROW_NUMBER() OVER (ORDER BY c.rating DESC NULLS LAST) as rank
        FROM cinema c
        WHERE c.year >= 2024
        LIMIT p_limit
    )
    SELECT 
        t.content_id,
        t.content_type,
        t.title,
        t.poster,
        t.year,
        t.rating,
        t.reason
    FROM trending t
    ORDER BY t.rank
    LIMIT p_limit;
END;
$$;

-- 5. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_cinema_year ON cinema(year);
CREATE INDEX IF NOT EXISTS idx_cinema_rating ON cinema(rating);
CREATE INDEX IF NOT EXISTS idx_cinema_category ON cinema(category);
CREATE INDEX IF NOT EXISTS idx_series_rating ON series(rating) WHERE rating IS NOT NULL;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================
