-- Migration: Sistema de Recomendação Inteligente com user_interactions
-- Data: 2026-05-01
-- Objetivo: Integrar user_interactions com recomendações em tempo real

-- ============================================
-- 1. FUNÇÃO: Calcular Score de Recomendação Baseado em Interações
-- ============================================
-- Lógica de pontuação:
--   favoritos (liked) → +5 pontos
--   interações com gênero → +3 pontos
--   avaliação positiva (rating >= 7) → +4 pontos
--   avaliação negativa (rating <= 3) → -2 pontos
--   watched completo → +2 pontos
--   skip/abandono → -2 pontos
-- ============================================

DROP FUNCTION IF EXISTS get_intelligent_recommendations(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_intelligent_recommendations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    content_id TEXT,
    content_type TEXT,
    title TEXT,
    poster TEXT,
    banner TEXT,
    rating NUMERIC,
    year TEXT,
    genero TEXT,
    recommendation_score INTEGER,
    reason TEXT,
    last_interaction_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH content_scores AS (
        -- Calcular score baseado nas interações do usuário
        SELECT 
            ui.content_id,
            ui.content_type,
            ui.genre,
            SUM(
                CASE 
                    -- Favoritos/Likes → +5
                    WHEN ui.interaction_type = 'liked' THEN 5
                    -- Salvos/Watchlist → +4
                    WHEN ui.interaction_type = 'saved' THEN 4
                    -- Avaliação positiva (7-10) → +4
                    WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN 4
                    -- Avaliação média (4-6) → +1
                    WHEN ui.interaction_type = 'rated' AND ui.rating BETWEEN 4 AND 6 THEN 1
                    -- Avaliação negativa (1-3) → -2
                    WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN -2
                    -- Assistido completamente → +2
                    WHEN ui.interaction_type = 'watched' THEN 2
                    -- Skip/Abandono → -2
                    WHEN ui.interaction_type = 'skip' THEN -2
                    ELSE 0
                END
            ) AS total_score,
            MAX(ui.created_at) AS last_interaction,
            STRING_AGG(DISTINCT 
                CASE 
                    WHEN ui.interaction_type = 'liked' THEN 'Favoritado'
                    WHEN ui.interaction_type = 'saved' THEN 'Salvo'
                    WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN 'Bem avaliado'
                    WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN 'Não recomendado'
                    WHEN ui.interaction_type = 'watched' THEN 'Assistido'
                    WHEN ui.interaction_type = 'skip' THEN 'Pulado'
                    ELSE NULL
                END, 
                ', '
                ORDER BY 
                CASE 
                    WHEN ui.interaction_type = 'liked' THEN 'Favoritado'
                    WHEN ui.interaction_type = 'saved' THEN 'Salvo'
                    WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN 'Bem avaliado'
                    WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN 'Não recomendado'
                    WHEN ui.interaction_type = 'watched' THEN 'Assistido'
                    WHEN ui.interaction_type = 'skip' THEN 'Pulado'
                    ELSE NULL
                END
            ) AS reasons
        FROM public.user_interactions ui
        WHERE ui.user_id = p_user_id
        GROUP BY ui.content_id, ui.content_type, ui.genre
        HAVING SUM(
            CASE 
                WHEN ui.interaction_type = 'liked' THEN 5
                WHEN ui.interaction_type = 'saved' THEN 4
                WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN 4
                WHEN ui.interaction_type = 'rated' AND ui.rating BETWEEN 4 AND 6 THEN 1
                WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN -2
                WHEN ui.interaction_type = 'watched' THEN 2
                WHEN ui.interaction_type = 'skip' THEN -2
                ELSE 0
            END
        ) > 0  -- Apenas conteúdo com score positivo
    ),
    -- Obter gêneros preferidos do usuário (top 5)
    user_preferred_genres AS (
        SELECT genre, SUM(score) as genre_score
        FROM content_scores
        WHERE genre IS NOT NULL
        GROUP BY genre
        ORDER BY genre_score DESC
        LIMIT 5
    ),
    -- Encontrar conteúdo similar baseado nos gêneros preferidos
    similar_content AS (
        SELECT 
            c.id::TEXT as content_id,
            'movie'::TEXT as content_type,
            c.titulo as title,
            c.poster,
            c.poster as banner,
            c.rating::NUMERIC as rating,
            c.year::TEXT as year,
            c.genero,
            2 as score_boost,  -- Score menor para similaridade
            'Baseado nos seus gêneros favoritos'::TEXT as reason,
            NULL::timestamptz as last_interaction
        FROM public.cinema c
        CROSS JOIN user_preferred_genres upg
        WHERE c.genero ILIKE '%' || upg.genre || '%'
          AND c.id::TEXT NOT IN (SELECT cs.content_id FROM content_scores cs)
          AND c.poster IS NOT NULL
        LIMIT 30
    )
    -- Combinar resultados: primeiro conteúdo interagido, depois similar
    SELECT 
        cs.content_id,
        cs.content_type,
        CASE 
            WHEN cs.content_type = 'movie' THEN (SELECT c.titulo FROM public.cinema c WHERE c.id::TEXT = cs.content_id LIMIT 1)
            WHEN cs.content_type = 'series' THEN (SELECT s.titulo FROM public.series s WHERE s.id_n::TEXT = cs.content_id LIMIT 1)
            ELSE 'Unknown'
        END as title,
        CASE 
            WHEN cs.content_type = 'movie' THEN (SELECT c.poster FROM public.cinema c WHERE c.id::TEXT = cs.content_id LIMIT 1)
            WHEN cs.content_type = 'series' THEN (SELECT s.banner FROM public.series s WHERE s.id_n::TEXT = cs.content_id LIMIT 1)
            ELSE NULL
        END as poster,
        CASE 
            WHEN cs.content_type = 'movie' THEN (SELECT c.poster FROM public.cinema c WHERE c.id::TEXT = cs.content_id LIMIT 1)
            WHEN cs.content_type = 'series' THEN (SELECT s.banner FROM public.series s WHERE s.id_n::TEXT = cs.content_id LIMIT 1)
            ELSE NULL
        END as banner,
        CASE 
            WHEN cs.content_type = 'movie' THEN (SELECT c.rating::NUMERIC FROM public.cinema c WHERE c.id::TEXT = cs.content_id LIMIT 1)
            ELSE NULL
        END as rating,
        CASE 
            WHEN cs.content_type = 'movie' THEN (SELECT c.year::TEXT FROM public.cinema c WHERE c.id::TEXT = cs.content_id LIMIT 1)
            ELSE NULL
        END as year,
        cs.genre as genero,
        cs.total_score::INTEGER as recommendation_score,
        COALESCE(cs.reasons, 'Baseado no seu histórico') as reason,
        cs.last_interaction as last_interaction_at
    FROM content_scores cs
    
    UNION ALL
    
    SELECT * FROM similar_content
    
    ORDER BY recommendation_score DESC, last_interaction_at DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_intelligent_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_intelligent_recommendations TO anon;

COMMENT ON FUNCTION get_intelligent_recommendations IS 'Retorna recomendações inteligentes baseadas nas interações do usuário na tabela user_interactions';

-- ============================================
-- 2. FUNÇÃO: Métricas de Análise de Comportamento do Usuário
-- ============================================

DROP FUNCTION IF EXISTS get_user_behavior_metrics(UUID);

CREATE OR REPLACE FUNCTION get_user_behavior_metrics(
    p_user_id UUID
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value INTEGER,
    metric_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Total de interações
    SELECT 
        'total_interactions'::TEXT as metric_name,
        COUNT(*)::INTEGER as metric_value,
        jsonb_build_object(
            'breakdown', jsonb_object_agg(ui.interaction_type, ui.cnt)
        ) as metric_details
    FROM (
        SELECT interaction_type, COUNT(*) as cnt
        FROM public.user_interactions
        WHERE user_id = p_user_id
        GROUP BY interaction_type
    ) ui
    
    UNION ALL
    
    -- Gêneros mais interagidos
    SELECT 
        'top_genres'::TEXT as metric_name,
        COUNT(*)::INTEGER as metric_value,
        jsonb_agg(
            jsonb_build_object(
                'genre', genre,
                'count', cnt,
                'score', score
            ) ORDER BY score DESC
        ) as metric_details
    FROM (
        SELECT genre, COUNT(*) as cnt, 
               SUM(CASE 
                   WHEN interaction_type = 'liked' THEN 5
                   WHEN interaction_type = 'saved' THEN 4
                   WHEN interaction_type = 'rated' AND rating >= 7 THEN 4
                   ELSE 1
               END) as score
        FROM public.user_interactions
        WHERE user_id = p_user_id AND genre IS NOT NULL
        GROUP BY genre
        ORDER BY score DESC
        LIMIT 5
    ) genres
    
    UNION ALL
    
    -- Conteúdos mais avaliados
    SELECT 
        'top_rated_content'::TEXT as metric_name,
        COUNT(*)::INTEGER as metric_value,
        jsonb_agg(
            jsonb_build_object(
                'content_id', content_id,
                'content_type', content_type,
                'rating', rating
            ) ORDER BY rating DESC
        ) as metric_details
    FROM (
        SELECT content_id, content_type, rating
        FROM public.user_interactions
        WHERE user_id = p_user_id 
          AND interaction_type = 'rated'
          AND rating >= 7
        ORDER BY rating DESC
        LIMIT 10
    ) rated
    
    UNION ALL
    
    -- Conteúdos mais abandonados (skip ou rating baixo)
    SELECT 
        'abandoned_content'::TEXT as metric_name,
        COUNT(*)::INTEGER as metric_value,
        jsonb_agg(
            jsonb_build_object(
                'content_id', content_id,
                'content_type', content_type,
                'reason', reason
            )
        ) as metric_details
    FROM (
        SELECT content_id, content_type,
               CASE 
                   WHEN interaction_type = 'skip' THEN 'Pulado'
                   WHEN interaction_type = 'rated' AND rating <= 3 THEN 'Avaliação negativa'
               END as reason
        FROM public.user_interactions
        WHERE user_id = p_user_id 
          AND (interaction_type = 'skip' OR (interaction_type = 'rated' AND rating <= 3))
        ORDER BY created_at DESC
        LIMIT 10
    ) abandoned;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_behavior_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_behavior_metrics TO anon;

COMMENT ON FUNCTION get_user_behavior_metrics IS 'Retorna métricas de análise de comportamento do usuário baseadas em user_interactions';

-- ============================================
-- 3. FUNÇÃO: Registrar Interação do Usuário
-- ============================================

DROP FUNCTION IF EXISTS log_user_interaction(UUID, TEXT, TEXT, TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION log_user_interaction(
    p_user_id UUID,
    p_content_id TEXT,
    p_content_type TEXT,
    p_interaction_type TEXT, -- 'watched', 'liked', 'saved', 'rated', 'skip'
    p_rating INTEGER DEFAULT NULL,
    p_genre TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_interaction_id BIGINT;
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
    ) VALUES (
        p_user_id,
        p_content_id,
        p_content_type,
        p_interaction_type,
        p_rating,
        p_genre,
        NOW()
    )
    RETURNING id INTO v_interaction_id;
    
    RETURN v_interaction_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_user_interaction TO authenticated;

COMMENT ON FUNCTION log_user_interaction IS 'Registra uma interação do usuário para análise de comportamento e recomendações';

-- ============================================
-- 4. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_interactions_type 
    ON public.user_interactions(interaction_type);

CREATE INDEX IF NOT EXISTS idx_user_interactions_genre 
    ON public.user_interactions(genre) 
    WHERE genre IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_content 
    ON public.user_interactions(user_id, content_id, content_type);

COMMENT ON INDEX idx_user_interactions_type IS 'Índice para buscas por tipo de interação';
COMMENT ON INDEX idx_user_interactions_genre IS 'Índice para análise de preferências de gênero';
COMMENT ON INDEX idx_user_interactions_user_content IS 'Índice para verificar interações específicas usuário/conteúdo';

-- ============================================
-- RESUMO
-- ============================================
-- Funções criadas:
-- 1. get_intelligent_recommendations(user_id, limit) - Recomendações baseadas em interações
-- 2. get_user_behavior_metrics(user_id) - Métricas de comportamento
-- 3. log_user_interaction(...) - Registrar nova interação
--
-- Lógica de pontuação:
--   liked (favorito) → +5
--   saved (salvo) → +4
--   rated >= 7 → +4
--   rated 4-6 → +1
--   rated <= 3 → -2
--   watched → +2
--   skip → -2
