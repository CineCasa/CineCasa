-- ============================================
-- SUPABASE SCHEMA FIX - CineCasa
-- Execute este SQL no Editor SQL do Supabase
-- ============================================

-- 1. TABELA: avatar_items (Itens de customização de avatar)
CREATE TABLE IF NOT EXISTS public.avatar_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('body', 'hair', 'eyes', 'accessories', 'clothing', 'special')),
    type VARCHAR(50) NOT NULL,
    color VARCHAR(50),
    icon VARCHAR(255),
    unlocked BOOLEAN DEFAULT false,
    unlock_condition TEXT,
    price INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.avatar_items IS 'Itens disponíveis para customização de avatar';
COMMENT ON COLUMN public.avatar_items.category IS 'Categoria: body, hair, eyes, accessories, clothing, special';

-- Índices
CREATE INDEX IF NOT EXISTS idx_avatar_items_category ON public.avatar_items(category);
CREATE INDEX IF NOT EXISTS idx_avatar_items_type ON public.avatar_items(type);

-- Permissões
ALTER TABLE public.avatar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read avatar_items" ON public.avatar_items FOR SELECT USING (true);

-- ============================================

-- 2. TABELA: user_profiles (Perfis com customização)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    avatar_customization JSONB DEFAULT '{}',
    points INTEGER DEFAULT 0,
    special_items UUID[] DEFAULT '{}',
    badges UUID[] DEFAULT '{}',
    frames UUID[] DEFAULT '{}',
    effects UUID[] DEFAULT '{}',
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Comentários
COMMENT ON TABLE public.user_profiles IS 'Perfis de usuário com customização de avatar';
COMMENT ON COLUMN public.user_profiles.avatar_customization IS 'JSON com configurações do avatar';

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);

-- Permissões
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================

-- 3. TABELA: notifications (Notificações do sistema)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    icon VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_content', 'system', 'reminder', 'promotion')),
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.notifications IS 'Notificações para usuários';
COMMENT ON COLUMN public.notifications.type IS 'Tipo: new_content, system, reminder, promotion';

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Permissões
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================

-- 4. TABELA: user_devices (Dispositivos do usuário)
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name VARCHAR(255),
    device_type VARCHAR(50) CHECK (device_type IN ('tv', 'mobile', 'web')),
    device_id VARCHAR(255),
    location VARCHAR(255),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.user_devices IS 'Dispositivos conectados dos usuários';

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_is_current ON public.user_devices(is_current);

-- Permissões
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own devices" ON public.user_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own devices" ON public.user_devices FOR DELETE USING (auth.uid() = user_id);

-- ============================================

-- 5. FUNÇÃO RPC: get_user_devices
CREATE OR REPLACE FUNCTION public.get_user_devices(user_id_param UUID)
RETURNS SETOF public.user_devices
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.user_devices
    WHERE user_id = user_id_param
    ORDER BY last_active DESC;
END;
$$;

-- Permissão para executar função
GRANT EXECUTE ON FUNCTION public.get_user_devices(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_devices(UUID) TO anon;

-- ============================================

-- 6. TABELA: ratings (Avaliações de conteúdo)
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) CHECK (content_type IN ('movie', 'series')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, content_id)
);

-- Comentários
COMMENT ON TABLE public.ratings IS 'Avaliações de filmes e séries';

-- Índices
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_content_id ON public.ratings(content_id);

-- Permissões
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own ratings" ON public.ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON public.ratings FOR DELETE USING (auth.uid() = user_id);

-- ============================================

-- 7. DADOS INICIAIS: Itens de Avatar
INSERT INTO public.avatar_items (name, category, type, color, unlocked, price) VALUES
-- Cabelos
('Curto', 'hair', 'short', '#000000', true, 0),
('Médio', 'hair', 'medium', '#4A3728', true, 0),
('Longo', 'hair', 'long', '#8B4513', true, 0),
('Calvo', 'hair', 'bald', null, true, 0),
('Rabo de Cavalo', 'hair', 'ponytail', '#D2691E', false, 50),
('Moicano', 'hair', 'mohawk', '#FF0000', false, 100),
('Cortez', 'hair', 'buzzcut', '#000000', false, 25),

-- Cores de cabelo
('Preto', 'hair', 'color', '#000000', true, 0),
('Castanho', 'hair', 'color', '#4A3728', true, 0),
('Loiro', 'hair', 'color', '#D2691E', false, 30),
('Vermelho', 'hair', 'color', '#FF0000', false, 30),
('Azul', 'hair', 'color', '#0000FF', false, 50),
('Rosa', 'hair', 'color', '#FF69B4', false, 50),
('Roxo', 'hair', 'color', '#800080', false, 50),
('Verde', 'hair', 'color', '#00FF00', false, 50),

-- Olhos
('Redondos', 'eyes', 'round', '#4A3728', true, 0),
('Amêndoa', 'eyes', 'almond', '#4A3728', true, 0),
('Azuis', 'eyes', 'color', '#0000FF', false, 40),
('Verdes', 'eyes', 'color', '#00FF00', false, 40),
('Castanhos', 'eyes', 'color', '#4A3728', true, 0),

-- Acessórios
('Nenhum', 'accessories', 'none', null, true, 0),
('Boné', 'accessories', 'cap', '#FF0000', false, 60),
('Touca', 'accessories', 'beanie', '#0000FF', false, 60),
('Coroa', 'accessories', 'crown', '#FFD700', false, 200),
('Óculos', 'accessories', 'glasses', '#000000', false, 80),

-- Roupas
('Camiseta', 'clothing', 'tshirt', '#FFFFFF', true, 0),
('Camisa', 'clothing', 'shirt', '#0000FF', false, 40),
('Jaqueta', 'clothing', 'jacket', '#000000', false, 80),
('Vestido', 'clothing', 'dress', '#FF69B4', false, 60)

ON CONFLICT (id) DO NOTHING;

-- ============================================

-- 8. TRIGGERS: Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_avatar_items_updated_at BEFORE UPDATE ON public.avatar_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON public.user_devices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON public.ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FIM DO SCRIPT
-- ============================================
