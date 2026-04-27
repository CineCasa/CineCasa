-- Sistema Profissional de Progresso do Usuário
-- Usa apenas a tabela user_progress como fonte única de verdade

-- 1. Adicionar coluna last_watched se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_progress' AND column_name = 'last_watched'
    ) THEN
        ALTER TABLE user_progress ADD COLUMN last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Criar índice para last_watched
CREATE INDEX IF NOT EXISTS idx_user_progress_last_watched ON user_progress(last_watched DESC);

-- 3. Função RPC: UPSERT do progresso (atualiza ou insere)
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
AS $$
DECLARE
    v_result JSONB;
    v_existing_id UUID;
BEGIN
    -- Validar entrada
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_id obrigatório');
    END IF;

    IF p_content_id IS NULL OR p_content_type IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'content_id e content_type obrigatórios');
    END IF;

    -- Buscar registro existente
    SELECT id INTO v_existing_id
    FROM user_progress
    WHERE user_id = p_user_id
      AND content_id = p_content_id
      AND content_type = p_content_type
      AND (p_episode_id IS NULL OR episode_id IS NULL OR episode_id = p_episode_id);

    IF v_existing_id IS NOT NULL THEN
        -- Atualizar registro existente
        UPDATE user_progress
        SET 
            current_time = p_current_time,
            duration = p_duration,
            progress = p_progress,
            episode_id = COALESCE(p_episode_id, episode_id),
            season_number = COALESCE(p_season_number, season_number),
            episode_number = COALESCE(p_episode_number, episode_number),
            last_watched = NOW(),
            updated_at = NOW()
        WHERE id = v_existing_id;

        v_result := jsonb_build_object(
            'success', true,
            'action', 'updated',
            'id', v_existing_id
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
            p_current_time, p_duration, p_progress,
            p_episode_id, p_season_number, p_episode_number,
            NOW(), NOW()
        )
        RETURNING id INTO v_existing_id;

        v_result := jsonb_build_object(
            'success', true,
            'action', 'inserted',
            'id', v_existing_id
        );
    END IF;

    RETURN v_result;
END;
$$;

-- 4. Função RPC: GET CONTINUE WATCHING (query otimizada)
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
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.content_id,
        up.content_type,
        up.current_time,
        up.duration,
        up.progress,
        up.episode_id,
        up.season_number,
        up.episode_number,
        up.last_watched,
        up.updated_at
    FROM user_progress up
    WHERE up.user_id = p_user_id
      AND up.progress < 95  -- Não concluído
      AND up.progress > 0   -- Já iniciado
    ORDER BY up.last_watched DESC
    LIMIT p_limit;
END;
$$;

-- 5. Função RPC: Remover progresso
CREATE OR REPLACE FUNCTION remove_user_progress(
    p_user_id UUID,
    p_content_id INTEGER,
    p_content_type TEXT,
    p_episode_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM user_progress
    WHERE user_id = p_user_id
      AND content_id = p_content_id
      AND content_type = p_content_type
      AND (p_episode_id IS NULL OR episode_id = p_episode_id);

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted);
END;
$$;

-- 6. Função RPC: Limpar todo progresso do usuário
CREATE OR REPLACE FUNCTION clear_user_progress(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM user_progress WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted_count', v_deleted);
END;
$$;

-- 7. Garantir permissões
GRANT EXECUTE ON FUNCTION upsert_user_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_continue_watching TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_progress TO authenticated;
GRANT EXECUTE ON FUNCTION clear_user_progress TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_progress TO anon;
GRANT EXECUTE ON FUNCTION get_continue_watching TO anon;
GRANT EXECUTE ON FUNCTION remove_user_progress TO anon;
GRANT EXECUTE ON FUNCTION clear_user_progress TO anon;

-- 8. Índice adicional para performance
CREATE INDEX IF NOT EXISTS idx_user_progress_lookup 
    ON user_progress(user_id, content_id, content_type, episode_id);
