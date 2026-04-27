-- ============================================================================
-- SISTEMA PROFISSIONAL DE PROGRESSO DO USUÁRIO
-- Fonte única de verdade: tabela user_progress
-- ============================================================================

-- ============================================================================
-- 1. CORREÇÃO DA TABELA (garantir consistência)
-- ============================================================================

-- Adicionar coluna last_watched se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_progress' AND column_name = 'last_watched'
    ) THEN
        ALTER TABLE user_progress ADD COLUMN last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        CREATE INDEX IF NOT EXISTS idx_user_progress_last_watched ON user_progress(last_watched DESC);
    END IF;
END $$;

-- Garantir que updated_at sempre atualize
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_user_progress_updated_at'
    ) THEN
        CREATE TRIGGER set_user_progress_updated_at
            BEFORE UPDATE ON user_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- 2. FUNÇÃO RPC: UPSERT DO PROGRESSO
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_user_progress(
    p_user_id UUID,
    p_content_id INTEGER,
    p_content_type TEXT,
    p_current_time INTEGER DEFAULT 0,
    p_duration INTEGER DEFAULT 0,
    p_progress INTEGER DEFAULT 0,
    p_episode_id INTEGER DEFAULT NULL,
    p_season_number INTEGER DEFAULT NULL,
    p_episode_number INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
    v_existing_id UUID;
    v_computed_progress INTEGER;
BEGIN
    -- Validar entrada
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_id obrigatório');
    END IF;

    IF p_content_id IS NULL OR p_content_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'content_id e content_type obrigatórios');
    END IF;

    -- Calcular progresso se não fornecido
    v_computed_progress := p_progress;
    IF p_duration > 0 AND p_progress = 0 AND p_current_time > 0 THEN
        v_computed_progress := LEAST(100, GREATEST(0, (p_current_time * 100 / p_duration)));
    END IF;

    -- Tentar encontrar registro existente
    SELECT id INTO v_existing_id
    FROM user_progress
    WHERE user_id = p_user_id
      AND content_id = p_content_id
      AND content_type = p_content_type
      AND (p_episode_id IS NULL OR episode_id = p_episode_id OR episode_id IS NULL);

    IF v_existing_id IS NOT NULL THEN
        -- Atualizar registro existente
        UPDATE user_progress
        SET 
            current_time = p_current_time,
            duration = p_duration,
            progress = v_computed_progress,
            episode_id = COALESCE(p_episode_id, episode_id),
            season_number = COALESCE(p_season_number, season_number),
            episode_number = COALESCE(p_episode_number, episode_number),
            last_watched = NOW(),
            updated_at = NOW()
        WHERE id = v_existing_id;

        v_result := jsonb_build_object(
            'success', true,
            'action', 'updated',
            'id', v_existing_id,
            'progress', v_computed_progress
        );
    ELSE
        -- Inserir novo registro
        INSERT INTO user_progress (
            user_id, content_id, content_type,
            current_time, duration, progress,
            episode_id, season_number, episode_number,
            last_watched, updated_at
        ) VALUES (
            p_user_id, p_content_id, p_content_type,
            p_current_time, p_duration, v_computed_progress,
            p_episode_id, p_season_number, p_episode_number,
            NOW(), NOW()
        )
        RETURNING id INTO v_existing_id;

        v_result := jsonb_build_object(
            'success', true,
            'action', 'inserted',
            'id', v_existing_id,
            'progress', v_computed_progress
        );
    END IF;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- 3. FUNÇÃO RPC: GET CONTINUE WATCHING (Otimizada)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_continue_watching(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content_id INTEGER,
    content_type TEXT,
    current_time INTEGER,
    duration INTEGER,
    progress INTEGER,
    episode_id INTEGER,
    season_number INTEGER,
    episode_number INTEGER,
    last_watched TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    priority_score DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH ranked_progress AS (
        SELECT 
            up.*,
            -- Score de prioridade: 
            -- Menor progresso = maior prioridade (conteúdos abandonados recentemente)
            -- Recência = prioridade adicional
            CASE 
                WHEN up.progress < 10 THEN 1000  -- Muito recente (começou agora)
                WHEN up.progress < 30 THEN 800   -- Iniciado
                WHEN up.progress < 50 THEN 600   -- Na metade
                WHEN up.progress < 70 THEN 400   -- Quase lá
                WHEN up.progress < 90 THEN 200   -- Finalizando
                ELSE 100                           -- Já quase terminou
            END + 
            EXTRACT(EPOCH FROM (NOW() - up.last_watched)) / 3600.0 * -0.1  -- Penalidade por tempo
            AS priority_score
        FROM user_progress up
        WHERE up.user_id = p_user_id
          AND up.progress < 95  -- Não mostrar conteúdos já concluídos
          AND up.progress > 0   -- Não mostrar conteúdos nunca iniciados
    )
    SELECT 
        rp.id,
        rp.content_id,
        rp.content_type,
        rp.current_time,
        rp.duration,
        rp.progress,
        rp.episode_id,
        rp.season_number,
        rp.episode_number,
        rp.last_watched,
        rp.updated_at,
        rp.priority_score
    FROM ranked_progress rp
    ORDER BY rp.priority_score DESC, rp.last_watched DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 4. FUNÇÃO RPC: REMOVER PROGRESSO
-- ============================================================================

CREATE OR REPLACE FUNCTION remove_user_progress(
    p_user_id UUID,
    p_content_id INTEGER,
    p_content_type TEXT,
    p_episode_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_user_id IS NULL OR p_content_id IS NULL OR p_content_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Parâmetros obrigatórios faltando');
    END IF;

    DELETE FROM user_progress
    WHERE user_id = p_user_id
      AND content_id = p_content_id
      AND content_type = p_content_type
      AND (p_episode_id IS NULL OR episode_id = p_episode_id);

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'deleted', v_deleted_count > 0,
        'count', v_deleted_count
    );
END;
$$;

-- ============================================================================
-- 5. FUNÇÃO RPC: MARCAR COMO CONCLUÍDO (remover da seção)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_as_completed(
    p_user_id UUID,
    p_content_id INTEGER,
    p_content_type TEXT,
    p_episode_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_id obrigatório');
    END IF;

    -- Atualizar progresso para 100 ou remover (opcional)
    UPDATE user_progress
    SET 
        progress = 100,
        current_time = duration,
        updated_at = NOW(),
        last_watched = NOW()
    WHERE user_id = p_user_id
      AND content_id = p_content_id
      AND content_type = p_content_type
      AND (p_episode_id IS NULL OR episode_id = p_episode_id);

    RETURN jsonb_build_object('success', true, 'marked', true);
END;
$$;

-- ============================================================================
-- 6. FUNÇÃO RPC: LIMPAR TODO PROGRESSO DO USUÁRIO
-- ============================================================================

CREATE OR REPLACE FUNCTION clear_user_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_id obrigatório');
    END IF;

    DELETE FROM user_progress WHERE user_id = p_user_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'cleared', true,
        'deleted_count', v_deleted_count
    );
END;
$$;

-- ============================================================================
-- 7. GARANTIR PERMISSÕES
-- ============================================================================

GRANT EXECUTE ON FUNCTION upsert_user_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_continue_watching TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_progress TO authenticated;
GRANT EXECUTE ON FUNCTION mark_as_completed TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_progress TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_progress TO anon;
GRANT EXECUTE ON FUNCTION get_continue_watching TO anon;
GRANT EXECUTE ON FUNCTION remove_user_progress TO anon;
GRANT EXECUTE ON FUNCTION mark_as_completed TO anon;
GRANT EXECUTE ON FUNCTION clear_user_progress TO anon;

-- ============================================================================
-- 8. INDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_progress_content_lookup 
    ON user_progress(user_id, content_id, content_type, episode_id);

CREATE INDEX IF NOT EXISTS idx_user_progress_not_completed 
    ON user_progress(user_id, progress) 
    WHERE progress < 95;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
