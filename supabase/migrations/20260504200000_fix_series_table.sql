-- ============================================
-- MIGRAÇÃO: Corrigir tabela series
-- ============================================
-- Adicionar colunas que faltam na tabela series
-- para compatibilidade com o código TypeScript

-- Renomear coluna id para id_n se necessário, ou adicionar id_n como alias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'id_n'
    ) THEN
        -- Se não tem id_n, vamos adicionar como cópia de id
        ALTER TABLE series ADD COLUMN id_n bigint GENERATED ALWAYS AS IDENTITY;
        
        -- Migrar dados da coluna id para id_n
        -- (Como id_n é GENERATED, precisamos primeiro remover a constraint)
        ALTER TABLE series ALTER COLUMN id_n DROP IDENTITY;
        
        -- Copiar valores de id para id_n
        UPDATE series SET id_n = id WHERE id_n IS NULL;
        
        -- Tornar id_n PRIMARY KEY
        ALTER TABLE series DROP CONSTRAINT series_pkey;
        ALTER TABLE series ADD PRIMARY KEY (id_n);
        
        RAISE NOTICE 'Coluna id_n adicionada e configurada como PRIMARY KEY';
    ELSE
        RAISE NOTICE 'Coluna id_n já existe na tabela series';
    END IF;
END $$;

-- Adicionar coluna descricao
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'descricao'
    ) THEN
        ALTER TABLE series ADD COLUMN descricao text;
        RAISE NOTICE 'Coluna descricao adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna descricao já existe na tabela series';
    END IF;
END $$;

-- Adicionar coluna ano
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'ano'
    ) THEN
        ALTER TABLE series ADD COLUMN ano integer;
        RAISE NOTICE 'Coluna ano adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna ano já existe na tabela series';
    END IF;
END $$;

-- Adicionar coluna genero
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'genero'
    ) THEN
        ALTER TABLE series ADD COLUMN genero text;
        RAISE NOTICE 'Coluna genero adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna genero já existe na tabela series';
    END IF;
END $$;

-- Adicionar coluna classificacao
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'classificacao'
    ) THEN
        ALTER TABLE series ADD COLUMN classificacao text;
        RAISE NOTICE 'Coluna classificacao adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna classificacao já existe na tabela series';
    END IF;
END $$;

-- Adicionar coluna seasons
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'seasons'
    ) THEN
        ALTER TABLE series ADD COLUMN seasons integer DEFAULT 1;
        RAISE NOTICE 'Coluna seasons adicionada à tabela series';
    ELSE
        RAISE NOTICE 'Coluna seasons já existe na tabela series';
    END IF;
END $$;

-- Mensagem de sucesso
SELECT 'Migração concluída! Colunas adicionadas à tabela series.' as status;
