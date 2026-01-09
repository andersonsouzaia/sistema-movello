-- ============================================
-- SISTEMA DE TABLETS - MOVELLO
-- Migração 031: Sistema completo de gerenciamento de tablets
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Dropar objetos existentes (para recriar com estrutura correta)
DROP TABLE IF EXISTS tablets CASCADE;

DROP FUNCTION IF EXISTS validar_tablet_disponivel (VARCHAR) CASCADE;

DROP FUNCTION IF EXISTS vincular_tablet_motorista (UUID, VARCHAR) CASCADE;

DROP FUNCTION IF EXISTS desvincular_tablet_motorista (UUID) CASCADE;

DROP FUNCTION IF EXISTS update_tablet_status_on_motorista_change () CASCADE;

-- Tabela de Tablets
CREATE TABLE tablets (
    id VARCHAR(255) PRIMARY KEY, -- tablet_id usado pelo sistema
    modelo VARCHAR(100),
    serial_number VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'disponivel' CHECK (
        status IN (
            'disponivel',
            'vinculado',
            'manutencao'
        )
    ),
    motorista_id UUID REFERENCES users (id) ON DELETE SET NULL,
    ultima_conexao TIMESTAMP
    WITH
        TIME ZONE,
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

CREATE INDEX IF NOT EXISTS idx_tablets_motorista ON tablets (motorista_id);

CREATE INDEX IF NOT EXISTS idx_tablets_status ON tablets (status);

CREATE INDEX IF NOT EXISTS idx_tablets_serial ON tablets (serial_number);

CREATE INDEX IF NOT EXISTS idx_tablets_ultima_conexao ON tablets (ultima_conexao);

-- ============================================
-- 3. CRIAR TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tablets_updated_at
    BEFORE UPDATE ON tablets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar status quando motorista_id muda
CREATE OR REPLACE FUNCTION update_tablet_status_on_motorista_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se motorista_id foi definido, status = 'vinculado'
    IF NEW.motorista_id IS NOT NULL THEN
        NEW.status := 'vinculado';
    -- Se motorista_id foi removido, status = 'disponivel'
    ELSIF NEW.motorista_id IS NULL AND OLD.motorista_id IS NOT NULL THEN
        NEW.status := 'disponivel';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_tablet_status_trigger
    BEFORE UPDATE ON tablets
    FOR EACH ROW
    WHEN (OLD.motorista_id IS DISTINCT FROM NEW.motorista_id)
    EXECUTE FUNCTION update_tablet_status_on_motorista_change();

-- ============================================
-- 4. HABILITAR RLS
-- ============================================

ALTER TABLE tablets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CRIAR POLÍTICAS RLS
-- ============================================

-- SELECT: Motoristas podem ver tablets vinculados a eles
CREATE POLICY "tablets_select_own" ON tablets FOR
SELECT TO authenticated USING (
        auth.uid () = motorista_id
        OR EXISTS (
            SELECT 1
            FROM users u
            WHERE
                u.id = auth.uid ()
                AND u.tipo = 'admin'
        )
    );

-- SELECT: Admins podem ver todos os tablets
CREATE POLICY "tablets_select_admin" ON tablets FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM users u
            WHERE
                u.id = auth.uid ()
                AND u.tipo = 'admin'
        )
    );

-- INSERT: Apenas admin pode inserir tablets
CREATE POLICY "tablets_insert_admin" ON tablets FOR
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

-- UPDATE: Motoristas podem atualizar apenas seus próprios tablets (para vincular)
-- Admins podem atualizar todos
CREATE POLICY "tablets_update_own" ON tablets FOR
UPDATE TO authenticated USING (
    auth.uid () = motorista_id
    OR EXISTS (
        SELECT 1
        FROM users u
        WHERE
            u.id = auth.uid ()
            AND u.tipo = 'admin'
    )
)
WITH
    CHECK (
        auth.uid () = motorista_id
        OR EXISTS (
            SELECT 1
            FROM users u
            WHERE
                u.id = auth.uid ()
                AND u.tipo = 'admin'
        )
    );

-- DELETE: Apenas admin pode deletar tablets
CREATE POLICY "tablets_delete_admin" ON tablets FOR DELETE TO authenticated USING (
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

-- Função para validar se tablet está disponível para vinculação
CREATE OR REPLACE FUNCTION validar_tablet_disponivel(p_tablet_id VARCHAR)
RETURNS TABLE (
    existe BOOLEAN,
    disponivel BOOLEAN,
    status VARCHAR,
    motorista_id UUID,
    mensagem TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tablet RECORD;
BEGIN
    -- Buscar tablet
    SELECT * INTO v_tablet
    FROM tablets
    WHERE id = p_tablet_id;

    -- Se não existe
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, NULL::VARCHAR, NULL::UUID, 'Tablet não encontrado'::TEXT;
        RETURN;
    END IF;

    -- Se está em manutenção
    IF v_tablet.status = 'manutencao' THEN
        RETURN QUERY SELECT true, false, v_tablet.status, v_tablet.motorista_id, 'Tablet está em manutenção'::TEXT;
        RETURN;
    END IF;

    -- Se já está vinculado a outro motorista
    IF v_tablet.motorista_id IS NOT NULL THEN
        RETURN QUERY SELECT true, false, v_tablet.status, v_tablet.motorista_id, 'Tablet já está vinculado a outro motorista'::TEXT;
        RETURN;
    END IF;

    -- Tablet disponível
    RETURN QUERY SELECT true, true, v_tablet.status, NULL::UUID, 'Tablet disponível para vinculação'::TEXT;
END;
$$;

-- Função para vincular tablet ao motorista
CREATE OR REPLACE FUNCTION vincular_tablet_motorista(
    p_motorista_id UUID,
    p_tablet_id VARCHAR
)
RETURNS TABLE (
    sucesso BOOLEAN,
    mensagem TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_validacao RECORD;
BEGIN
    -- Validar disponibilidade
    SELECT * INTO v_validacao
    FROM validar_tablet_disponivel(p_tablet_id);

    IF NOT v_validacao.existe THEN
        RETURN QUERY SELECT false, 'Tablet não encontrado'::TEXT;
        RETURN;
    END IF;

    IF NOT v_validacao.disponivel THEN
        RETURN QUERY SELECT false, v_validacao.mensagem;
        RETURN;
    END IF;

    -- Desvincular tablet atual do motorista (se houver)
    UPDATE tablets
    SET motorista_id = NULL,
        updated_at = NOW()
    WHERE motorista_id = p_motorista_id;

    -- Vincular novo tablet
    UPDATE tablets
    SET motorista_id = p_motorista_id,
        updated_at = NOW()
    WHERE id = p_tablet_id;

    -- Atualizar tablet_id na tabela motoristas
    UPDATE motoristas
    SET tablet_id = p_tablet_id,
        updated_at = NOW()
    WHERE id = p_motorista_id;

    RETURN QUERY SELECT true, 'Tablet vinculado com sucesso'::TEXT;
END;
$$;

-- Função para desvincular tablet do motorista
CREATE OR REPLACE FUNCTION desvincular_tablet_motorista(
    p_motorista_id UUID
)
RETURNS TABLE (
    sucesso BOOLEAN,
    mensagem TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tablet_id VARCHAR;
BEGIN
    -- Buscar tablet_id do motorista
    SELECT tablet_id INTO v_tablet_id
    FROM motoristas
    WHERE id = p_motorista_id;

    IF v_tablet_id IS NULL THEN
        RETURN QUERY SELECT false, 'Motorista não possui tablet vinculado'::TEXT;
        RETURN;
    END IF;

    -- Desvincular tablet
    UPDATE tablets
    SET motorista_id = NULL,
        updated_at = NOW()
    WHERE id = v_tablet_id;

    -- Remover tablet_id da tabela motoristas
    UPDATE motoristas
    SET tablet_id = NULL,
        updated_at = NOW()
    WHERE id = p_motorista_id;

    RETURN QUERY SELECT true, 'Tablet desvinculado com sucesso'::TEXT;
END;
$$;

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE tablets IS 'Tabela de tablets do sistema';

COMMENT ON COLUMN tablets.id IS 'ID único do tablet (tablet_id)';

COMMENT ON COLUMN tablets.modelo IS 'Modelo do tablet';

COMMENT ON COLUMN tablets.serial_number IS 'Número de série do tablet';

COMMENT ON COLUMN tablets.status IS 'Status do tablet: disponivel, vinculado ou manutencao';

COMMENT ON COLUMN tablets.motorista_id IS 'ID do motorista vinculado ao tablet';

COMMENT ON COLUMN tablets.ultima_conexao IS 'Data da última conexão do tablet';

COMMENT ON FUNCTION validar_tablet_disponivel IS 'Valida se um tablet está disponível para vinculação';

COMMENT ON FUNCTION vincular_tablet_motorista IS 'Vincula um tablet a um motorista com validações';

COMMENT ON FUNCTION desvincular_tablet_motorista IS 'Desvincula o tablet de um motorista';