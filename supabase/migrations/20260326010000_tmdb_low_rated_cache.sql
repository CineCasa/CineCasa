-- Criar tabela para cache de conteúdos com baixa avaliação do TMDB
CREATE TABLE IF NOT EXISTS tmdb_low_rated_cache (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentário na tabela
COMMENT ON TABLE tmdb_low_rated_cache IS 'Cache de conteúdos com baixa avaliação do TMDB para seção Poderia ser melhor';

-- Índice para atualizações recentes
CREATE INDEX IF NOT EXISTS idx_tmdb_low_rated_updated_at 
ON tmdb_low_rated_cache(updated_at DESC);

-- Política RLS para permitir leitura pública
ALTER TABLE tmdb_low_rated_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" 
ON tmdb_low_rated_cache FOR SELECT 
TO PUBLIC USING (true);

CREATE POLICY "Allow authenticated insert/update" 
ON tmdb_low_rated_cache FOR ALL 
TO authenticated USING (true) WITH CHECK (true);

-- Inserir registro inicial vazio
INSERT INTO tmdb_low_rated_cache (id, data, updated_at)
VALUES ('poderia_ser_melhor', '[]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;
