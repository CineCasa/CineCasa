-- Parte 4: Seed Data - Avatar Items e Achievements

-- Avatar Items melhorados
INSERT INTO public.avatar_items (name, category, type, rarity, unlock_type, xp_required, price, is_active, display_order) VALUES
-- Corpo base
('Pele Clara', 'body', 'skin', 'common', 'free', 0, 0, true, 1),
('Pele Média', 'body', 'skin', 'common', 'free', 0, 0, true, 2),
('Pele Escura', 'body', 'skin', 'common', 'free', 0, 0, true, 3),

-- Cabelos comuns
('Cabelo Curto Castanho', 'hair', 'short', 'common', 'free', 0, 0, true, 10),
('Cabelo Longo Castanho', 'hair', 'long', 'common', 'free', 0, 0, true, 11),
('Careca', 'hair', 'bald', 'common', 'free', 0, 0, true, 12),

-- Cabelos desbloqueáveis
('Cabelo Loiro', 'hair', 'short', 'uncommon', 'xp', 500, 100, true, 20),
('Cabelo Ruivo', 'hair', 'long', 'uncommon', 'xp', 500, 100, true, 21),
('Cabelo Preto Estiloso', 'hair', 'short', 'rare', 'xp', 1000, 200, true, 22),
('Cabelo Colorido', 'hair', 'short', 'epic', 'achievement', 0, 500, true, 23),
('Moicano Punk', 'hair', 'mohawk', 'rare', 'watch', 0, 300, true, 24),

-- Olhos
('Olhos Castanhos', 'eyes', 'brown', 'common', 'free', 0, 0, true, 30),
('Olhos Azuis', 'eyes', 'blue', 'uncommon', 'xp', 300, 50, true, 31),
('Olhos Verdes', 'eyes', 'green', 'uncommon', 'xp', 300, 50, true, 32),
('Olhos Violeta', 'eyes', 'violet', 'rare', 'xp', 800, 150, true, 33),

-- Roupas básicas
('Camiseta Branca', 'clothing', 'top', 'common', 'free', 0, 0, true, 40),
('Camiseta Preta', 'clothing', 'top', 'common', 'free', 0, 0, true, 41),
('Calça Jeans', 'clothing', 'bottom', 'common', 'free', 0, 0, true, 42),

-- Roupas desbloqueáveis
('Camisa Social', 'clothing', 'top', 'uncommon', 'xp', 400, 80, true, 50),
('Jaqueta de Couro', 'clothing', 'top', 'rare', 'xp', 1000, 200, true, 51),
('Vestido Elegante', 'clothing', 'top', 'rare', 'xp', 1200, 250, true, 52),
('Terno Premium', 'clothing', 'top', 'epic', 'achievement', 0, 600, true, 53),

-- Acessórios
('Óculos de Leitura', 'accessories', 'glasses', 'common', 'free', 0, 0, true, 60),
('Óculos de Sol', 'accessories', 'glasses', 'uncommon', 'xp', 300, 60, true, 61),
('Boné', 'accessories', 'hat', 'uncommon', 'xp', 400, 80, true, 62),
('Chapéu Fedora', 'accessories', 'hat', 'rare', 'xp', 800, 150, true, 63),
('Coroa Dourada', 'accessories', 'crown', 'legendary', 'achievement', 0, 2000, true, 64),

-- Backgrounds
('Fundo Branco', 'background', 'solid', 'common', 'free', 0, 0, true, 70),
('Fundo Gradiente', 'background', 'gradient', 'common', 'free', 0, 0, true, 71),
('Fundo Estrelado', 'background', 'pattern', 'rare', 'xp', 1000, 200, true, 72),
('Fundo Neon', 'background', 'animated', 'epic', 'achievement', 0, 800, true, 73),

-- Badges/Emblemas
('Badge Novato', 'badge', 'starter', 'common', 'free', 0, 0, true, 80),
('Badge Cinéfilo', 'badge', 'watcher', 'uncommon', 'xp', 1000, 0, true, 81),
('Badge Crítico', 'badge', 'rater', 'rare', 'achievement', 0, 0, true, 82),
('Badge Lendário', 'badge', 'master', 'legendary', 'achievement', 0, 0, true, 83),

-- Frames
('Frame Simples', 'frame', 'basic', 'common', 'free', 0, 0, true, 90),
('Frame Prateado', 'frame', 'silver', 'uncommon', 'xp', 600, 0, true, 91),
('Frame Dourado', 'frame', 'gold', 'rare', 'xp', 1500, 0, true, 92),
('Frame Premium', 'frame', 'premium', 'epic', 'premium', 0, 0, true, 93)
ON CONFLICT DO NOTHING;

-- Level Config
INSERT INTO public.level_config (level, title, xp_required, xp_for_level, features_unlocked) VALUES
(1, 'Novato', 0, 100, '["avatar_basic"]'),
(2, 'Espectador', 100, 200, '["avatar_hair"]'),
(3, 'Fã de Cinema', 300, 300, '["avatar_clothing"]'),
(4, 'Cinéfilo', 600, 400, '["reviews", "avatar_accessories"]'),
(5, 'Crítico Amador', 1000, 500, '["avatar_backgrounds"]'),
(6, 'Crítico', 1500, 600, '["watchlist_public"]'),
(7, 'Expert', 2100, 700, '["avatar_animations"]'),
(8, 'Mestre', 2800, 800, '["priority_support"]'),
(9, 'Lenda', 3600, 900, '["badge_legend"]'),
(10, 'Ícone', 4500, 1000, '["all_features"]')
ON CONFLICT (level) DO NOTHING;

-- Achievements
INSERT INTO public.achievements (code, name, description, category, requirement_type, requirement_value, xp_reward, tier) VALUES
-- Watching
('watch_1', 'Primeiro Filme', 'Assista seu primeiro filme', 'watching', 'count', 1, 50, 'bronze'),
('watch_10', 'Cinéfilo Iniciante', 'Assista 10 filmes', 'watching', 'count', 10, 100, 'bronze'),
('watch_50', 'Cinéfilo Dedicado', 'Assista 50 filmes', 'watching', 'count', 50, 250, 'silver'),
('watch_100', 'Mestre do Cinema', 'Assista 100 filmes', 'watching', 'count', 100, 500, 'gold'),
('watch_500', 'Lenda Viva', 'Assista 500 filmes', 'watching', 'count', 500, 2000, 'platinum'),

-- Streaks
('streak_3', 'Sequência Iniciante', 'Assista 3 dias seguidos', 'streak', 'count', 3, 100, 'bronze'),
('streak_7', 'Sequência Semanal', 'Assista 7 dias seguidos', 'streak', 'count', 7, 250, 'silver'),
('streak_30', 'Sequência Mensal', 'Assista 30 dias seguidos', 'streak', 'count', 30, 1000, 'gold'),
('streak_365', 'Sequência Anual', 'Assista 365 dias seguidos', 'streak', 'count', 365, 5000, 'diamond'),

-- Ratings
('rate_1', 'Primeira Avaliação', 'Avalie seu primeiro conteúdo', 'rating', 'count', 1, 25, 'bronze'),
('rate_10', 'Crítico Iniciante', 'Avalie 10 conteúdos', 'rating', 'count', 10, 100, 'bronze'),
('rate_50', 'Crítico Experiente', 'Avalie 50 conteúdos', 'rating', 'count', 50, 300, 'silver'),
('rate_100', 'Crítico Master', 'Avalie 100 conteúdos', 'rating', 'count', 100, 600, 'gold'),

-- Genres
('genre_action', 'Fã de Ação', 'Assista 10 filmes de ação', 'watching', 'count', 10, 150, 'silver'),
('genre_horror', 'Corajoso', 'Assista 10 filmes de terror', 'watching', 'count', 10, 150, 'silver'),
('genre_comedy', 'Bom Humor', 'Assista 10 comédias', 'watching', 'count', 10, 150, 'silver'),
('genre_romance', 'Romântico', 'Assista 10 romances', 'watching', 'count', 10, 150, 'silver'),

-- Special
('night_owl', 'Coruja', 'Assista 10 filmes após meia-noite', 'watching', 'count', 10, 200, 'silver'),
('binge_watcher', 'Maratonista', 'Assista 5 episódios seguidos', 'watching', 'count', 5, 150, 'silver'),
('completist', 'Completista', 'Termine uma série completa', 'watching', 'special', 1, 500, 'gold')
ON CONFLICT (code) DO NOTHING;
