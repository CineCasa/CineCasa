-- =====================================================
-- LIMPAR TABELAS EXISTENTES - CINECASA
-- =====================================================

-- Remover views primeiro
DROP VIEW IF EXISTS planos_ativos;
DROP VIEW IF EXISTS usuarios_planos_ativos;

-- Remover triggers primeiro (para evitar dependências)
DROP TRIGGER IF EXISTS trigger_planos_updated_at ON planos;
DROP TRIGGER IF EXISTS trigger_usuario_plano_updated_at ON usuario_plano;
DROP TRIGGER IF EXISTS trigger_config_pagamento_updated_at ON config_pagamento;
DROP TRIGGER IF EXISTS trigger_historico_preco ON planos;

-- Remover tabelas dependentes (em ordem correta)
DROP TABLE IF EXISTS preco_historico CASCADE;
DROP TABLE IF EXISTS usuario_plano CASCADE;
DROP TABLE IF EXISTS planos CASCADE;
DROP TABLE IF EXISTS config_pagamento CASCADE;

-- Remover funções com CASCADE
DROP FUNCTION IF EXISTS trigger_atualizar_timestamp() CASCADE;
DROP FUNCTION IF EXISTS plano_ativo(UUID) CASCADE;
DROP FUNCTION IF EXISTS registrar_historico_preco() CASCADE;

-- =====================================================
-- TABELAS DE PLANOS - CINECASA (VERSÃO FINAL CORRIGIDA)
-- =====================================================

-- 1. Tabela de Planos (exatamente como na página)
CREATE TABLE planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    popular BOOLEAN DEFAULT FALSE,
    recursos JSONB NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Usuários x Planos
CREATE TABLE usuario_plano (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plano_id UUID REFERENCES planos(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'expirado', 'pendente')),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    valor_pago DECIMAL(10,2),
    metodo_pagamento VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERÇÃO DE DADOS INICIAIS (EXATAMENTE COMO NA PÁGINA)
-- =====================================================

-- Inserir planos exatamente como na página Plans.tsx
INSERT INTO planos (nome, preco, popular, recursos, ativo) VALUES
(
    'BÁSICO',
    6.99,
    false,
    '[
        "Todos os Filmes e Séries",
        "Lançamentos 2025 e 2026",
        "Catálogo Kids Completo",
        "Qualidade máxima de imagem",
        "1 dispositivo simultâneo",
        "Suporte por email"
    ]',
    true
),
(
    'PRO',
    9.99,
    true,
    '[
        "Todos os Filmes e Séries",
        "Lançamentos 2025 e 2026",
        "Catálogo Kids Completo",
        "Qualidade máxima de imagem",
        "4 dispositivos simultâneos",
        "Downloads para assistir offline",
        "Suporte Prioritário 24/7",
        "Conteúdo exclusivo e antecipado"
    ]',
    true
);

-- =====================================================
-- VIEWS FACILITADAS
-- =====================================================

-- View para planos ativos
CREATE VIEW planos_ativos AS
SELECT 
    id,
    nome,
    preco,
    popular,
    recursos,
    created_at,
    updated_at
FROM planos 
WHERE ativo = true
ORDER BY popular DESC, preco ASC;

-- View para usuários com planos ativos
CREATE VIEW usuarios_planos_ativos AS
SELECT 
    up.id,
    up.user_id,
    up.plano_id,
    p.nome as plano_nome,
    p.preco as plano_preco,
    up.status,
    up.data_inicio,
    up.data_fim,
    up.valor_pago,
    up.metodo_pagamento,
    up.created_at
FROM usuario_plano up
JOIN planos p ON up.plano_id = p.id
WHERE up.status = 'ativo' 
AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE);

-- =====================================================
-- FUNÇÕES ÚTEIS
-- =====================================================

-- Função para verificar se plano está ativo
CREATE OR REPLACE FUNCTION plano_ativo(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    plano_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO plano_count
    FROM usuario_plano
    WHERE user_id = user_id_param 
    AND status = 'ativo'
    AND (data_fim IS NULL OR data_fim >= CURRENT_DATE);
    
    RETURN plano_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION trigger_atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas
CREATE TRIGGER trigger_planos_updated_at
    BEFORE UPDATE ON planos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_timestamp();

CREATE TRIGGER trigger_usuario_plano_updated_at
    BEFORE UPDATE ON usuario_plano
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_timestamp();

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_plano ENABLE ROW LEVEL SECURITY;

-- Políticas para planos (leitura pública para usuários autenticados)
CREATE POLICY "Planos visíveis para usuários autenticados" ON planos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins podem gerenciar planos" ON planos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@cinecasa.com'
        )
    );

-- Políticas para usuario_plano (usuários só veem seus próprios planos)
CREATE POLICY "Usuários veem seus próprios planos" ON usuario_plano
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins podem gerenciar planos de usuários" ON usuario_plano
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@cinecasa.com'
        )
    );

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para planos
CREATE INDEX IF NOT EXISTS idx_planos_ativos ON planos(ativo);
CREATE INDEX IF NOT EXISTS idx_planos_populares ON planos(popular);
CREATE INDEX IF NOT EXISTS idx_planos_preco ON planos(preco);

-- Índices para usuario_plano
CREATE INDEX IF NOT EXISTS idx_usuario_plano_user_id ON usuario_plano(user_id);
CREATE INDEX IF NOT EXISTS idx_usuario_plano_status ON usuario_plano(status);
CREATE INDEX IF NOT EXISTS idx_usuario_plano_data_fim ON usuario_plano(data_fim);

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE planos IS 'Tabela de planos de assinatura do CineCasa (BÁSICO e PRO)';
COMMENT ON TABLE usuario_plano IS 'Relacionamento entre usuários e seus planos contratados';

COMMENT ON COLUMN planos.recursos IS 'JSON array com lista de recursos/benefícios do plano';
COMMENT ON COLUMN usuario_plano.status IS 'Status do plano: ativo, cancelado, expirado, pendente';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se tudo foi criado corretamente
SELECT 'Tabela planos criada com sucesso' as status;
SELECT 'Tabela usuario_plano criada com sucesso' as status;
SELECT COUNT(*) as total_planos FROM planos;
SELECT nome, preco, popular FROM planos ORDER BY popular DESC, preco ASC;

-- =====================================================
-- FIM DO SCRIPT - VERSÃO FINAL CORRIGIDA
-- =====================================================
