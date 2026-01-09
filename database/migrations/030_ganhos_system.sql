-- ============================================
-- SISTEMA DE GANHOS DE MOTORISTAS - MOVELLO
-- Migração 030: Sistema completo de ganhos para motoristas
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Dropar objetos existentes (para recriar com estrutura correta)
DROP TABLE IF EXISTS ganhos CASCADE;

DROP FUNCTION IF EXISTS get_motorista_ganhos_stats (UUID, VARCHAR) CASCADE;

DROP FUNCTION IF EXISTS get_motorista_ganhos_mensais (UUID, INTEGER) CASCADE;

-- Tabela de Ganhos (ganhos dos motoristas por exibição de anúncios)
CREATE TABLE ganhos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    motorista_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor >= 0),
    descricao TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'exibicao' CHECK (
        tipo IN (
            'exibicao',
            'bonus',
            'recompensa'
        )
    ),
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (
        status IN (
            'pendente',
            'processando',
            'pago',
            'falhou'
        )
    ),
    data_exibicao TIMESTAMP
    WITH
        TIME ZONE NOT NULL,
        campanha_id UUID REFERENCES campanhas (id) ON DELETE SET NULL,
        processado_em TIMESTAMP
    WITH
        TIME ZONE,
        processado_por UUID REFERENCES users (id) ON DELETE SET NULL,
        erro_mensagem TEXT,
        criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ganhos_motorista ON ganhos (motorista_id);

CREATE INDEX IF NOT EXISTS idx_ganhos_status ON ganhos (status);

CREATE INDEX IF NOT EXISTS idx_ganhos_tipo ON ganhos (tipo);

CREATE INDEX IF NOT EXISTS idx_ganhos_data_exibicao ON ganhos (data_exibicao);

CREATE INDEX IF NOT EXISTS idx_ganhos_campanha ON ganhos (campanha_id);

CREATE INDEX IF NOT EXISTS idx_ganhos_criado_em ON ganhos (criado_em);

CREATE INDEX IF NOT EXISTS idx_ganhos_motorista_status ON ganhos (motorista_id, status);

CREATE INDEX IF NOT EXISTS idx_ganhos_motorista_data ON ganhos (motorista_id, data_exibicao);

-- ============================================
-- 3. CRIAR TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ganhos_updated_at
    BEFORE UPDATE ON ganhos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. HABILITAR RLS
-- ============================================

ALTER TABLE ganhos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CRIAR POLÍTICAS RLS
-- ============================================

-- SELECT: Motoristas podem ver apenas seus próprios ganhos
CREATE POLICY "ganhos_select_own" ON ganhos FOR
SELECT TO authenticated USING (auth.uid () = motorista_id);

-- SELECT: Admins podem ver todos os ganhos
CREATE POLICY "ganhos_select_admin" ON ganhos FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM users u
            WHERE
                u.id = auth.uid ()
                AND u.tipo = 'admin'
        )
    );

-- INSERT: Apenas sistema/admin pode inserir ganhos
CREATE POLICY "ganhos_insert_admin" ON ganhos FOR
INSERT
    TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM users u
            WHERE
                u.id = auth.uid ()
                AND u.tipo = 'admin'
        )
    );

-- UPDATE: Apenas admin pode atualizar ganhos
CREATE POLICY "ganhos_update_admin" ON ganhos FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM users u
        WHERE
            u.id = auth.uid ()
            AND u.tipo = 'admin'
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM users u
            WHERE
                u.id = auth.uid ()
                AND u.tipo = 'admin'
        )
    );

-- DELETE: Apenas admin pode deletar ganhos
CREATE POLICY "ganhos_delete_admin" ON ganhos FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM users u
        WHERE
            u.id = auth.uid ()
            AND u.tipo = 'admin'
    )
);

-- ============================================
-- 6. CRIAR FUNÇÕES
-- ============================================

-- Função para obter estatísticas de ganhos do motorista
CREATE OR REPLACE FUNCTION get_motorista_ganhos_stats(
    p_motorista_id UUID,
    p_periodo VARCHAR DEFAULT 'mes'
)
RETURNS TABLE (
    ganhos_hoje DECIMAL(10, 2),
    ganhos_mes DECIMAL(10, 2),
    total_pendente DECIMAL(10, 2),
    total_pago DECIMAL(10, 2),
    total_ganhos DECIMAL(10, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_data_inicio TIMESTAMP WITH TIME ZONE;
    v_data_fim TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Definir período baseado no parâmetro
    CASE p_periodo
        WHEN 'hoje' THEN
            v_data_inicio := DATE_TRUNC('day', NOW());
            v_data_fim := NOW();
        WHEN 'semana' THEN
            v_data_inicio := DATE_TRUNC('week', NOW());
            v_data_fim := NOW();
        WHEN 'mes' THEN
            v_data_inicio := DATE_TRUNC('month', NOW());
            v_data_fim := NOW();
        WHEN 'ano' THEN
            v_data_inicio := DATE_TRUNC('year', NOW());
            v_data_fim := NOW();
        ELSE
            v_data_inicio := DATE_TRUNC('month', NOW());
            v_data_fim := NOW();
    END CASE;

    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN DATE_TRUNC('day', data_exibicao) = DATE_TRUNC('day', NOW()) THEN valor ELSE 0 END), 0)::DECIMAL(10, 2) AS ganhos_hoje,
        COALESCE(SUM(CASE WHEN data_exibicao >= v_data_inicio AND data_exibicao <= v_data_fim THEN valor ELSE 0 END), 0)::DECIMAL(10, 2) AS ganhos_mes,
        COALESCE(SUM(CASE WHEN status IN ('pendente', 'processando') THEN valor ELSE 0 END), 0)::DECIMAL(10, 2) AS total_pendente,
        COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0)::DECIMAL(10, 2) AS total_pago,
        COALESCE(SUM(valor), 0)::DECIMAL(10, 2) AS total_ganhos
    FROM ganhos
    WHERE motorista_id = p_motorista_id;
END;
$$;

-- Função para obter ganhos mensais (para gráficos)
CREATE OR REPLACE FUNCTION get_motorista_ganhos_mensais(
    p_motorista_id UUID,
    p_ano INTEGER DEFAULT EXTRACT(YEAR FROM NOW())
)
RETURNS TABLE (
    mes INTEGER,
    mes_nome VARCHAR,
    valor DECIMAL(10, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(MONTH FROM data_exibicao)::INTEGER AS mes,
        TO_CHAR(data_exibicao, 'Mon') AS mes_nome,
        COALESCE(SUM(valor), 0)::DECIMAL(10, 2) AS valor
    FROM ganhos
    WHERE motorista_id = p_motorista_id
    AND EXTRACT(YEAR FROM data_exibicao) = p_ano
    AND status = 'pago'
    GROUP BY EXTRACT(MONTH FROM data_exibicao), TO_CHAR(data_exibicao, 'Mon')
    ORDER BY mes;
END;
$$;

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================

COMMENT ON
TABLE ganhos IS 'Tabela de ganhos dos motoristas por exibição de anúncios';

COMMENT ON COLUMN ganhos.motorista_id IS 'ID do motorista que recebeu o ganho';

COMMENT ON COLUMN ganhos.valor IS 'Valor do ganho em reais';

COMMENT ON COLUMN ganhos.descricao IS 'Descrição do ganho';

COMMENT ON COLUMN ganhos.tipo IS 'Tipo de ganho: exibicao, bonus ou recompensa';

COMMENT ON COLUMN ganhos.status IS 'Status do ganho: pendente, processando, pago ou falhou';

COMMENT ON COLUMN ganhos.data_exibicao IS 'Data em que o anúncio foi exibido';

COMMENT ON COLUMN ganhos.campanha_id IS 'ID da campanha relacionada (opcional)';

COMMENT ON COLUMN ganhos.processado_em IS 'Data em que o ganho foi processado';

COMMENT ON FUNCTION get_motorista_ganhos_stats IS 'Retorna estatísticas de ganhos do motorista para um período específico';

COMMENT ON FUNCTION get_motorista_ganhos_mensais IS 'Retorna ganhos mensais do motorista para um ano específico';