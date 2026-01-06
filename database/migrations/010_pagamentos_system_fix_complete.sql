-- ============================================
-- CORREÇÃO COMPLETA DO SISTEMA DE PAGAMENTOS
-- Migração 010 Fix Complete: Corrigir estrutura e funções
-- ============================================

-- ============================================
-- 1. CRIAR TABELA TRANSACOES SE NÃO EXISTIR
-- ============================================

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

-- Criar índices para transacoes se não existirem
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes (tipo);

CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes (status);

CREATE INDEX IF NOT EXISTS idx_transacoes_criado_em ON transacoes (criado_em);

CREATE INDEX IF NOT EXISTS idx_transacoes_origem ON transacoes (origem_id);

CREATE INDEX IF NOT EXISTS idx_transacoes_destino ON transacoes (destino_id);

-- ============================================
-- 3. REMOVER TRIGGERS E FUNÇÕES PROBLEMÁTICAS
-- ============================================

DROP TRIGGER IF EXISTS create_transaction_on_payment_insert ON pagamentos;

DROP TRIGGER IF EXISTS create_transaction_on_repasse_insert ON repasses;

DROP FUNCTION IF EXISTS create_transaction_on_payment ();

DROP FUNCTION IF EXISTS create_transaction_on_repasse ();

DROP FUNCTION IF EXISTS get_financial_summary (DATE, DATE);

-- ============================================
-- 4. RECRIAR FUNÇÕES CORRIGIDAS
-- ============================================

-- Função para criar transação quando pagamento é criado
CREATE OR REPLACE FUNCTION create_transaction_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO transacoes (tipo, origem_id, valor, status, descricao, referencia_pagamento, criado_em)
    VALUES (
        'pagamento',
        NEW.empresa_id,
        NEW.valor,
        NEW.status,
        'Pagamento de campanha',
        NEW.id,
        COALESCE(NEW.criado_em, NOW())
    );
    RETURN NEW;
END;
$$;

-- Função para criar transação quando repasse é criado
CREATE OR REPLACE FUNCTION create_transaction_on_repasse()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO transacoes (tipo, destino_id, valor, status, descricao, referencia_repasse, criado_em)
    VALUES (
        'repasse',
        NEW.motorista_id,
        NEW.valor_liquido,
        NEW.status,
        'Repasse de campanha',
        NEW.id,
        COALESCE(NEW.criado_em, NOW())
    );
    RETURN NEW;
END;
$$;

-- Função para obter resumo financeiro (CORRIGIDA)
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
    -- Verificar se a coluna criado_em existe antes de usar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pagamentos' AND column_name = 'criado_em'
    ) THEN
        -- Calcular receitas (pagamentos pagos)
        SELECT COALESCE(SUM(valor_liquido), 0) INTO v_total_receitas
        FROM pagamentos
        WHERE status = 'pago'
        AND DATE(criado_em) BETWEEN v_data_inicio AND v_data_fim;
        
        -- Contar pagamentos pendentes
        SELECT COUNT(*) INTO v_pagamentos_pendentes
        FROM pagamentos
        WHERE status IN ('pendente', 'processando');
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'repasses' AND column_name = 'criado_em'
    ) THEN
        -- Calcular despesas (repasses pagos)
        SELECT COALESCE(SUM(valor_liquido), 0) INTO v_total_despesas
        FROM repasses
        WHERE status = 'pago'
        AND DATE(criado_em) BETWEEN v_data_inicio AND v_data_fim;
        
        -- Contar repasses pendentes
        SELECT COUNT(*) INTO v_repasses_pendentes
        FROM repasses
        WHERE status IN ('pendente', 'processando');
    END IF;
    
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
-- 5. RECRIAR TRIGGERS
-- ============================================

CREATE TRIGGER create_transaction_on_payment_insert
    AFTER INSERT ON pagamentos
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_on_payment();

CREATE TRIGGER create_transaction_on_repasse_insert
    AFTER INSERT ON repasses
    FOR EACH ROW
    EXECUTE FUNCTION create_transaction_on_repasse();

-- ============================================
-- 6. CONFIGURAR RLS PARA TRANSACOES (se necessário)
-- ============================================

ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Política para admins verem todas as transações
DROP POLICY IF EXISTS "Admins podem ver todas as transações" ON transacoes;

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

-- Política para usuários verem suas próprias transações
DROP POLICY IF EXISTS "Usuários podem ver suas próprias transações" ON transacoes;

CREATE POLICY "Usuários podem ver suas próprias transações" ON transacoes FOR
SELECT TO authenticated USING (
        origem_id = auth.uid ()
        OR destino_id = auth.uid ()
    );

-- ============================================
-- 7. GARANTIR PERMISSÕES
-- ============================================

GRANT EXECUTE ON FUNCTION get_financial_summary(DATE, DATE) TO authenticated;