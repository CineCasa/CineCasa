-- Migration: Integração de user_genre_preferences com Sistema de Recomendação
-- Data: 2026-05-03
-- Objetivo: Recomendações personalizadas baseadas nos gêneros preferidos do usuário

-- ============================================
-- 1. FUNÇÃO: Atualizar Pontuação de Gênero
-- ============================================
-- Atualiza a tabela user_genre_preferences baseado em interações do usuário
-- Pontuação:
--   liked (favorito) → +10
--   saved (salvo) → +7
--   rated >= 8 → +8
--   rated 6-7 → +5
--   rated 4-5 → +2
--   rated <= 3 → -5
--   watched → +6
--   skip → -8
-- ============================================

DROP FUNCTION IF EXISTS update_user_genre_score(UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION update_user_genre_score(
    p_user_id UUID,
    p_genre TEXT,
    p_score_delta INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Inserir ou atualizar pontuação do gênero
    INSERT INTO public.user_genre_preferences (user_id, genre, score, updated_at)
    VALUES (p_user_id, p_genre, GREATEST(0, p_score_delta), NOW())
    ON CONFLICT (user_id, genre) DO UPDATE SET
        score = GREATEST(0, public.user_genre_preferences.score + p_score_delta),
        updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_genre_score TO authenticated;

COMMENT ON FUNCTION update_user_genre_score IS 
'Atualiza a pontuação de um gênero específico para um usuário. Usado pelo trigger de interações.';

-- ============================================
-- 2. TRIGGER: Atualizar Gênero Automaticamente via user_interactions
-- ============================================
-- Sempre que uma interação é registrada, atualiza a pontuação do gênero
-- ============================================

DROP FUNCTION IF EXISTS update_genre_from_interaction() CASCADE;

CREATE OR REPLACE FUNCTION update_genre_from_interaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_score_delta INTEGER := 0;
BEGIN
    -- Só processar se tiver gênero
    IF NEW.genre IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calcular pontuação baseada no tipo de interação
    CASE NEW.interaction_type
        WHEN 'liked' THEN v_score_delta := 10;      -- Favorito: +10
        WHEN 'saved' THEN v_score_delta := 7;       -- Salvo: +7
        WHEN 'rated' THEN 
            IF NEW.rating >= 8 THEN
                v_score_delta := 8;                  -- Nota alta (8-10): +8
            ELSIF NEW.rating >= 6 THEN
                v_score_delta := 5;                  -- Nota média-alta (6-7): +5
            ELSIF NEW.rating >= 4 THEN
                v_score_delta := 2;                  -- Nota média (4-5): +2
            ELSE
                v_score_delta := -5;                 -- Nota baixa (1-3): -5
            END IF;
        WHEN 'watched' THEN v_score_delta := 6;       -- Assistido: +6
        WHEN 'skip' THEN v_score_delta := -8;         -- Pulado: -8
        ELSE v_score_delta := 1;                      -- Outras: +1
    END CASE;

    -- Atualizar pontuação do gênero
    PERFORM update_user_genre_score(NEW.user_id, NEW.genre, v_score_delta);

    RETURN NEW;
END;
$$;

-- Criar trigger na tabela user_interactions
DROP TRIGGER IF EXISTS update_genre_on_interaction ON public.user_interactions;
CREATE TRIGGER update_genre_on_interaction
    AFTER INSERT ON public.user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_genre_from_interaction();

COMMENT ON FUNCTION update_genre_from_interaction IS 
'Trigger que atualiza automaticamente a pontuação de gênero quando uma interação é registrada.';

-- ============================================
-- 3. FUNÇÃO: Recomendação Personalizada por Gênero
-- ============================================
-- Retorna conteúdo recomendado baseado nos gêneros preferidos do usuário
-- Prioriza conteúdos dos gêneros com maior pontuação
-- ============================================

DROP FUNCTION IF EXISTS get_genre_based_recommendations(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_genre_based_recommendations(
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
    genre_score INTEGER,
    recommendation_score NUMERIC,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_top_genres AS (
        -- Obter os gêneros preferidos do usuário (top 10)
        SELECT 
            ugp.genre,
            ugp.score
        FROM public.user_genre_preferences ugp
        WHERE ugp.user_id = p_user_id
        ORDER BY ugp.score DESC
        LIMIT 10
    ),
    scored_content AS (
        -- Buscar conteúdo dos gêneros preferidos
        SELECT 
            c.id::TEXT as content_id,
            'movie'::TEXT as content_type,
            c.titulo as title,
            c.poster,
            c.poster as banner,
            c.rating::NUMERIC as rating,
            c.year::TEXT as year,
            c.genero,
            utg.score as genre_score,
            -- Score final = score do gênero * (rating do filme / 10)
            utg.score * COALESCE(c.rating / 10, 0.5) as rec_score,
            ('⭐ Gênero favorito: ' || utg.genre)::TEXT as reason,
            1 as priority  -- Prioridade alta para match direto
        FROM public.cinema c
        JOIN user_top_genres utg ON c.genero ILIKE '%' || utg.genre || '%'
        WHERE c.poster IS NOT NULL
          AND c.rating IS NOT NULL
        
        UNION ALL
        
        -- Adicionar séries dos gêneros preferidos
        SELECT 
            s.id_n::TEXT as content_id,
            'series'::TEXT as content_type,
            s.titulo as title,
            s.capa as poster,
            s.banner,
            NULL::NUMERIC as rating,
            NULL::TEXT as year,
            s.genero,
            utg.score as genre_score,
            utg.score * 0.7 as rec_score,  -- Peso menor para séries sem rating
            ('📺 Série do gênero: ' || utg.genre)::TEXT as reason,
            2 as priority  -- Prioridade menor
        FROM public.series s
        JOIN user_top_genres utg ON s.genero ILIKE '%' || utg.genre || '%'
        WHERE s.banner IS NOT NULL
    ),
    -- Remover duplicados e pegar o melhor score por conteúdo
    best_content AS (
        SELECT DISTINCT ON (content_id)
            content_id,
            content_type,
            title,
            poster,
            banner,
            rating,
            year,
            genero,
            genre_score,
            rec_score as recommendation_score,
            reason
        FROM scored_content
        ORDER BY content_id, rec_score DESC
    )
    SELECT * FROM best_content
    ORDER BY recommendation_score DESC, genre_score DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_genre_based_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_genre_based_recommendations TO anon;

COMMENT ON FUNCTION get_genre_based_recommendations IS 
'Retorna recomendações personalizadas baseadas nos gêneros preferidos do usuário na tabela user_genre_preferences.';

-- ============================================
-- 4. FUNÇÃO: Combinar Recomendações ML + Gênero
-- ============================================
-- Retorna recomendações híbridas considerando:
-- 1. Comportamento individual (ML)
-- 2. Preferências de gênero (user_genre_preferences)
-- ============================================

DROP FUNCTION IF EXISTS get_hybrid_recommendations(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_hybrid_recommendations(
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
    ml_score NUMERIC,
    genre_score INTEGER,
    final_score NUMERIC,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH ml_recs AS (
        -- Recomendações baseadas em ML (comportamento)
        SELECT 
            r.content_id,
            r.content_type,
            r.title,
            r.poster,
            r.banner,
            r.rating,
            r.year,
            r.genero,
            r.recommendation_score as ml_score,
            0::INTEGER as genre_score,
            r.reason as ml_reason
        FROM get_ml_recommendations(p_user_id, p_limit * 2) r
    ),
    genre_recs AS (
        -- Recomendações baseadas em gênero
        SELECT 
            r.content_id,
            r.content_type,
            r.title,
            r.poster,
            r.banner,
            r.rating,
            r.year,
            r.genero,
            0::NUMERIC as ml_score,
            r.genre_score,
            r.reason as genre_reason
        FROM get_genre_based_recommendations(p_user_id, p_limit * 2) r
    ),
    combined AS (
        -- Combinar ambas as fontes
        SELECT 
            COALESCE(ml.content_id, gr.content_id) as content_id,
            COALESCE(ml.content_type, gr.content_type) as content_type,
            COALESCE(ml.title, gr.title) as title,
            COALESCE(ml.poster, gr.poster) as poster,
            COALESCE(ml.banner, gr.banner) as banner,
            COALESCE(ml.rating, gr.rating) as rating,
            COALESCE(ml.year, gr.year) as year,
            COALESCE(ml.genero, gr.genero) as genero,
            COALESCE(ml.ml_score, 0) as ml_score,
            COALESCE(gr.genre_score, 0) as genre_score,
            -- Score final combinado: 60% ML + 40% Gênero
            (COALESCE(ml.ml_score, 0) * 0.6 + COALESCE(gr.genre_score, 0) * 0.4) as final_score,
            CASE 
                WHEN ml.content_id IS NOT NULL AND gr.content_id IS NOT NULL 
                    THEN '🔥 Baseado no seu histórico e gêneros favoritos'
                WHEN ml.content_id IS NOT NULL 
                    THEN COALESCE(ml.ml_reason, 'Baseado no seu histórico')
                ELSE COALESCE(gr.genre_reason, 'Dos seus gêneros favoritos')
            END as reason
        FROM ml_recs ml
        FULL OUTER JOIN genre_recs gr ON ml.content_id = gr.content_id
    )
    SELECT DISTINCT ON (combined.content_id)
        combined.content_id,
        combined.content_type,
        combined.title,
        combined.poster,
        combined.banner,
        combined.rating,
        combined.year,
        combined.genero,
        combined.ml_score,
        combined.genre_score,
        combined.final_score,
        combined.reason
    FROM combined
    WHERE combined.title IS NOT NULL  -- Garantir que temos dados válidos
    ORDER BY combined.content_id, combined.final_score DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_hybrid_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_hybrid_recommendations TO anon;

COMMENT ON FUNCTION get_hybrid_recommendations IS 
'Retorna recomendações híbridas combinando ML (comportamento) + preferências de gênero. Score: 60% ML + 40% Gênero.';

-- ============================================
-- 5. FUNÇÃO: Obter Top Gêneros do Usuário
-- ============================================

DROP FUNCTION IF EXISTS get_user_top_genres(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_user_top_genres(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    genre TEXT,
    score INTEGER,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH total AS (
        SELECT NULLIF(SUM(score), 0) as total_score
        FROM public.user_genre_preferences
        WHERE user_id = p_user_id
    )
    SELECT 
        ugp.genre,
        ugp.score,
        ROUND((ugp.score::NUMERIC / NULLIF(t.total_score, 0)) * 100, 1) as percentage
    FROM public.user_genre_preferences ugp
    CROSS JOIN total t
    WHERE ugp.user_id = p_user_id
    ORDER BY ugp.score DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_top_genres TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_top_genres TO anon;

COMMENT ON FUNCTION get_user_top_genres IS 
'Retorna os gêneros mais preferidos do usuário com suas pontuações e percentuais.';

-- ============================================
-- 6. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_genre_preferences_score 
    ON public.user_genre_preferences(user_id, score DESC);

COMMENT ON INDEX idx_user_genre_preferences_score IS 
'Índice para buscar gêneros preferidos do usuário ordenados por score';

-- ============================================
-- RESUMO
-- ============================================
-- Funções criadas:
-- 1. update_user_genre_score() - Atualiza pontuação de um gênero
-- 2. update_genre_from_interaction() - Trigger para atualizar automaticamente
-- 3. get_genre_based_recommendations() - Recomendações por gênero
-- 4. get_hybrid_recommendations() - Recomendações híbridas (ML + Gênero)
-- 5. get_user_top_genres() - Top gêneros do usuário
--
-- Sistema de Pontuação Automática:
--   liked → +10
--   saved → +7
--   rated >= 8 → +8
--   rated 6-7 → +5
--   rated 4-5 → +2
--   rated <= 3 → -5
--   watched → +6
--   skip → -8
--
-- Integração Realtime: Trigger já configurado para atualizar em tempo real
