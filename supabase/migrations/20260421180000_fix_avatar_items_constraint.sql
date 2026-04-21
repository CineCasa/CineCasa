-- MIGRAÇÃO PARA CORRIGIR CATEGORIAS DO AVATAR_ITEMS
-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. REMOVER CONSTRAINT ANTIGA
-- =====================================================
ALTER TABLE public.avatar_items DROP CONSTRAINT IF EXISTS avatar_items_category_check;

-- =====================================================
-- 2. ADICIONAR NOVA CONSTRAINT COM TODAS AS CATEGORIAS
-- =====================================================
ALTER TABLE public.avatar_items ADD CONSTRAINT avatar_items_category_check 
CHECK (
    category IN ('body', 'hair', 'eyes', 'accessories', 'clothing', 'special', 'appearance', 'badges', 'frames', 'effects')
);

-- =====================================================
-- 3. LIMPAR DADOS EXISTENTES E INSERIR NOVOS
-- =====================================================
TRUNCATE public.avatar_items;

INSERT INTO public.avatar_items (name, category, type, price, unlock_condition) VALUES
-- Aparência (body)
('Pele Clara', 'body', 'skin_tone', 0, NULL),
('Pele Média', 'body', 'skin_tone', 0, NULL),
('Pele Escura', 'body', 'skin_tone', 0, NULL),
('Cabelo Curto', 'hair', 'hair_style', 0, NULL),
('Cabelo Longo', 'hair', 'hair_style', 0, NULL),
('Cabelo Careca', 'hair', 'hair_style', 0, NULL),
('Cabelo Moicano', 'hair', 'hair_style', 100, 'watch_10_movies'),

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
('Badge Inicial', 'special', 'badge', 0, 'new_user'),
('Badge Premium', 'special', 'badge', 1000, 'premium_subscription'),
('Frame Ouro', 'special', 'frame', 800, 'watch_50_movies'),
('Efeito Sparkle', 'special', 'effect', 300, 'complete_profile');

-- =====================================================
-- 4. VERIFICAÇÃO
-- =====================================================
SELECT 
    'Constraint atualizada e itens inseridos!' as status,
    (SELECT COUNT(*) FROM public.avatar_items) as total_itens;
