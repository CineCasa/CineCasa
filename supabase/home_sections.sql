-- Tabela para gerenciar seções da home
CREATE TABLE IF NOT EXISTS home_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  max_items INTEGER DEFAULT 5,
  filter_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para rastrear progresso do usuário
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'movie' ou 'series'
  progress_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER DEFAULT 0,
  percentage_completed INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Tabela para rastrear preferências do usuário
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category VARCHAR(255) NOT NULL,
  view_count INTEGER DEFAULT 1,
  total_watch_time INTEGER DEFAULT 0, -- em segundos
  last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Tabela para conteúdo externo (top streaming, em breve)
CREATE TABLE IF NOT EXISTS external_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'movie' ou 'series'
  streaming_service VARCHAR(100), -- Netflix, HBO, etc.
  poster_url TEXT,
  backdrop_url TEXT,
  description TEXT,
  year INTEGER,
  rating VARCHAR(10),
  is_available BOOLEAN DEFAULT false, -- se temos no nosso catálogo
  tmdb_id VARCHAR(50),
  category VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir seções padrão
INSERT INTO home_sections (title, type, sort_order, max_items, filter_config) VALUES
('Continuar Assistindo', 'continue-watching', 1, 3, '{"require_user_progress": true}'),
('Lançamentos & Novidades', 'releases', 2, 5, '{"years": [2025, 2026], "categories": ["Lançamento 2025", "Lançamento 2026"]}'),
('Exclusivos para Você', 'personalized', 3, 5, '{"based_on_user_preferences": true}'),
('Dinheiro Importa!', 'finance', 4, 5, '{"categories": ["finanças", "dinheiro", "negócios", "conquista", "sucesso"]}'),
('Negritude em Alta', 'blackness', 5, 5, '{"categories": ["negritude"]}'),
('Romances para se Inspirar', 'romance', 6, 5, '{"categories": ["romance"]}'),
('Prepare a Pipoca', 'trending', 7, 5, '{"content_types": ["series"], "trending": true}'),
('Como é bom ser criança', 'kids', 8, 5, '{"categories": ["infantil", "animação"]}'),
('Top 5 dos Streamings', 'top5', 9, 5, '{"external_content": true, "top_streamings": true}'),
('Vencedores de Oscar', 'oscar', 10, 5, '{"min_rating": 8.0, "award_winners": true}'),
('Travesseiro e Edredon', 'relaxing', 11, 5, '{"categories": ["drama", "romance", "família", "musical"]}')
ON CONFLICT (type) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_content_id ON user_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_category ON user_preferences(category);
CREATE INDEX IF NOT EXISTS idx_home_sections_active ON home_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_external_content_available ON external_content(is_available);
CREATE INDEX IF NOT EXISTS idx_external_content_type ON external_content(type);

-- RLS (Row Level Security)
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_content ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- home_sections - todos podem ler, apenas admins podem escrever
CREATE POLICY "Anyone can read home sections" ON home_sections FOR SELECT USING (true);
CREATE POLICY "Only admins can write home sections" ON home_sections FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- user_progress - apenas usuário pode ler/escrever seus próprios dados
CREATE POLICY "Users can read own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can write own progress" ON user_progress FOR ALL USING (auth.uid() = user_id);

-- user_preferences - apenas usuário pode ler/escrever seus próprios dados
CREATE POLICY "Users can read own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can write own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- external_content - todos podem ler, apenas admins podem escrever
CREATE POLICY "Anyone can read external content" ON external_content FOR SELECT USING (true);
CREATE POLICY "Only admins can write external content" ON external_content FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Function para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_home_sections_updated_at BEFORE UPDATE ON home_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_external_content_updated_at BEFORE UPDATE ON external_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
