-- Fix: Adicionar colunas faltantes na tabela avatar_items

-- Verificar e adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- display_order
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'display_order') THEN
        ALTER TABLE public.avatar_items ADD COLUMN display_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna display_order adicionada';
    END IF;

    -- rarity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'rarity') THEN
        ALTER TABLE public.avatar_items ADD COLUMN rarity VARCHAR(20) DEFAULT 'common';
        RAISE NOTICE 'Coluna rarity adicionada';
    END IF;

    -- unlock_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'unlock_type') THEN
        ALTER TABLE public.avatar_items ADD COLUMN unlock_type VARCHAR(50) DEFAULT 'free';
        RAISE NOTICE 'Coluna unlock_type adicionada';
    END IF;

    -- xp_required
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'xp_required') THEN
        ALTER TABLE public.avatar_items ADD COLUMN xp_required INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna xp_required adicionada';
    END IF;

    -- is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'is_active') THEN
        ALTER TABLE public.avatar_items ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna is_active adicionada';
    END IF;

    -- premium_only
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'premium_only') THEN
        ALTER TABLE public.avatar_items ADD COLUMN premium_only BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna premium_only adicionada';
    END IF;

    -- is_animated
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'is_animated') THEN
        ALTER TABLE public.avatar_items ADD COLUMN is_animated BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna is_animated adicionada';
    END IF;

    -- metadata (jsonb)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'metadata') THEN
        ALTER TABLE public.avatar_items ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna metadata adicionada';
    END IF;

    -- color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'color') THEN
        ALTER TABLE public.avatar_items ADD COLUMN color VARCHAR(50);
        RAISE NOTICE 'Coluna color adicionada';
    END IF;

    -- icon
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'icon') THEN
        ALTER TABLE public.avatar_items ADD COLUMN icon VARCHAR(255);
        RAISE NOTICE 'Coluna icon adicionada';
    END IF;

    -- preview_image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'preview_image') THEN
        ALTER TABLE public.avatar_items ADD COLUMN preview_image TEXT;
        RAISE NOTICE 'Coluna preview_image adicionada';
    END IF;

    -- updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'updated_at') THEN
        ALTER TABLE public.avatar_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        RAISE NOTICE 'Coluna updated_at adicionada';
    END IF;

    -- seasonal_event
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'seasonal_event') THEN
        ALTER TABLE public.avatar_items ADD COLUMN seasonal_event VARCHAR(100);
        RAISE NOTICE 'Coluna seasonal_event adicionada';
    END IF;
END $$;

-- Criar trigger para updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_avatar_items_updated_at ON public.avatar_items;
CREATE TRIGGER update_avatar_items_updated_at
    BEFORE UPDATE ON public.avatar_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Garantir que RLS está habilitado
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;

-- Recriar política de SELECT pública
DROP POLICY IF EXISTS "Public can view avatar items" ON public.avatar_items;
CREATE POLICY "Public can view avatar items" ON public.avatar_items
    FOR SELECT TO public USING (true);
