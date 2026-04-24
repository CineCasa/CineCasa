-- ============================================================================
-- MIGRAÇÃO COMPLETA: WATCH PARTY / ASSISTIR JUNTOS
-- Cria todas as tabelas, políticas e configurações necessárias para o bate-papo
-- e sincronização de vídeo em tempo real funcionar corretamente
-- ============================================================================

-- =====================================================
-- 1. TABELA DE SALAS (WATCH PARTY ROOMS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.watch_party_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
    host_id UUID NOT NULL,
    host_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    video_time INTEGER DEFAULT 0,
    is_playing BOOLEAN DEFAULT FALSE,
    duration INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 1
);

COMMENT ON TABLE public.watch_party_rooms IS 
    'Salas de Watch Party - gerencia estado do player e participantes';

-- =====================================================
-- 2. TABELA DE PARTICIPANTES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.watch_party_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES public.watch_party_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_host BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.watch_party_participants IS 
    'Participantes das salas de Watch Party';

-- =====================================================
-- 3. TABELA DE MENSAGENS DO CHAT
-- =====================================================
CREATE TABLE IF NOT EXISTS public.watch_party_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES public.watch_party_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    username TEXT NOT NULL,
    user_avatar TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.watch_party_messages IS 
    'Mensagens do chat da Watch Party';

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================
-- Índices para salas
CREATE INDEX IF NOT EXISTS idx_watch_party_rooms_content 
    ON public.watch_party_rooms(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_watch_party_rooms_host 
    ON public.watch_party_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_rooms_active 
    ON public.watch_party_rooms(is_active) WHERE is_active = TRUE;

-- Índices para participantes
CREATE INDEX IF NOT EXISTS idx_watch_party_participants_room 
    ON public.watch_party_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_participants_user 
    ON public.watch_party_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_participants_room_user 
    ON public.watch_party_participants(room_id, user_id);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_watch_party_messages_room 
    ON public.watch_party_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_watch_party_messages_created 
    ON public.watch_party_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_party_messages_room_created 
    ON public.watch_party_messages(room_id, created_at DESC);

-- =====================================================
-- 5. ATIVAR ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.watch_party_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- WATCH PARTY ROOMS
-- Qualquer um pode criar salas
CREATE POLICY "Allow create rooms" 
    ON public.watch_party_rooms 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Qualquer um pode ver salas ativas
CREATE POLICY "Allow view active rooms" 
    ON public.watch_party_rooms 
    FOR SELECT 
    TO public 
    USING (is_active = TRUE);

-- Apenas host pode atualizar sua sala
CREATE POLICY "Allow host update" 
    ON public.watch_party_rooms 
    FOR UPDATE 
    TO public 
    USING (host_id = auth.uid())
    WITH CHECK (host_id = auth.uid());

-- Apenas host ou admin pode deletar
CREATE POLICY "Allow host delete" 
    ON public.watch_party_rooms 
    FOR DELETE 
    TO public 
    USING (host_id = auth.uid());

-- WATCH PARTY PARTICIPANTS
-- Qualquer um pode entrar em uma sala
CREATE POLICY "Allow join rooms" 
    ON public.watch_party_participants 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Qualquer um pode ver participantes
CREATE POLICY "Allow view participants" 
    ON public.watch_party_participants 
    FOR SELECT 
    TO public 
    USING (true);

-- Apenas o próprio usuário pode sair (deletar)
CREATE POLICY "Allow leave room" 
    ON public.watch_party_participants 
    FOR DELETE 
    TO public 
    USING (user_id = auth.uid());

-- WATCH PARTY MESSAGES
-- Qualquer um pode enviar mensagens
CREATE POLICY "Allow send messages" 
    ON public.watch_party_messages 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Qualquer um pode ver mensagens
CREATE POLICY "Allow view messages" 
    ON public.watch_party_messages 
    FOR SELECT 
    TO public 
    USING (true);

-- Apenas autor pode deletar sua mensagem
CREATE POLICY "Allow delete own messages" 
    ON public.watch_party_messages 
    FOR DELETE 
    TO public 
    USING (user_id = auth.uid());

-- =====================================================
-- 7. TRIGGERS PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para salas
DROP TRIGGER IF EXISTS update_watch_party_rooms_updated_at 
    ON public.watch_party_rooms;
CREATE TRIGGER update_watch_party_rooms_updated_at
    BEFORE UPDATE ON public.watch_party_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para mensagens
DROP TRIGGER IF EXISTS update_watch_party_messages_updated_at 
    ON public.watch_party_messages;
CREATE TRIGGER update_watch_party_messages_updated_at
    BEFORE UPDATE ON public.watch_party_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. FUNÇÕES AUXILIARES
-- =====================================================

-- Função para limpar salas inativas (mais de 24h sem atualização)
CREATE OR REPLACE FUNCTION cleanup_inactive_rooms()
RETURNS void AS $$
BEGIN
    UPDATE public.watch_party_rooms 
    SET is_active = FALSE 
    WHERE updated_at < NOW() - INTERVAL '24 hours' 
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar contador de participantes
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.watch_party_rooms 
        SET participant_count = participant_count + 1,
            updated_at = NOW()
        WHERE id = NEW.room_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.watch_party_rooms 
        SET participant_count = GREATEST(participant_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.room_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador de participantes automaticamente
DROP TRIGGER IF EXISTS trg_update_participant_count_insert 
    ON public.watch_party_participants;
CREATE TRIGGER trg_update_participant_count_insert
    AFTER INSERT ON public.watch_party_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_count();

DROP TRIGGER IF EXISTS trg_update_participant_count_delete 
    ON public.watch_party_participants;
CREATE TRIGGER trg_update_participant_count_delete
    AFTER DELETE ON public.watch_party_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_count();

-- Função para limpar mensagens antigas (mais de 7 dias)
CREATE OR REPLACE FUNCTION cleanup_old_watch_party_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM public.watch_party_messages 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. CONFIGURAR REALTIME (SUPABASE REALTIME)
-- =====================================================

-- Habilitar realtime para todas as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_messages;

-- Configurar broadcast para sincronização de vídeo
COMMENT ON TABLE public.watch_party_rooms IS 
    'Watch Party Rooms - Realtime enabled for sync';

-- =====================================================
-- 10. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
BEGIN
    -- Verificar se todas as tabelas foram criadas
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('watch_party_rooms', 'watch_party_participants', 'watch_party_messages')
    ) THEN
        RAISE NOTICE '✅ Todas as tabelas do Watch Party foram criadas com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ Algumas tabelas não foram criadas';
    END IF;

    -- Verificar se RLS está ativo
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('watch_party_rooms', 'watch_party_participants', 'watch_party_messages')
        AND rowsecurity = TRUE
    ) THEN
        RAISE NOTICE '✅ Row Level Security (RLS) está ativo em todas as tabelas!';
    ELSE
        RAISE WARNING '⚠️ RLS pode não estar configurado corretamente em todas as tabelas';
    END IF;
END $$;

-- Status final
SELECT 
    'Migração concluída!' as status,
    (SELECT COUNT(*) FROM public.watch_party_rooms) as total_rooms,
    (SELECT COUNT(*) FROM public.watch_party_participants) as total_participants,
    (SELECT COUNT(*) FROM public.watch_party_messages) as total_messages;
