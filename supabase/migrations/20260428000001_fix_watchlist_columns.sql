-- Migration: Correção da tabela watchlist - Adicionar coluna content_id
-- Executar apenas se a coluna não existir

-- Verificar e adicionar coluna content_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'watchlist' 
        AND column_name = 'content_id'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN content_id INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Verificar e adicionar coluna content_type se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'watchlist' 
        AND column_name = 'content_type'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN content_type TEXT NOT NULL DEFAULT 'movie' CHECK (content_type IN ('movie', 'series'));
    END IF;
END $$;

-- Verificar e adicionar coluna titulo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'watchlist' 
        AND column_name = 'titulo'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN titulo TEXT NOT NULL DEFAULT 'Sem título';
    END IF;
END $$;

-- Verificar e adicionar colunas opcionais
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'watchlist' AND column_name = 'poster'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN poster TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'watchlist' AND column_name = 'banner'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN banner TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'watchlist' AND column_name = 'rating'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN rating TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'watchlist' AND column_name = 'year'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN year TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'watchlist' AND column_name = 'genero'
    ) THEN
        ALTER TABLE watchlist ADD COLUMN genero TEXT;
    END IF;
END $$;

-- Remover o valor DEFAULT após adicionar as colunas (para não afetar inserts futuros)
ALTER TABLE watchlist ALTER COLUMN content_id DROP DEFAULT;
ALTER TABLE watchlist ALTER COLUMN content_type DROP DEFAULT;
ALTER TABLE watchlist ALTER COLUMN titulo DROP DEFAULT;

-- Garantir que RLS está habilitado
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Recriar políticas (idempotent - remover se existir, criar novamente)
DROP POLICY IF EXISTS "watchlist_select_policy" ON watchlist;
DROP POLICY IF EXISTS "watchlist_insert_policy" ON watchlist;
DROP POLICY IF EXISTS "watchlist_delete_policy" ON watchlist;

CREATE POLICY "watchlist_select_policy" ON watchlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "watchlist_insert_policy" ON watchlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist_delete_policy" ON watchlist
    FOR DELETE USING (auth.uid() = user_id);

-- Recriar índices (idempotent)
DROP INDEX IF EXISTS idx_watchlist_user_id;
DROP INDEX IF EXISTS idx_watchlist_content;
DROP INDEX IF EXISTS idx_watchlist_created_at;

CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_content ON watchlist(content_id, content_type);
CREATE INDEX idx_watchlist_created_at ON watchlist(created_at DESC);

-- Garantir constraint única (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'watchlist_user_id_content_id_content_type_key'
    ) THEN
        ALTER TABLE watchlist ADD CONSTRAINT watchlist_user_id_content_id_content_type_key 
        UNIQUE (user_id, content_id, content_type);
    END IF;
EXCEPTION WHEN duplicate_table THEN
    NULL; -- Constraint já existe
END $$;
