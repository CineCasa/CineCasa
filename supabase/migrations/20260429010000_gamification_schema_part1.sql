-- Parte 1: Schema base - Tabelas principais

-- 1. Melhorar avatar_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'rarity') THEN
        ALTER TABLE public.avatar_items ADD COLUMN rarity VARCHAR(20) DEFAULT 'common';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'premium_only') THEN
        ALTER TABLE public.avatar_items ADD COLUMN premium_only BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'is_animated') THEN
        ALTER TABLE public.avatar_items ADD COLUMN is_animated BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'xp_required') THEN
        ALTER TABLE public.avatar_items ADD COLUMN xp_required INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'is_active') THEN
        ALTER TABLE public.avatar_items ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'avatar_items' AND column_name = 'unlock_type') THEN
        ALTER TABLE public.avatar_items ADD COLUMN unlock_type VARCHAR(50) DEFAULT 'free';
    END IF;
END $$;

-- 2. Tabela user_avatar_items
CREATE TABLE IF NOT EXISTS public.user_avatar_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_item_id UUID NOT NULL REFERENCES public.avatar_items(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    unlocked_by VARCHAR(50) NOT NULL DEFAULT 'purchase',
    is_favorite BOOLEAN DEFAULT false,
    times_equipped INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_user_item UNIQUE (user_id, avatar_item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_avatar_items_user_id ON public.user_avatar_items(user_id);

-- 3. Tabela user_equipped_avatar
CREATE TABLE IF NOT EXISTS public.user_equipped_avatar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_body UUID REFERENCES public.avatar_items(id),
    slot_hair UUID REFERENCES public.avatar_items(id),
    slot_eyes UUID REFERENCES public.avatar_items(id),
    slot_top UUID REFERENCES public.avatar_items(id),
    slot_bottom UUID REFERENCES public.avatar_items(id),
    slot_accessory_1 UUID REFERENCES public.avatar_items(id),
    slot_accessory_2 UUID REFERENCES public.avatar_items(id),
    slot_background UUID REFERENCES public.avatar_items(id),
    slot_badge UUID REFERENCES public.avatar_items(id),
    slot_frame UUID REFERENCES public.avatar_items(id),
    customization_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela achievements
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value INTEGER NOT NULL DEFAULT 1,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    avatar_item_reward UUID REFERENCES public.avatar_items(id),
    tier VARCHAR(20) DEFAULT 'bronze',
    is_hidden BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON public.achievements(is_active);

-- 5. Tabela user_achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    progress_current INTEGER DEFAULT 0,
    progress_target INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    notification_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements(user_id, is_completed);
