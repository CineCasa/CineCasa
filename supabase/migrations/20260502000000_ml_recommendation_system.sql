-- Migration: Sistema de Recomendação com ML Simples (Aprendizado Contínuo)
-- Data: 2026-05-02
-- Objetivo: Recomendação inteligente + Aprendizado contínuo baseado em comportamento

-- ============================================
-- 1. TABELA: Pesos por Gênero (Sistema de ML Simples)
-- ============================================
-- Armazena pesos dinâmicos para cada gênero baseado em:
-- - Taxa de retenção (conclusão)
-- - Taxa de abandono
-- - Rating médio
-- - Popularidade global
-- ============================================

CREATE TABLE IF NOT EXISTS public.genre_weights (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    genre text NOT NULL UNIQUE,
    weight numeric(5,2) NOT NULL DEFAULT 1.0,      -- Peso base (1.0 = neutro)
    retention_rate numeric(5,2) DEFAULT 0,        -- Taxa de conclusão (0-1)
    abandonment_rate numeric(5,2) DEFAULT 0,      -- Taxa de abandono (0-1)
    avg_rating numeric(3,1) DEFAULT 0,            -- Rating médio (0-10)
    total_interactions integer DEFAULT 0,       -- Total de interações
    last_calculated_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Índices para genre_weights
CREATE INDEX IF NOT EXISTS idx_genre_weights_genre ON public.genre_weights(genre);
CREATE INDEX IF NOT EXISTS idx_genre_weights_weight ON public.genre_weights(weight DESC);

-- RLS: Apenas admins podem modificar, todos podem ler
ALTER TABLE public.genre_weights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view genre weights" ON public.genre_weights;
CREATE POLICY "Anyone can view genre weights" 
  ON public.genre_weights FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Only admins can modify genre weights" ON public.genre_weights;
CREATE POLICY "Only admins can modify genre weights" 
  ON public.genre_weights FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_genre_weights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_genre_weights_timestamp ON public.genre_weights;
CREATE TRIGGER update_genre_weights_timestamp
    BEFORE UPDATE ON public.genre_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_genre_weights_timestamp();

-- ============================================
-- 2. FUNÇÃO: Calcular Pesos por Gênero (ML Simples)
-- ============================================
-- Analisa user_interactions globalmente e calcula:
-- - Retenção: conteúdo assistido até o fim / total
-- - Abandono: conteúdo pulado / total
-- - Rating médio por gênero
-- Atualiza pesos automaticamente
-- ============================================

DROP FUNCTION IF EXISTS calculate_genre_weights();

CREATE OR REPLACE FUNCTION calculate_genre_weights()
RETURNS TABLE (
    genre text,
    new_weight numeric,
    retention_rate numeric,
    abandonment_rate numeric,
    avg_rating numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH genre_stats AS (
        -- Estatísticas por gênero baseadas em user_interactions
        SELECT 
            ui.genre,
            COUNT(*) as total_interactions,
            COUNT(*) FILTER (WHERE ui.interaction_type = 'watched') as watched_count,
            COUNT(*) FILTER (WHERE ui.interaction_type = 'skip') as skip_count,
            COUNT(*) FILTER (WHERE ui.interaction_type = 'rated') as rated_count,
            AVG(ui.rating) FILTER (WHERE ui.interaction_type = 'rated') as avg_rating,
            -- Conteúdo "concluído" = watched OU (rated >= 7) OU (saved)
            COUNT(*) FILTER (WHERE ui.interaction_type IN ('watched', 'saved') 
                           OR (ui.interaction_type = 'rated' AND ui.rating >= 7)) as completed_count
        FROM public.user_interactions ui
        WHERE ui.genre IS NOT NULL
        GROUP BY ui.genre
        HAVING COUNT(*) >= 5  -- Mínimo de 5 interações para considerar
    ),
    calculated AS (
        SELECT 
            gs.genre,
            gs.total_interactions,
            -- Taxa de retenção: conteúdo concluído / total
            COALESCE(gs.completed_count::numeric / NULLIF(gs.total_interactions, 0), 0) as retention,
            -- Taxa de abandono: skips / total
            COALESCE(gs.skip_count::numeric / NULLIF(gs.total_interactions, 0), 0) as abandonment,
            COALESCE(gs.avg_rating, 0) as avg_rating,
            -- Cálculo do peso final:
            -- Base: 1.0
            -- + (retention * 2.0)           -- Bônus por retenção (até +2.0)
            -- - (abandonment * 2.0)        -- Penalidade por abandono (até -2.0)
            -- + (avg_rating / 10 * 1.0)    -- Bônus por rating (até +1.0)
            -- Range final: 0.0 a 4.0
            GREATEST(0.1, LEAST(4.0, 
                1.0 
                + (COALESCE(gs.completed_count::numeric / NULLIF(gs.total_interactions, 0), 0) * 2.0)
                - (COALESCE(gs.skip_count::numeric / NULLIF(gs.total_interactions, 0), 0) * 2.0)
                + (COALESCE(gs.avg_rating, 5) / 10.0 * 1.0)
            )) as calculated_weight
        FROM genre_stats gs
    )
    -- Inserir ou atualizar na tabela genre_weights
    INSERT INTO public.genre_weights (
        genre, weight, retention_rate, abandonment_rate, avg_rating, 
        total_interactions, last_calculated_at
    )
    SELECT 
        c.genre,
        c.calculated_weight,
        c.retention,
        c.abandonment,
        c.avg_rating,
        c.total_interactions,
        NOW()
    FROM calculated c
    ON CONFLICT (genre) DO UPDATE SET
        weight = EXCLUDED.weight,
        retention_rate = EXCLUDED.retention_rate,
        abandonment_rate = EXCLUDED.abandonment_rate,
        avg_rating = EXCLUDED.avg_rating,
        total_interactions = EXCLUDED.total_interactions,
        last_calculated_at = NOW()
    RETURNING 
        genre_weights.genre,
        genre_weights.weight as new_weight,
        genre_weights.retention_rate,
        genre_weights.abandonment_rate,
        genre_weights.avg_rating;
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_genre_weights TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_genre_weights TO anon;

COMMENT ON FUNCTION calculate_genre_weights IS 
'Calcula pesos dinâmicos para cada gênero baseado em comportamento global dos usuários. 
Retenção alta = peso maior. Abandono alto = peso menor.';

-- ============================================
-- 3. FUNÇÃO: Recomendação Inteligente com Pesos Dinâmicos
-- ============================================
-- Sistema de Score:
--   rating positivo (>=7)     → +5
--   favoritos (liked)         → +6
--   progresso alto (>80%)     → +3
--   conteúdo concluído        → +4
--   abandono (skip)           → -3
--   gênero preferido (+peso)  → +2 * genre_weight
-- ============================================

DROP FUNCTION IF EXISTS get_ml_recommendations(UUID, INTEGER);

CREATE OR REPLACE FUNCTION get_ml_recommendations(
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
    recommendation_score NUMERIC,
    reason TEXT,
    genre_weight NUMERIC,
    last_interaction_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_interaction_scores AS (
        -- Score baseado nas interações do usuário
        SELECT 
            ui.content_id,
            ui.content_type,
            ui.genre,
            SUM(
                CASE 
                    -- Rating positivo (7-10) → +5
                    WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN 5
                    -- Rating médio (4-6) → +2
                    WHEN ui.interaction_type = 'rated' AND ui.rating BETWEEN 4 AND 6 THEN 2
                    -- Rating negativo (1-3) → -2
                    WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN -2
                    -- Favoritos → +6
                    WHEN ui.interaction_type = 'liked' THEN 6
                    -- Salvos → +4
                    WHEN ui.interaction_type = 'saved' THEN 4
                    -- Assistido completamente → +4
                    WHEN ui.interaction_type = 'watched' THEN 4
                    -- Skip/abandono → -3
                    WHEN ui.interaction_type = 'skip' THEN -3
                    ELSE 0
                END
            ) AS interaction_score,
            MAX(ui.created_at) AS last_interaction,
            STRING_AGG(DISTINCT 
                CASE 
                    WHEN ui.interaction_type = 'liked' THEN '⭐ Favorito'
                    WHEN ui.interaction_type = 'saved' THEN '💾 Salvo'
                    WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN '👍 Bem avaliado'
                    WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN '👎 Não recomendado'
                    WHEN ui.interaction_type = 'watched' THEN '▶️ Assistido'
                    WHEN ui.interaction_type = 'skip' THEN '⏭️ Pulado'
                    ELSE NULL
                END, 
                ' | '
                ORDER BY 
                CASE 
                    WHEN ui.interaction_type = 'liked' THEN '⭐ Favorito'
                    WHEN ui.interaction_type = 'saved' THEN '💾 Salvo'
                    WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN '👍 Bem avaliado'
                    WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN '👎 Não recomendado'
                    WHEN ui.interaction_type = 'watched' THEN '▶️ Assistido'
                    WHEN ui.interaction_type = 'skip' THEN '⏭️ Pulado'
                    ELSE NULL
                END
            ) AS reasons
        FROM public.user_interactions ui
        WHERE ui.user_id = p_user_id
        GROUP BY ui.content_id, ui.content_type, ui.genre
        HAVING SUM(
            CASE 
                WHEN ui.interaction_type = 'rated' AND ui.rating >= 7 THEN 5
                WHEN ui.interaction_type = 'rated' AND ui.rating BETWEEN 4 AND 6 THEN 2
                WHEN ui.interaction_type = 'rated' AND ui.rating <= 3 THEN -2
                WHEN ui.interaction_type = 'liked' THEN 6
                WHEN ui.interaction_type = 'saved' THEN 4
                WHEN ui.interaction_type = 'watched' THEN 4
                WHEN ui.interaction_type = 'skip' THEN -3
                ELSE 0
            END
        ) > 0  -- Apenas conteúdo com score positivo
    ),
    -- Obter gêneros preferidos do usuário ponderados pelos pesos do ML
    user_weighted_genres AS (
        SELECT 
            uis.genre,
            SUM(uis.interaction_score) as user_score,
            COALESCE(gw.weight, 1.0) as genre_weight,
            SUM(uis.interaction_score * COALESCE(gw.weight, 1.0)) as weighted_score
        FROM user_interaction_scores uis
        LEFT JOIN public.genre_weights gw ON gw.genre = uis.genre
        WHERE uis.genre IS NOT NULL
        GROUP BY uis.genre, gw.weight
        ORDER BY weighted_score DESC
        LIMIT 5
    ),
    -- Calcular score final com pesos de gênero
    scored_content AS (
        SELECT 
            uis.content_id,
            uis.content_type,
            uis.genre,
            uis.interaction_score,
            uis.last_interaction,
            uis.reasons,
            COALESCE(gw.weight, 1.0) as genre_weight,
            -- Score final = interação + (bônus de gênero ponderado)
            uis.interaction_score + (2 * COALESCE(gw.weight, 1.0)) as final_score
        FROM user_interaction_scores uis
        LEFT JOIN public.genre_weights gw ON gw.genre = uis.genre
    ),
    -- Encontrar conteúdo similar baseado nos gêneros ponderados
    similar_content AS (
        SELECT 
            c.id::TEXT as content_id,
            'movie'::TEXT as content_type,
            c.titulo as title,
            c.poster,
            c.poster as banner,
            c.nota::NUMERIC as rating,
            c.ano::TEXT as year,
            c.genero,
            2.0 * COALESCE(gw.weight, 1.0) as final_score,  -- Score base * peso do gênero
            '🎯 Similar aos seus gostos'::TEXT as reasons,
            COALESCE(gw.weight, 1.0) as genre_weight,
            NULL::timestamptz as last_interaction
        FROM public.cinema c
        CROSS JOIN user_weighted_genres uwg
        LEFT JOIN public.genre_weights gw ON gw.genre = c.genero
        WHERE c.genero ILIKE '%' || uwg.genre || '%'
          AND c.id::TEXT NOT IN (SELECT uis.content_id FROM user_interaction_scores uis)
          AND c.poster IS NOT NULL
        LIMIT 30
    )
    -- Retornar resultados combinados
    SELECT 
        sc.content_id,
        sc.content_type,
        CASE 
            WHEN sc.content_type = 'movie' THEN (SELECT c.titulo FROM public.cinema c WHERE c.id::TEXT = sc.content_id LIMIT 1)
            WHEN sc.content_type = 'series' THEN (SELECT s.titulo FROM public.series s WHERE s.id_n::TEXT = sc.content_id LIMIT 1)
            ELSE 'Unknown'
        END as title,
        CASE 
            WHEN sc.content_type = 'movie' THEN (SELECT c.poster FROM public.cinema c WHERE c.id::TEXT = sc.content_id LIMIT 1)
            WHEN sc.content_type = 'series' THEN (SELECT s.banner FROM public.series s WHERE s.id_n::TEXT = sc.content_id LIMIT 1)
            ELSE NULL
        END as poster,
        CASE 
            WHEN sc.content_type = 'movie' THEN (SELECT c.poster FROM public.cinema c WHERE c.id::TEXT = sc.content_id LIMIT 1)
            WHEN sc.content_type = 'series' THEN (SELECT s.banner FROM public.series s WHERE s.id_n::TEXT = sc.content_id LIMIT 1)
            ELSE NULL
        END as banner,
        CASE 
            WHEN sc.content_type = 'movie' THEN (SELECT c.nota::NUMERIC FROM public.cinema c WHERE c.id::TEXT = sc.content_id LIMIT 1)
            ELSE NULL
        END as rating,
        CASE 
            WHEN sc.content_type = 'movie' THEN (SELECT c.ano::TEXT FROM public.cinema c WHERE c.id::TEXT = sc.content_id LIMIT 1)
            ELSE NULL
        END as year,
        sc.genre as genero,
        sc.final_score as recommendation_score,
        COALESCE(sc.reasons, 'Baseado no seu histórico') as reason,
        sc.genre_weight,
        sc.last_interaction as last_interaction_at
    FROM scored_content sc
    
    UNION ALL
    
    SELECT * FROM similar_content
    
    ORDER BY recommendation_score DESC, last_interaction_at DESC NULLS LAST
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ml_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_ml_recommendations TO anon;

COMMENT ON FUNCTION get_ml_recommendations IS 
'Retorna recomendações inteligentes usando ML simples com pesos dinâmicos por gênero.
Integra comportamento individual do usuário com aprendizado global.';

-- ============================================
-- 4. FUNÇÃO: Job Periódico para Atualização de Pesos
-- ============================================
-- Deve ser executada periodicamente (ex: a cada 6 horas via cron)
-- Atualiza os pesos dos gêneros baseado em comportamento recente
-- ============================================

DROP FUNCTION IF EXISTS run_ml_update_job();

CREATE OR REPLACE FUNCTION run_ml_update_job()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_time timestamptz;
    v_end_time timestamptz;
    v_genres_updated integer;
    v_result jsonb;
BEGIN
    v_start_time := clock_timestamp();
    
    -- Executar cálculo de pesos
    SELECT COUNT(*) INTO v_genres_updated
    FROM calculate_genre_weights();
    
    v_end_time := clock_timestamp();
    
    -- Retornar resultado
    v_result := jsonb_build_object(
        'success', true,
        'genres_updated', v_genres_updated,
        'execution_time_ms', EXTRACT(MILLISECOND FROM (v_end_time - v_start_time)),
        'started_at', v_start_time,
        'completed_at', v_end_time
    );
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION run_ml_update_job TO authenticated;
GRANT EXECUTE ON FUNCTION run_ml_update_job TO service_role;

COMMENT ON FUNCTION run_ml_update_job IS 
'Job periódico para atualizar pesos de gêneros. Execute a cada 6 horas para manter ML atualizado.';

-- ============================================
-- 5. FUNÇÃO: Obter Métricas do Sistema ML
-- ============================================

DROP FUNCTION IF EXISTS get_ml_system_metrics();

CREATE OR REPLACE FUNCTION get_ml_system_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'total_genres_tracked', COUNT(*),
        'avg_weight', AVG(weight),
        'top_genres', (
            SELECT jsonb_agg(jsonb_build_object(
                'genre', genre,
                'weight', weight,
                'retention', retention_rate
            ) ORDER BY weight DESC)
            FROM (
                SELECT genre, weight, retention_rate
                FROM public.genre_weights
                ORDER BY weight DESC
                LIMIT 5
            ) t
        ),
        'bottom_genres', (
            SELECT jsonb_agg(jsonb_build_object(
                'genre', genre,
                'weight', weight,
                'abandonment', abandonment_rate
            ) ORDER BY weight ASC)
            FROM (
                SELECT genre, weight, abandonment_rate
                FROM public.genre_weights
                ORDER BY weight ASC
                LIMIT 5
            ) t
        ),
        'last_update', MAX(last_calculated_at)
    ) INTO v_result
    FROM public.genre_weights;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_ml_system_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_ml_system_metrics TO anon;

COMMENT ON FUNCTION get_ml_system_metrics IS 
'Retorna métricas do sistema de ML: pesos dos gêneros, retenção, abandono.';

-- ============================================
-- 6. POPULAR DADOS INICIAIS (Seeds)
-- ============================================

-- Inserir gêneros comuns com peso neutro inicial
INSERT INTO public.genre_weights (genre, weight, retention_rate, abandonment_rate, avg_rating)
VALUES 
    ('Action', 1.0, 0, 0, 0),
    ('Comedy', 1.0, 0, 0, 0),
    ('Drama', 1.0, 0, 0, 0),
    ('Horror', 1.0, 0, 0, 0),
    ('Romance', 1.0, 0, 0, 0),
    ('Sci-Fi', 1.0, 0, 0, 0),
    ('Thriller', 1.0, 0, 0, 0),
    ('Documentary', 1.0, 0, 0, 0),
    ('Animation', 1.0, 0, 0, 0),
    ('Crime', 1.0, 0, 0, 0),
    ('Adventure', 1.0, 0, 0, 0),
    ('Fantasy', 1.0, 0, 0, 0)
ON CONFLICT (genre) DO NOTHING;

-- ============================================
-- RESUMO
-- ============================================
-- Sistema de ML Simples com:
-- 1. Tabela genre_weights: armazena pesos dinâmicos
-- 2. calculate_genre_weights(): calcula pesos baseado em comportamento
-- 3. get_ml_recommendations(): recomendações com pesos integrados
-- 4. run_ml_update_job(): job periódico de atualização
-- 5. get_ml_system_metrics(): métricas do sistema
--
-- Score de Recomendação:
--   rating >= 7     → +5
--   liked           → +6
--   progresso > 80% → +3 (via lógica externa)
--   watched         → +4
--   skip            → -3
--   gênero ponderado→ +2 * genre_weight
--
-- Regras de ML:
--   Formula: 1.0 + (retention * 2.0) - (abandonment * 2.0) + (avg_rating / 10)
--   Range: 0.1 a 4.0
