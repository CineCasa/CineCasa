-- ============================================
-- MIGRAÇÃO: Adicionar colunas de imagem à tabela series
-- ============================================
-- Issue: As capas não estão carregando porque as colunas
-- capa, banner, poster não existem na tabela series

-- Adicionar coluna 'capa' à tabela series
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'capa'
    ) THEN
        ALTER TABLE series ADD COLUMN capa text;
        RAISE NOTICE 'Coluna capa adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna capa já existe na tabela series';
    END IF;
END $$;

-- Adicionar coluna 'banner' à tabela series
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'banner'
    ) THEN
        ALTER TABLE series ADD COLUMN banner text;
        RAISE NOTICE 'Coluna banner adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna banner já existe na tabela series';
    END IF;
END $$;

-- Adicionar coluna 'poster' à tabela series (alternativa à capa)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'poster'
    ) THEN
        ALTER TABLE series ADD COLUMN poster text;
        RAISE NOTICE 'Coluna poster adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna poster já existe na tabela series';
    END IF;
END $$;

-- Atualizar registros existentes com URLs padrão baseadas no tmdb_id
UPDATE series 
SET capa = CASE 
    WHEN tmdb_id IS NOT NULL THEN 'https://image.tmdb.org/t/p/w342' || tmdb_id || '.jpg'
    ELSE NULL
END
WHERE capa IS NULL;

UPDATE series 
SET banner = CASE 
    WHEN tmdb_id IS NOT NULL THEN 'https://image.tmdb.org/t/p/original' || tmdb_id || '.jpg'
    ELSE NULL
END
WHERE banner IS NULL;

UPDATE series 
SET poster = capa
WHERE poster IS NULL AND capa IS NOT NULL;

-- Mensagem de sucesso
SELECT 'Migração concluída! Colunas de imagem adicionadas à tabela series.' as status;
