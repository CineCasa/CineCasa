-- MIGRAÇÃO PARA CONFIGURAR PERSONALIZAÇÃO DE AVATAR
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. ADICIONAR COLUNA AVATAR_CUSTOMIZATION EM PROFILES
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_customization'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_customization JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna avatar_customization adicionada em profiles';
    END IF;
END $$;

-- =====================================================
-- 2. CRIAR TABELA AVATAR_ITEMS (se não existir)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.avatar_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'appearance', 'clothing', 'accessories', 'special', 'badges', 'frames', 'effects'
    type TEXT NOT NULL,
    price INTEGER DEFAULT 0,
    unlock_condition TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 3. INSERIR ITENS PADRÃO DE AVATAR
-- =====================================================
INSERT INTO public.avatar_items (name, category, type, price, unlock_condition) VALUES
-- Aparência
('Pele Clara', 'appearance', 'skin_tone', 0, NULL),
('Pele Média', 'appearance', 'skin_tone', 0, NULL),
('Pele Escura', 'appearance', 'skin_tone', 0, NULL),
('Cabelo Curto', 'appearance', 'hair_style', 0, NULL),
('Cabelo Longo', 'appearance', 'hair_style', 0, NULL),
('Cabelo Careca', 'appearance', 'hair_style', 0, NULL),
('Cabelo Moicano', 'appearance', 'hair_style', 100, 'watch_10_movies'),

-- Roupas
('Camiseta Básica', 'clothing', 'top', 0, NULL),
('Camisa Social', 'clothing', 'top', 50, NULL),
('Jaqueta', 'clothing', 'top', 100, 'watch_5_series'),
('Calça', 'clothing', 'bottom', 0, NULL),
('Shorts', 'clothing', 'bottom', 0, NULL),

-- Acessórios
('Boné', 'accessories', 'headwear', 30, NULL),
('Chapéu', 'accessories', 'headwear', 50, NULL),
('Coroa', 'accessories', 'headwear', 500, 'premium_user'),
('Óculos', 'accessories', 'glasses', 40, NULL),
('Óculos de Sol', 'accessories', 'glasses', 60, NULL),

-- Especiais
('Badge Inicial', 'badges', 'badge', 0, 'new_user'),
('Badge Premium', 'badges', 'badge', 1000, 'premium_subscription'),
('Frame Ouro', 'frames', 'frame', 800, 'watch_50_movies'),
('Efeito Sparkle', 'effects', 'effect', 300, 'complete_profile')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. HABILITAR RLS NA TABELA AVATAR_ITEMS
-- =====================================================
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
DROP POLICY IF EXISTS "Public can view avatar items" ON public.avatar_items;
CREATE POLICY "Public can view avatar items" 
ON public.avatar_items FOR SELECT 
TO public
USING (true);

-- =====================================================
-- 5. CRIAR FUNÇÃO PARA ATUALIZAR TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para avatar_items
DROP TRIGGER IF EXISTS update_avatar_items_updated_at ON public.avatar_items;
CREATE TRIGGER update_avatar_items_updated_at
    BEFORE UPDATE ON public.avatar_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. VERIFICAÇÃO
-- =====================================================
SELECT 
    'Configuração de Avatar concluída!' as status,
    (SELECT COUNT(*) FROM public.avatar_items) as total_itens,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'profiles' AND column_name = 'avatar_customization') as coluna_existe;
