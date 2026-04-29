-- MIGRAÇÃO DE EMERGÊNCIA - Corrigir schema do banco de produção
-- Adicionar colunas que o código espera mas que não existem no banco

-- =====================================================
-- 1. TABELA SERIES - Adicionar colunas faltantes
-- =====================================================
DO $$
BEGIN
    -- Adicionar coluna 'year' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'year'
    ) THEN
        ALTER TABLE public.series ADD COLUMN year TEXT;
        RAISE NOTICE 'Coluna year adicionada à tabela series';
    END IF;
    
    -- Adicionar coluna 'genero' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'genero'
    ) THEN
        ALTER TABLE public.series ADD COLUMN genero TEXT;
        RAISE NOTICE 'Coluna genero adicionada à tabela series';
    END IF;
    
    -- Adicionar coluna 'capa' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'capa'
    ) THEN
        ALTER TABLE public.series ADD COLUMN capa TEXT;
        RAISE NOTICE 'Coluna capa adicionada à tabela series';
    END IF;
    
    -- Adicionar coluna 'banner' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'banner'
    ) THEN
        ALTER TABLE public.series ADD COLUMN banner TEXT;
        RAISE NOTICE 'Coluna banner adicionada à tabela series';
    END IF;
    
    -- Adicionar coluna 'rating' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'rating'
    ) THEN
        ALTER TABLE public.series ADD COLUMN rating TEXT;
        RAISE NOTICE 'Coluna rating adicionada à tabela series';
    END IF;
    
    -- Adicionar coluna 'description' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'series' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.series ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada à tabela series';
    END IF;
END $$;

-- =====================================================
-- 2. TABELA CINEMA - Adicionar colunas faltantes
-- =====================================================
DO $$
BEGIN
    -- Adicionar coluna 'genero' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cinema' AND column_name = 'genero'
    ) THEN
        ALTER TABLE public.cinema ADD COLUMN genero TEXT;
        RAISE NOTICE 'Coluna genero adicionada à tabela cinema';
    END IF;
    
    -- Adicionar coluna 'banner' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cinema' AND column_name = 'banner'
    ) THEN
        ALTER TABLE public.cinema ADD COLUMN banner TEXT;
        RAISE NOTICE 'Coluna banner adicionada à tabela cinema';
    END IF;
    
    -- Adicionar coluna 'backdrop' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cinema' AND column_name = 'backdrop'
    ) THEN
        ALTER TABLE public.cinema ADD COLUMN backdrop TEXT;
        RAISE NOTICE 'Coluna backdrop adicionada à tabela cinema';
    END IF;
    
    -- Adicionar coluna 'duration' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cinema' AND column_name = 'duration'
    ) THEN
        ALTER TABLE public.cinema ADD COLUMN duration TEXT;
        RAISE NOTICE 'Coluna duration adicionada à tabela cinema';
    END IF;
END $$;

-- Mensagem de sucesso
SELECT 'Migração de schema concluída! Colunas adicionadas com sucesso.' as status;
