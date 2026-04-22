-- Migração: Tabela de mensagens do chat da Watch Party
-- Cria tabela para armazenar mensagens do bate-papo em tempo real

-- =====================================================
-- 1. CRIAR TABELA DE MENSAGENS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.watch_party_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    username TEXT NOT NULL,
    user_avatar TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_watch_party_messages_room_id 
    ON public.watch_party_messages(room_id);

CREATE INDEX IF NOT EXISTS idx_watch_party_messages_created_at 
    ON public.watch_party_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_watch_party_messages_room_created 
    ON public.watch_party_messages(room_id, created_at DESC);

-- =====================================================
-- 3. POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Ativar RLS
ALTER TABLE public.watch_party_messages ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode inserir mensagens
CREATE POLICY "Allow insert messages" 
    ON public.watch_party_messages 
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Política: qualquer um pode ler mensagens
CREATE POLICY "Allow select messages" 
    ON public.watch_party_messages 
    FOR SELECT 
    TO public 
    USING (true);

-- Política: apenas o autor pode deletar sua mensagem
CREATE POLICY "Allow delete own messages" 
    ON public.watch_party_messages 
    FOR DELETE 
    TO public 
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. TRIGGER PARA ATUALIZAR updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_watch_party_messages_updated_at 
    ON public.watch_party_messages;

CREATE TRIGGER update_watch_party_messages_updated_at
    BEFORE UPDATE ON public.watch_party_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. CONFIGURAR REALTIME (para mensagens em tempo real)
-- =====================================================

-- Adicionar tabela à publicação do realtime (se a extensão existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
        -- Tabela já está criada com UUID, agora configuramos realtime
        PERFORM pg_notify('pgrst', '{"command": "reload"}');
    END IF;
END $$;

-- =====================================================
-- 6. LIMPEZA AUTOMÁTICA DE MENSAGENS ANTIGAS (OPCIONAL)
-- =====================================================
-- Criar função para limpar mensagens com mais de 7 dias
CREATE OR REPLACE FUNCTION cleanup_old_watch_party_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM public.watch_party_messages 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentário sobre a tabela
COMMENT ON TABLE public.watch_party_messages IS 
    'Mensagens do chat da Watch Party - armazena bate-papo em tempo real por sala';

-- Verificação final
SELECT 
    'Tabela watch_party_messages criada com sucesso!' as status,
    (SELECT COUNT(*) FROM public.watch_party_messages) as total_mensagens;
