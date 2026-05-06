-- Tabela de salas de assistir juntos
CREATE TABLE IF NOT EXISTS watch_together_rooms (
  id TEXT PRIMARY KEY,
  current_url TEXT NOT NULL,
  host_id TEXT,
  current_video_time FLOAT DEFAULT 0,
  is_playing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de participantes
CREATE TABLE IF NOT EXISTS watch_together_participants (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES watch_together_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS watch_together_messages (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES watch_together_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de comandos de reprodução
CREATE TABLE IF NOT EXISTS watch_together_commands (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES watch_together_rooms(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  command TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_watch_together_messages_room ON watch_together_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_watch_together_commands_room ON watch_together_commands(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_watch_together_participants_room ON watch_together_participants(room_id);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE watch_together_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_together_commands;

-- Função para limpar participantes antigos
CREATE OR REPLACE FUNCTION cleanup_old_participants()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM watch_together_participants
  WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Trigger para limpar participantes antigos a cada minuto
CREATE OR REPLACE FUNCTION trigger_cleanup_participants()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM cleanup_old_participants();
  RETURN NEW;
END;
$$;

-- Limpar mensagens antigas (manter apenas últimas 100 por sala)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM watch_together_messages
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY room_id ORDER BY created_at DESC) as rn
      FROM watch_together_messages
    ) t
    WHERE rn > 100
  );
END;
$$;
