-- ============================================
-- SISTEMA DE CAMPANHAS - MOVELLO
-- Migração 008: Sistema completo de campanhas e mídias
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Tabela de Campanhas
CREATE TABLE IF NOT EXISTS campanhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    empresa_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    orcamento DECIMAL(10, 2) NOT NULL DEFAULT 0,
    orcamento_utilizado DECIMAL(10, 2) NOT NULL DEFAULT 0,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'em_analise' CHECK (
        status IN (
            'em_analise',
            'aprovada',
            'reprovada',
            'ativa',
            'pausada',
            'finalizada',
            'cancelada'
        )
    ),
    aprovado_por UUID REFERENCES users (id) ON DELETE SET NULL,
    aprovado_em TIMESTAMP
    WITH
        TIME ZONE,
        motivo_reprovacao TEXT,
        criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Mídias
CREATE TABLE IF NOT EXISTS midias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    campanha_id UUID NOT NULL REFERENCES campanhas (id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('imagem', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'em_analise' CHECK (
        status IN (
            'em_analise',
            'aprovada',
            'reprovada'
        )
    ),
    aprovado_por UUID REFERENCES users (id) ON DELETE SET NULL,
    aprovado_em TIMESTAMP
    WITH
        TIME ZONE,
        motivo_reprovacao TEXT,
        ordem INTEGER NOT NULL DEFAULT 0,
        criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Métricas de Campanha
CREATE TABLE IF NOT EXISTS campanha_metricas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    campanha_id UUID NOT NULL REFERENCES campanhas (id) ON DELETE CASCADE,
    data DATE NOT NULL,
    visualizacoes INTEGER NOT NULL DEFAULT 0,
    cliques INTEGER NOT NULL DEFAULT 0,
    conversoes INTEGER NOT NULL DEFAULT 0,
    valor_gasto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (campanha_id, data)
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_campanhas_empresa ON campanhas (empresa_id);

CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas (status);

CREATE INDEX IF NOT EXISTS idx_campanhas_data_inicio ON campanhas (data_inicio);

CREATE INDEX IF NOT EXISTS idx_campanhas_data_fim ON campanhas (data_fim);

CREATE INDEX IF NOT EXISTS idx_campanhas_aprovado_por ON campanhas (aprovado_por);

CREATE INDEX IF NOT EXISTS idx_midias_campanha ON midias (campanha_id);

CREATE INDEX IF NOT EXISTS idx_midias_status ON midias (status);

CREATE INDEX IF NOT EXISTS idx_midias_ordem ON midias (campanha_id, ordem);

CREATE INDEX IF NOT EXISTS idx_campanha_metricas_campanha ON campanha_metricas (campanha_id);

CREATE INDEX IF NOT EXISTS idx_campanha_metricas_data ON campanha_metricas (data);

-- ============================================
-- 3. CRIAR TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em campanhas
CREATE TRIGGER update_campanhas_updated_at
    BEFORE UPDATE ON campanhas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. CRIAR FUNÇÕES SQL
-- ============================================

-- Função para aprovar campanha
CREATE OR REPLACE FUNCTION approve_campanha(
    p_campanha_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE campanhas
    SET 
        status = 'aprovada',
        aprovado_por = p_admin_id,
        aprovado_em = NOW(),
        atualizado_em = NOW()
    WHERE id = p_campanha_id AND status = 'em_analise';
    
    RETURN FOUND;
END;
$$;

-- Função para reprovar campanha
CREATE OR REPLACE FUNCTION reject_campanha(
    p_campanha_id UUID,
    p_admin_id UUID,
    p_motivo TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE campanhas
    SET 
        status = 'reprovada',
        aprovado_por = p_admin_id,
        aprovado_em = NOW(),
        motivo_reprovacao = p_motivo,
        atualizado_em = NOW()
    WHERE id = p_campanha_id AND status = 'em_analise';
    
    RETURN FOUND;
END;
$$;

-- Função para pausar campanha
CREATE OR REPLACE FUNCTION pause_campanha(
    p_campanha_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE campanhas
    SET 
        status = 'pausada',
        atualizado_em = NOW()
    WHERE id = p_campanha_id AND status IN ('aprovada', 'ativa');
    
    RETURN FOUND;
END;
$$;

-- Função para ativar campanha
CREATE OR REPLACE FUNCTION activate_campanha(
    p_campanha_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE campanhas
    SET 
        status = 'ativa',
        atualizado_em = NOW()
    WHERE id = p_campanha_id AND status IN ('aprovada', 'pausada');
    
    RETURN FOUND;
END;
$$;

-- Função para aprovar mídia
CREATE OR REPLACE FUNCTION approve_midia(
    p_midia_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE midias
    SET 
        status = 'aprovada',
        aprovado_por = p_admin_id,
        aprovado_em = NOW()
    WHERE id = p_midia_id AND status = 'em_analise';
    
    RETURN FOUND;
END;
$$;

-- Função para reprovar mídia
CREATE OR REPLACE FUNCTION reject_midia(
    p_midia_id UUID,
    p_admin_id UUID,
    p_motivo TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE midias
    SET 
        status = 'reprovada',
        aprovado_por = p_admin_id,
        aprovado_em = NOW(),
        motivo_reprovacao = p_motivo
    WHERE id = p_midia_id AND status = 'em_analise';
    
    RETURN FOUND;
END;
$$;

-- ============================================
-- 5. CONFIGURAR RLS (Row Level Security)
-- ============================================

ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;

ALTER TABLE midias ENABLE ROW LEVEL SECURITY;

ALTER TABLE campanha_metricas ENABLE ROW LEVEL SECURITY;

-- Políticas para campanhas
CREATE POLICY "Admins podem ver todas as campanhas" ON campanhas FOR
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

CREATE POLICY "Empresas podem ver suas próprias campanhas" ON campanhas FOR
SELECT TO authenticated USING (empresa_id = auth.uid ());

CREATE POLICY "Admins podem atualizar campanhas" ON campanhas FOR
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

-- Políticas para mídias
CREATE POLICY "Admins podem ver todas as mídias" ON midias FOR
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

CREATE POLICY "Empresas podem ver mídias de suas campanhas" ON midias FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM campanhas c
            WHERE
                c.id = midias.campanha_id
                AND c.empresa_id = auth.uid ()
        )
    );

CREATE POLICY "Admins podem atualizar mídias" ON midias FOR
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

-- Políticas para métricas
CREATE POLICY "Admins podem ver todas as métricas" ON campanha_metricas FOR
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

CREATE POLICY "Empresas podem ver métricas de suas campanhas" ON campanha_metricas FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM campanhas c
            WHERE
                c.id = campanha_metricas.campanha_id
                AND c.empresa_id = auth.uid ()
        )
    );

-- ============================================
-- 6. CONCEDER PERMISSÕES
-- ============================================

GRANT EXECUTE ON FUNCTION approve_campanha(UUID, UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION reject_campanha (UUID, UUID, TEXT) TO authenticated;

GRANT
EXECUTE ON FUNCTION pause_campanha (UUID, UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION activate_campanha (UUID, UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION approve_midia (UUID, UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION reject_midia (UUID, UUID, TEXT) TO authenticated;