-- =====================================================
-- TABELAS DE PLANOS - CINECASA SUPABASE
-- =====================================================

-- 1. Tabela de Planos
CREATE TABLE IF NOT EXISTS planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    duracao_meses INTEGER NOT NULL,
    recursos JSONB NOT NULL,
    popular BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Preços Históricos
CREATE TABLE IF NOT EXISTS preco_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plano_id UUID REFERENCES planos(id) ON DELETE CASCADE,
    preco_antigo DECIMAL(10,2) NOT NULL,
    preco_novo DECIMAL(10,2) NOT NULL,
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alterado_por VARCHAR(100)
);

-- 3. Tabela de Usuários x Planos
CREATE TABLE IF NOT EXISTS usuario_plano (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plano_id UUID REFERENCES planos(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'expirado', 'pendente')),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    data_cancelamento TIMESTAMP WITH TIME ZONE,
    valor_pago DECIMAL(10,2),
    metodo_pagamento VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, status)
);

-- 4. Tabela de Configurações de Pagamento
CREATE TABLE IF NOT EXISTS config_pagamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chave VARCHAR(200) NOT NULL,
    valor TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('pix_key', 'payment_method', 'email_notification', 'other')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERÇÃO DE DADOS INICIAIS
-- =====================================================

-- Inserir planos padrão
INSERT INTO planos (nome, descricao, preco, duracao_meses, recursos, popular, ativo) VALUES
(
    'Plano Mensal',
    'Acesso completo por 30 dias',
    19.90,
    1,
    '{
        "streaming_ilimitado": true,
        "qualidade_hd": true,
        "qualidade_4k": false,
        "dispositivos_simultaneos": 1,
        "downloads_offline": false,
        "conteudo_exclusivo": false,
        "suporte_prioritario": false
    }',
    false,
    true
),
(
    'Plano Trimestral',
    'Economia de 20% com 3 meses de acesso',
    47.70,
    3,
    '{
        "streaming_ilimitado": true,
        "qualidade_hd": true,
        "qualidade_4k": true,
        "dispositivos_simultaneos": 2,
        "downloads_offline": true,
        "conteudo_exclusivo": true,
        "suporte_prioritario": false
    }',
    false,
    true
),
(
    'Plano Anual',
    'Economia de 40% com 12 meses de acesso',
    143.52,
    12,
    '{
        "streaming_ilimitado": true,
        "qualidade_hd": true,
        "qualidade_4k": true,
        "dispositivos_simultaneos": 4,
        "downloads_offline": true,
        "conteudo_exclusivo": true,
        "suporte_prioritario": true
    }',
    true,
    true
),
(
    'Plano Família',
    'Para toda a família com acesso compartilhado',
    59.90,
    1,
    '{
        "streaming_ilimitado": true,
        "qualidade_hd": true,
        "qualidade_4k": true,
        "dispositivos_simultaneos": 6,
        "downloads_offline": true,
        "conteudo_exclusivo": true,
        "suporte_prioritario": true,
        "perfis_infantis": true,
        "controle_parental": true
    }',
    false,
    true
);

-- Inserir configurações de pagamento
INSERT INTO config_pagamento (chave, valor, tipo, ativo) VALUES
('pix_key', '6c4d357b-9ec7-4900-84cf-a221f4d990d9', 'pix_key', true),
('payment_methods', '["pix", "credit_card", "debit_card"]', 'payment_method', true),
('email_notifications', 'true', 'email_notification', true),
('payment_timeout_hours', '24', 'other', true);

-- =====================================================
-- CRIAÇÃO DE VIEWS FACILITADAS
-- =====================================================

-- View para planos ativos
CREATE OR REPLACE VIEW planos_ativos AS
SELECT 
    id,
    nome,
    descricao,
    preco,
    duracao_meses,
    recursos,
    popular,
    created_at,
    updated_at
FROM planos 
WHERE ativo = true
ORDER BY popular DESC, preco ASC;

-- View para usuários com planos ativos
CREATE OR REPLACE VIEW usuarios_planos_ativos AS
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

-- Função para calcular data de fim baseada na duração
CREATE OR REPLACE FUNCTION calcular_data_fim(meses INTEGER, data_inicio DATE)
RETURNS DATE AS $$
BEGIN
    RETURN (data_inicio + INTERVAL '1 month' * meses)::DATE;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER trigger_config_pagamento_updated_at
    BEFORE UPDATE ON config_pagamento
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_timestamp();

-- Trigger para registrar histórico de preços
CREATE OR REPLACE FUNCTION registrar_historico_preco()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o preço foi alterado, registrar no histórico
    IF TG_OP = 'UPDATE' AND OLD.preco IS DISTINCT FROM NEW.preco THEN
        INSERT INTO preco_historico (plano_id, preco_antigo, preco_novo, alterado_por)
        VALUES (NEW.id, OLD.preco, NEW.preco, current_user);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historico_preco
    BEFORE UPDATE ON planos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_timestamp();

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS - ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE preco_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_pagamento ENABLE ROW LEVEL SECURITY;

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

-- Políticas para usuário_plano (usuários só veem seus próprios planos)
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

-- Índices para preco_historico
CREATE INDEX IF NOT EXISTS idx_preco_historico_plano_id ON preco_historico(plano_id);
CREATE INDEX IF NOT EXISTS idx_preco_historico_data ON preco_historico(data_alteracao);

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE planos IS 'Tabela principal de planos de assinatura do CineCasa';
COMMENT ON TABLE preco_historico IS 'Histórico de alterações de preços dos planos';
COMMENT ON TABLE usuario_plano IS 'Relacionamento entre usuários e seus planos contratados';
COMMENT ON TABLE config_pagamento IS 'Configurações gerais do sistema de pagamentos';

COMMENT ON COLUMN planos.recursos IS 'JSON com recursos disponíveis no plano (streaming, qualidade, dispositivos, etc.)';
COMMENT ON COLUMN usuario_plano.status IS 'Status do plano: ativo, cancelado, expirado, pendente';
COMMENT ON COLUMN config_pagamento.tipo IS 'Tipo de configuração: pix_key, payment_method, email_notification, other';

-- =====================================================
-- EXEMPLOS DE CONSULTAS ÚTEIS
-- =====================================================

/*
-- 1. Listar todos os planos ativos ordenados por popularidade
SELECT * FROM planos_ativos ORDER BY popular DESC, preco ASC;

-- 2. Verificar plano de um usuário específico
SELECT * FROM usuarios_planos_ativos WHERE user_id = 'UUID_DO_USUARIO';

-- 3. Histórico de preços de um plano
SELECT * FROM preco_historico WHERE plano_id = 'UUID_DO_PLANO' ORDER BY data_alteracao DESC;

-- 4. Estatísticas de planos contratados
SELECT 
    p.nome,
    COUNT(up.id) as total_contratados,
    SUM(up.valor_pago) as total_receita
FROM planos p
LEFT JOIN usuario_plano up ON p.id = up.plano_id AND up.status = 'ativo'
GROUP BY p.id, p.nome
ORDER BY total_contratados DESC;

-- 5. Planos expirando nos próximos 30 dias
SELECT 
    up.user_id,
    p.nome as plano_nome,
    up.data_fim,
    up.data_fim - CURRENT_DATE as dias_restantes
FROM usuario_plano up
JOIN planos p ON up.plano_id = p.id
WHERE up.status = 'ativo'
AND up.data_fim BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY up.data_fem ASC;
*/

-- =====================================================
-- FIM DO SCRIPT - TABELAS PRONTAS PARA USO
-- =====================================================
