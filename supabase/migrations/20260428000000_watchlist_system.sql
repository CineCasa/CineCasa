-- Migration: Sistema de Watchlist (Ver Depois)
-- Criação da tabela watchlist e funções RPC para gerenciamento

-- 1. Criar tabela watchlist
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
    titulo TEXT NOT NULL,
    poster TEXT,
    banner TEXT,
    rating TEXT,
    year TEXT,
    genero TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id, content_type)
);

-- 2. Comentários na tabela
COMMENT ON TABLE watchlist IS 'Lista de conteúdos salvos para ver depois pelos usuários';
COMMENT ON COLUMN watchlist.content_id IS 'ID do conteúdo (referência à tabela cinema ou series)';
COMMENT ON COLUMN watchlist.content_type IS 'Tipo do conteúdo: movie ou series';

-- 3. Habilitar RLS na tabela
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de segurança (RLS)

-- Política para SELECT: usuários só veem sua própria watchlist
CREATE POLICY "watchlist_select_policy" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

-- Política para INSERT: usuários só inserem em sua própria watchlist
CREATE POLICY "watchlist_insert_policy" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para DELETE: usuários só deletam de sua própria watchlist
CREATE POLICY "watchlist_delete_policy" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Função RPC: Adicionar à watchlist
CREATE OR REPLACE FUNCTION add_to_watchlist(
    p_content_id INTEGER,
    p_content_type TEXT,
    p_titulo TEXT,
    p_poster TEXT DEFAULT NULL,
    p_banner TEXT DEFAULT NULL,
    p_rating TEXT DEFAULT NULL,
    p_year TEXT DEFAULT NULL,
    p_genero TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Verificar usuário autenticado
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não autenticado'
        );
    END IF;

    -- Verificar se já existe na watchlist
    IF EXISTS (
        SELECT 1 FROM watchlist 
        WHERE user_id = v_user_id 
        AND content_id = p_content_id 
        AND content_type = p_content_type
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Conteúdo já está na watchlist'
        );
    END IF;

    -- Inserir na watchlist
    INSERT INTO watchlist (
        user_id,
        content_id,
        content_type,
        titulo,
        poster,
        banner,
        rating,
        year,
        genero
    ) VALUES (
        v_user_id,
        p_content_id,
        p_content_type,
        p_titulo,
        p_poster,
        p_banner,
        p_rating,
        p_year,
        p_genero
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Adicionado à watchlist'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;

-- 6. Função RPC: Remover da watchlist
CREATE OR REPLACE FUNCTION remove_from_watchlist(
    p_content_id INTEGER,
    p_content_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_deleted INTEGER;
BEGIN
    -- Verificar usuário autenticado
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Usuário não autenticado'
        );
    END IF;

    -- Deletar da watchlist
    DELETE FROM watchlist
    WHERE user_id = v_user_id
    AND content_id = p_content_id
    AND content_type = p_content_type;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    IF v_deleted > 0 THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Removido da watchlist'
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Conteúdo não encontrado na watchlist'
        );
    END IF;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;

-- 7. Função RPC: Verificar se está na watchlist
CREATE OR REPLACE FUNCTION is_in_watchlist(
    p_content_id INTEGER,
    p_content_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Verificar usuário autenticado
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    -- Verificar se existe na watchlist
    SELECT EXISTS(
        SELECT 1 FROM watchlist 
        WHERE user_id = v_user_id 
        AND content_id = p_content_id 
        AND content_type = p_content_type
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

-- 8. Função RPC: Buscar watchlist do usuário
CREATE OR REPLACE FUNCTION get_user_watchlist()
RETURNS TABLE (
    id UUID,
    content_id INTEGER,
    content_type TEXT,
    titulo TEXT,
    poster TEXT,
    banner TEXT,
    rating TEXT,
    year TEXT,
    genero TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Verificar usuário autenticado
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        w.id,
        w.content_id,
        w.content_type,
        w.titulo,
        w.poster,
        w.banner,
        w.rating,
        w.year,
        w.genero,
        w.created_at
    FROM watchlist w
    WHERE w.user_id = v_user_id
    ORDER BY w.created_at DESC;
END;
$$;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION add_to_watchlist TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_watchlist TO authenticated;
GRANT EXECUTE ON FUNCTION is_in_watchlist TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_watchlist TO authenticated;

-- 10. Índices para performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_content ON watchlist(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at DESC);
