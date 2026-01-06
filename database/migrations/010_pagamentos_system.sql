-- ============================================
-- SISTEMA DE PAGAMENTOS E REPASSES - MOVELLO
-- Migração 010: Sistema completo de pagamentos, repasses e transações
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Tabela de Pagamentos (de empresas para plataforma)
CREATE TABLE IF NOT EXISTS pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    empresa_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    campanha_id UUID REFERENCES campanhas (id) ON DELETE SET NULL,
    valor DECIMAL(10, 2) NOT NULL,
    taxa_comissao DECIMAL(5, 2) NOT NULL DEFAULT 0,
    valor_liquido DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (
        status IN (
            'pendente',
            'processando',
            'pago',
            'falhou',
            'cancelado',
            'reembolsado'
        )
    ),
    metodo_pagamento VARCHAR(50),
    referencia_externa VARCHAR(255),
    processado_em TIMESTAMP
    WITH
        TIME ZONE,
        processado_por UUID REFERENCES users (id) ON DELETE SET NULL,
        erro_mensagem TEXT,
        criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Repasses (da plataforma para motoristas)
CREATE TABLE IF NOT EXISTS repasses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    motorista_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    campanha_id UUID REFERENCES campanhas (id) ON DELETE SET NULL,
    valor DECIMAL(10, 2) NOT NULL,
    taxa_comissao DECIMAL(5, 2) NOT NULL DEFAULT 0,
    valor_liquido DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (
        status IN (
            'pendente',
            'processando',
            'pago',
            'falhou'
        )
    ),
    metodo_pagamento VARCHAR(50),
    referencia_externa VARCHAR(255),
    processado_em TIMESTAMP
    WITH
        TIME ZONE,
        processado_por UUID REFERENCES users (id) ON DELETE SET NULL,
        erro_mensagem TEXT,
        criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Transações (histórico geral)
CREATE TABLE IF NOT EXISTS transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    tipo VARCHAR(50) NOT NULL CHECK (
        tipo IN ('pagamento', 'repasse')
    ),
    origem_id UUID REFERENCES users (id) ON DELETE SET NULL,
    destino_id UUID REFERENCES users (id) ON DELETE SET NULL,
    valor DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (
        status IN (
            'pendente',
            'processando',
            'concluida',
            'falhou',
            'cancelada'
        )
    ),
    descricao TEXT,
    referencia_pagamento UUID REFERENCES pagamentos (id) ON DELETE SET NULL,
    referencia_repasse UUID REFERENCES repasses (id) ON DELETE SET NULL,
    criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pagamentos_empresa ON pagamentos (empresa_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_campanha ON pagamentos (campanha_id);

CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos (status);

CREATE INDEX IF NOT EXISTS idx_pagamentos_criado_em ON pagamentos (criado_em);

CREATE INDEX IF NOT EXISTS idx_pagamentos_processado_em ON pagamentos (processado_em);

CREATE INDEX IF NOT EXISTS idx_repasses_motorista ON repasses (motorista_id);

CREATE INDEX IF NOT EXISTS idx_repasses_campanha ON repasses (campanha_id);

CREATE INDEX IF NOT EXISTS idx_repasses_status ON repasses (status);

CREATE INDEX IF NOT EXISTS idx_repasses_criado_em ON repasses (criado_em);

CREATE INDEX IF NOT EXISTS idx_repasses_processado_em ON repasses (processado_em);

CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes (tipo);

CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes (status);

CREATE INDEX IF NOT EXISTS idx_transacoes_criado_em ON transacoes (criado_em);

CREATE INDEX IF NOT EXISTS idx_transacoes_origem ON transacoes (origem_id);

CREATE INDEX IF NOT EXISTS idx_transacoes_destino ON transacoes (destino_id);

-- ============================================
-- 3. CRIAR TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em pagamentos
CREATE TRIGGER update_pagamentos_updated_at
    BEFORE UPDATE ON pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em repasses
CREATE TRIGGER update_repasses_updated_at
    BEFORE UPDATE ON repasses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar transação quando pagamento é criado
CREATE OR REPLACE FUNCTION create_transaction_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO transacoes (tipo, origem_id, valor, status, descricao, referencia_pagamento)
    VALUES (
        'pagamento',
        NEW.empresa_id,
        NEW.valor,
        NEW.status,
        'Pagamento de campanha',
        NEW.id
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER create_transaction_on_payment_insert
    AFTER INSERT ON pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_on_payment();

-- Trigger para criar transação quando repasse é criado
CREATE OR REPLACE FUNCTION create_transaction_on_repasse()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO transacoes (tipo, destino_id, valor, status, descricao, referencia_repasse)
    VALUES (
        'repasse',
        NEW.motorista_id,
        NEW.valor_liquido,
        NEW.status,
        'Repasse de campanha',
        NEW.id
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER create_transaction_on_repasse_insert
    AFTER INSERT ON repasses
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_on_repasse();

-- ============================================
-- 4. CRIAR FUNÇÕES SQL
-- ============================================

-- Função para processar pagamento
CREATE OR REPLACE FUNCTION process_payment(
    p_pagamento_id UUID,
    p_admin_id UUID,
    p_referencia_externa VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE pagamentos
    SET 
        status = 'pago',
        processado_em = NOW(),
        processado_por = p_admin_id,
        referencia_externa = COALESCE(p_referencia_externa, referencia_externa),
        atualizado_em = NOW()
    WHERE id = p_pagamento_id AND status IN ('pendente', 'processando');
    
    -- Atualizar transação relacionada
    UPDATE transacoes
    SET status = 'concluida'
    WHERE referencia_pagamento = p_pagamento_id;
    
    RETURN FOUND;
END;
$$;

-- Função para processar repasse
CREATE OR REPLACE FUNCTION process_repasse(
    p_repasse_id UUID,
    p_admin_id UUID,
    p_referencia_externa VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE repasses
    SET 
        status = 'pago',
        processado_em = NOW(),
        processado_por = p_admin_id,
        referencia_externa = COALESCE(p_referencia_externa, referencia_externa),
        atualizado_em = NOW()
    WHERE id = p_repasse_id AND status IN ('pendente', 'processando');
    
    -- Atualizar transação relacionada
    UPDATE transacoes
    SET status = 'concluida'
    WHERE referencia_repasse = p_repasse_id;
    
    RETURN FOUND;
END;
$$;

-- Função para reprocessar pagamento falhado
CREATE OR REPLACE FUNCTION retry_failed_payment(
    p_pagamento_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE pagamentos
    SET 
        status = 'processando',
        erro_mensagem = NULL,
        atualizado_em = NOW()
    WHERE id = p_pagamento_id AND status = 'falhou';
    
    RETURN FOUND;
END;
$$;

-- Função para obter resumo financeiro
CREATE OR REPLACE FUNCTION get_financial_summary(
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
    total_receitas DECIMAL,
    total_despesas DECIMAL,
    saldo DECIMAL,
    pagamentos_pendentes INTEGER,
    repasses_pendentes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_data_inicio DATE := COALESCE(p_data_inicio, CURRENT_DATE - INTERVAL '30 days');
    v_data_fim DATE := COALESCE(p_data_fim, CURRENT_DATE);
    v_total_receitas DECIMAL := 0;
    v_total_despesas DECIMAL := 0;
    v_pagamentos_pendentes INTEGER := 0;
    v_repasses_pendentes INTEGER := 0;
BEGIN
    -- Calcular receitas (pagamentos pagos)
    SELECT COALESCE(SUM(valor_liquido), 0) INTO v_total_receitas
    FROM pagamentos
    WHERE status = 'pago'
    AND DATE(criado_em) BETWEEN v_data_inicio AND v_data_fim;
    
    -- Calcular despesas (repasses pagos)
    SELECT COALESCE(SUM(valor_liquido), 0) INTO v_total_despesas
    FROM repasses
    WHERE status = 'pago'
    AND DATE(criado_em) BETWEEN v_data_inicio AND v_data_fim;
    
    -- Contar pagamentos pendentes
    SELECT COUNT(*) INTO v_pagamentos_pendentes
    FROM pagamentos
    WHERE status IN ('pendente', 'processando');
    
    -- Contar repasses pendentes
    SELECT COUNT(*) INTO v_repasses_pendentes
    FROM repasses
    WHERE status IN ('pendente', 'processando');
    
    RETURN QUERY
    SELECT 
        v_total_receitas as total_receitas,
        v_total_despesas as total_despesas,
        (v_total_receitas - v_total_despesas) as saldo,
        v_pagamentos_pendentes as pagamentos_pendentes,
        v_repasses_pendentes as repasses_pendentes;
END;
$$;

-- ============================================
-- 5. CONFIGURAR RLS (Row Level Security)
-- ============================================

ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;

ALTER TABLE repasses ENABLE ROW LEVEL SECURITY;

ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para pagamentos
CREATE POLICY "Admins podem ver todos os pagamentos" ON pagamentos FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
            WHERE
                ur.user_id = auth.uid ()
                AND r.slug IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Empresas podem ver seus próprios pagamentos" ON pagamentos FOR
SELECT TO authenticated USING (empresa_id = auth.uid ());

CREATE POLICY "Admins podem atualizar pagamentos" ON pagamentos FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN ('admin', 'super_admin')
    )
);

-- Políticas para repasses
CREATE POLICY "Admins podem ver todos os repasses" ON repasses FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
            WHERE
                ur.user_id = auth.uid ()
                AND r.slug IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Motoristas podem ver seus próprios repasses" ON repasses FOR
SELECT TO authenticated USING (motorista_id = auth.uid ());

CREATE POLICY "Admins podem atualizar repasses" ON repasses FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN ('admin', 'super_admin')
    )
);

-- Políticas para transações
CREATE POLICY "Admins podem ver todas as transações" ON transacoes FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
            WHERE
                ur.user_id = auth.uid ()
                AND r.slug IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Usuários podem ver suas próprias transações" ON transacoes FOR
SELECT TO authenticated USING (
        origem_id = auth.uid ()
        OR destino_id = auth.uid ()
    );

-- ============================================
-- 6. CONCEDER PERMISSÕES
-- ============================================

GRANT EXECUTE ON FUNCTION process_payment(UUID, UUID, VARCHAR) TO authenticated;

GRANT
EXECUTE ON FUNCTION process_repasse (UUID, UUID, VARCHAR) TO authenticated;

GRANT
EXECUTE ON FUNCTION retry_failed_payment (UUID, UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION get_financial_summary (DATE, DATE) TO authenticated;