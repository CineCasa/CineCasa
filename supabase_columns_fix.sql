-- ============================================
-- CORREÇÃO DAS COLUNAS DAS TABELAS
-- ============================================

-- 1. Verificar e adicionar colunas na user_progress
-- ============================================
DO $$
BEGIN
    -- Adicionar content_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'content_type') THEN
        ALTER TABLE public.user_progress ADD COLUMN content_type TEXT DEFAULT 'movie';
        RAISE NOTICE 'Coluna content_type adicionada à user_progress';
    END IF;

    -- Adicionar current_time se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'current_time') THEN
        ALTER TABLE public.user_progress ADD COLUMN "current_time" INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna current_time adicionada à user_progress';
    END IF;

    -- Renomear last_watched para updated_at se existir
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'user_progress' 
               AND column_name = 'last_watched') THEN
        ALTER TABLE public.user_progress RENAME COLUMN last_watched TO updated_at;
        RAISE NOTICE 'Coluna last_watched renomeada para updated_at';
    END IF;
    
    -- Adicionar title se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'title') THEN
        ALTER TABLE public.user_progress ADD COLUMN title TEXT;
        RAISE NOTICE 'Coluna title adicionada à user_progress';
    END IF;
    
    -- Adicionar poster se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'poster') THEN
        ALTER TABLE public.user_progress ADD COLUMN poster TEXT;
        RAISE NOTICE 'Coluna poster adicionada à user_progress';
    END IF;
    
    -- Adicionar banner se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'banner') THEN
        ALTER TABLE public.user_progress ADD COLUMN banner TEXT;
        RAISE NOTICE 'Coluna banner adicionada à user_progress';
    END IF;
    
    -- Adicionar progress se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'progress') THEN
        ALTER TABLE public.user_progress ADD COLUMN progress DOUBLE PRECISION DEFAULT 0;
        RAISE NOTICE 'Coluna progress adicionada à user_progress';
    END IF;
    
    -- Adicionar duration se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'duration') THEN
        ALTER TABLE public.user_progress ADD COLUMN duration DOUBLE PRECISION DEFAULT 0;
        RAISE NOTICE 'Coluna duration adicionada à user_progress';
    END IF;
    
    -- Adicionar episode_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'episode_id') THEN
        ALTER TABLE public.user_progress ADD COLUMN episode_id INTEGER;
        RAISE NOTICE 'Coluna episode_id adicionada à user_progress';
    END IF;
    
    -- Adicionar episode_title se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'episode_title') THEN
        ALTER TABLE public.user_progress ADD COLUMN episode_title TEXT;
        RAISE NOTICE 'Coluna episode_title adicionada à user_progress';
    END IF;
    
    -- Adicionar season_number se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'season_number') THEN
        ALTER TABLE public.user_progress ADD COLUMN season_number INTEGER;
        RAISE NOTICE 'Coluna season_number adicionada à user_progress';
    END IF;
    
    -- Adicionar episode_number se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_progress' 
                   AND column_name = 'episode_number') THEN
        ALTER TABLE public.user_progress ADD COLUMN episode_number INTEGER;
        RAISE NOTICE 'Coluna episode_number adicionada à user_progress';
    END IF;
END $$;

-- 2. Verificar e adicionar colunas na watch_history
-- ============================================
DO $$
BEGIN
    -- Adicionar content_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'watch_history' 
                   AND column_name = 'content_type') THEN
        ALTER TABLE public.watch_history ADD COLUMN content_type TEXT;
        RAISE NOTICE 'Coluna content_type adicionada à watch_history';
    END IF;

    -- Adicionar current_time se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'watch_history' 
                   AND column_name = 'current_time') THEN
        ALTER TABLE public.watch_history ADD COLUMN "current_time" INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna current_time adicionada à watch_history';
    END IF;

    -- Adicionar poster se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'watch_history' 
                   AND column_name = 'poster') THEN
        ALTER TABLE public.watch_history ADD COLUMN poster TEXT;
        RAISE NOTICE 'Coluna poster adicionada à watch_history';
    END IF;

    -- Adicionar duration se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'watch_history' 
                   AND column_name = 'duration') THEN
        ALTER TABLE public.watch_history ADD COLUMN duration INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna duration adicionada à watch_history';
    END IF;
END $$;

-- 3. Verificar constraint de content_type
-- ============================================
DO $$
BEGIN
    -- Remover constraint existente se houver
    ALTER TABLE public.user_progress DROP CONSTRAINT IF EXISTS user_progress_content_type_check;
    
    -- Adicionar nova constraint com valores válidos
    ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_content_type_check 
    CHECK (content_type IN ('movie', 'series', 'tv'));
    
    RAISE NOTICE 'Constraint content_type atualizada';
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_progress', 'watch_history')
ORDER BY table_name, ordinal_position;
