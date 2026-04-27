-- Migration: Sistema de Recomendação Inteligente
-- Usa APENAS tabelas existentes: user_progress, user_views, favorites, watchlist
-- Data: 2026-04-28

-- ============================================
-- FUNÇÃO RPC: Calcular Score de Recomendação
-- ============================================
-- Regras de pontuação:
-- favorites → peso 5
-- watchlist → peso 3
-- user_progress com progress > 80 → peso 4
-- user_progress com progress < 30 → penalidade -2
-- ============================================

-- Dropar função existente se houver conflito de tipo de retorno
DROP FUNCTION IF EXISTS get_recommended_content(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_recommended_content(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    content_id INTEGER,
    content_type TEXT,
    title TEXT,
    poster TEXT,
    banner TEXT,
    rating NUMERIC,
    year INTEGER,
    genero TEXT,
    recommendation_score INTEGER,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_behavior_scores AS (
        -- Score baseado em favorites (peso 5)
        SELECT 
            f.content_id,
            f.content_type,
            5 AS score,
            'Adicionado aos favoritos'::TEXT AS reason
        FROM favorites f
        WHERE f.user_id = p_user_id
        
        UNION ALL
        
        -- Score baseado em watchlist (peso 3)
        SELECT 
            w.content_id,
            w.content_type,
            3 AS score,
            'Na lista "Ver depois"'::TEXT AS reason
        FROM watchlist w
        WHERE w.user_id = p_user_id
        
        UNION ALL
        
        -- Score baseado em user_progress > 80% (peso 4)
        SELECT 
            up.content_id,
            up.content_type,
            4 AS score,
            'Quase terminado de assistir'::TEXT AS reason
        FROM user_progress up
        WHERE up.user_id = p_user_id
          AND up.progress > 80
          AND up.progress < 95
        
        UNION ALL
        
        -- Penalidade para progress < 30% (-2)
        SELECT 
            up.content_id,
            up.content_type,
            -2 AS score,
            'Abandonado cedo'::TEXT AS reason
        FROM user_progress up
        WHERE up.user_id = p_user_id
          AND up.progress < 30
          AND up.progress > 0
    ),
    aggregated_scores AS (
        -- Agregar scores por conteúdo
        SELECT 
            content_id,
            content_type,
            SUM(score) AS total_score,
            STRING_AGG(DISTINCT reason, ', ' ORDER BY reason) AS reasons
        FROM user_behavior_scores
        GROUP BY content_id, content_type
        HAVING SUM(score) > 0  -- Ignorar scores negativos ou zero
    ),
    -- Buscar conteúdos similares baseados em gênero dos favoritos
    user_favorite_genres AS (
        SELECT DISTINCT c.genero
        FROM favorites f
        JOIN cinema c ON CAST(f.content_id AS INTEGER) = c.id
        WHERE f.user_id = p_user_id
          AND f.content_type = 'movie'
          AND c.genero IS NOT NULL
        LIMIT 5
    ),
    similar_content AS (
        -- Conteúdo similar baseado nos gêneros favoritos
        SELECT 
            c.id AS content_id,
            'movie'::TEXT AS content_type,
            2 AS score,  -- Score menor para conteúdo similar
            ('Similar a seus favoritos: ' || c.genero)::TEXT AS reason
        FROM cinema c
        CROSS JOIN user_favorite_genres ufg
        WHERE c.genero ILIKE '%' || ufg.genero || '%'
          AND c.id NOT IN (
              SELECT CAST(content_id AS INTEGER) 
              FROM user_behavior_scores 
              WHERE content_type = 'movie'
          )
        LIMIT 50
    ),
    all_scored_content AS (
        -- Combinar todos os scores
        SELECT * FROM aggregated_scores
        UNION ALL
        SELECT content_id, content_type, score, reason FROM similar_content
    ),
    final_scores AS (
        SELECT 
            content_id,
            content_type,
            SUM(total_score) AS final_score,
            STRING_AGG(DISTINCT reasons, ' | ' ORDER BY reasons) AS all_reasons
        FROM all_scored_content
        GROUP BY content_id, content_type
    )
    -- Retornar dados dos filmes/séries com scores
    SELECT 
        c.id AS content_id,
        'movie'::TEXT AS content_type,
        c.titulo AS title,
        c.poster,
        c.poster AS banner,
        c.rating::NUMERIC AS rating,
        c.year::INTEGER AS year,
        c.genero,
        fs.final_score::INTEGER AS recommendation_score,
        LEFT(fs.all_reasons, 100)::TEXT AS reason
    FROM final_scores fs
    JOIN cinema c ON CAST(fs.content_id AS INTEGER) = c.id
    WHERE fs.content_type = 'movie'
    
    UNION ALL
    
    SELECT 
        s.id_n AS content_id,
        'series'::TEXT AS content_type,
        s.titulo AS title,
        s.capa AS poster,
        s.banner,
        0::NUMERIC AS rating,
        0::INTEGER AS year,
        s.genero,
        fs.final_score::INTEGER AS recommendation_score,
        LEFT(fs.all_reasons, 100)::TEXT AS reason
    FROM final_scores fs
    JOIN series s ON CAST(fs.content_id AS INTEGER) = s.id_n
    WHERE fs.content_type = 'series'
    
    ORDER BY recommendation_score DESC, rating DESC
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_recommended_content TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_content TO anon;

COMMENT ON FUNCTION get_recommended_content IS 'Retorna conteúdo recomendado baseado no comportamento do usuário usando tabelas existentes';

-- ============================================
-- FUNÇÃO RPC: Fallback para conteúdo popular
-- ============================================
CREATE OR REPLACE FUNCTION get_popular_content(
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    content_id INTEGER,
    content_type TEXT,
    title TEXT,
    poster TEXT,
    banner TEXT,
    rating NUMERIC,
    year INTEGER,
    genero TEXT,
    recommendation_score INTEGER,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Retornar filmes populares (mais assistidos recentemente)
    RETURN QUERY
    SELECT 
        c.id AS content_id,
        'movie'::TEXT AS content_type,
        c.titulo AS title,
        c.poster,
        c.poster AS banner,
        c.rating::NUMERIC AS rating,
        c.year::INTEGER AS year,
        c.genero,
        1::INTEGER AS recommendation_score,
        'Conteúdo popular'::TEXT AS reason
    FROM cinema c
    ORDER BY c.year DESC, c.rating DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_popular_content TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_content TO anon;

COMMENT ON FUNCTION get_popular_content IS 'Retorna conteúdo popular como fallback quando usuário não tem dados suficientes';
