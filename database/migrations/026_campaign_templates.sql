-- ============================================
-- TEMPLATES DE CAMPANHA
-- Migração 026: Sistema de templates de campanha completos
-- Data: 2024
-- ============================================

-- ============================================
-- 1. TABELA DE TEMPLATES DE CAMPANHA
-- ============================================

CREATE TABLE IF NOT EXISTS campaign_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    nicho VARCHAR(100),
    objetivo_principal VARCHAR(50) CHECK (objetivo_principal IN ('awareness', 'traffic', 'conversions', 'engagement')),
    categoria VARCHAR(100), -- 'restaurante', 'varejo', 'servicos', etc.
    is_sistema BOOLEAN DEFAULT false, -- Templates pré-definidos do sistema
    criado_por UUID REFERENCES users(id) ON DELETE SET NULL,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE, -- NULL se for template do sistema
    compartilhado BOOLEAN DEFAULT false,

-- Dados do template (JSONB para flexibilidade)
dados_template JSONB NOT NULL DEFAULT '{}'::jsonb,

-- Metadados
uso_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0, -- 0-5
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campaign_templates_nicho ON campaign_templates (nicho);

CREATE INDEX IF NOT EXISTS idx_campaign_templates_objetivo ON campaign_templates (objetivo_principal);

CREATE INDEX IF NOT EXISTS idx_campaign_templates_categoria ON campaign_templates (categoria);

CREATE INDEX IF NOT EXISTS idx_campaign_templates_sistema ON campaign_templates (is_sistema)
WHERE
    is_sistema = true;

CREATE INDEX IF NOT EXISTS idx_campaign_templates_empresa ON campaign_templates (empresa_id)
WHERE
    empresa_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_templates_compartilhado ON campaign_templates (compartilhado)
WHERE
    compartilhado = true;

-- ============================================
-- 2. TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_campaign_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_campaign_templates_updated_at ON campaign_templates;

CREATE TRIGGER trigger_update_campaign_templates_updated_at
    BEFORE UPDATE ON campaign_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_templates_updated_at();

-- ============================================
-- 3. RLS POLICIES
-- ============================================

ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos podem ver templates do sistema e compartilhados
DROP POLICY IF EXISTS "Todos podem ver templates do sistema e compartilhados" ON campaign_templates;

CREATE POLICY "Todos podem ver templates do sistema e compartilhados" ON campaign_templates FOR
SELECT TO authenticated USING (
        is_sistema = true
        OR compartilhado = true
        OR empresa_id = auth.uid ()
    );

-- INSERT: Empresas podem criar templates próprios
DROP POLICY IF EXISTS "Empresas podem criar templates" ON campaign_templates;

CREATE POLICY "Empresas podem criar templates" ON campaign_templates FOR
INSERT
    TO authenticated
WITH
    CHECK (
        empresa_id = auth.uid ()
        AND is_sistema = false
    );

-- UPDATE: Empresas podem atualizar seus próprios templates
DROP POLICY IF EXISTS "Empresas podem atualizar templates próprios" ON campaign_templates;

CREATE POLICY "Empresas podem atualizar templates próprios" ON campaign_templates FOR
UPDATE TO authenticated USING (
    empresa_id = auth.uid ()
    AND is_sistema = false
)
WITH
    CHECK (
        empresa_id = auth.uid ()
        AND is_sistema = false
    );

-- DELETE: Empresas podem deletar seus próprios templates
DROP POLICY IF EXISTS "Empresas podem deletar templates próprios" ON campaign_templates;

CREATE POLICY "Empresas podem deletar templates próprios" ON campaign_templates FOR DELETE TO authenticated USING (
    empresa_id = auth.uid ()
    AND is_sistema = false
);

-- ============================================
-- 4. FUNÇÕES SQL
-- ============================================

-- Criar template de campanha
DROP FUNCTION IF EXISTS create_campaign_template(VARCHAR, TEXT, VARCHAR, VARCHAR, VARCHAR, JSONB, BOOLEAN);

CREATE OR REPLACE FUNCTION create_campaign_template(
    p_nome VARCHAR(255),
    p_descricao TEXT DEFAULT NULL,
    p_nicho VARCHAR(100) DEFAULT NULL,
    p_objetivo_principal VARCHAR(50) DEFAULT NULL,
    p_categoria VARCHAR(100) DEFAULT NULL,
    p_dados_template JSONB DEFAULT '{}'::jsonb,
    p_compartilhado BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
    v_template_id UUID;
BEGIN
    v_empresa_id := auth.uid();
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    INSERT INTO campaign_templates (
        nome,
        descricao,
        nicho,
        objetivo_principal,
        categoria,
        dados_template,
        empresa_id,
        compartilhado,
        criado_por
    )
    VALUES (
        p_nome,
        p_descricao,
        p_nicho,
        p_objetivo_principal,
        p_categoria,
        p_dados_template,
        v_empresa_id,
        p_compartilhado,
        v_empresa_id
    )
    RETURNING id INTO v_template_id;
    
    RETURN v_template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_campaign_template TO authenticated;

-- Listar templates disponíveis
DROP FUNCTION IF EXISTS list_campaign_templates (
    VARCHAR,
    VARCHAR,
    VARCHAR,
    BOOLEAN,
    BOOLEAN
);

CREATE OR REPLACE FUNCTION list_campaign_templates(
    p_nicho VARCHAR(100) DEFAULT NULL,
    p_objetivo VARCHAR(50) DEFAULT NULL,
    p_categoria VARCHAR(100) DEFAULT NULL,
    p_include_sistema BOOLEAN DEFAULT true,
    p_include_shared BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    descricao TEXT,
    nicho VARCHAR(100),
    objetivo_principal VARCHAR(50),
    categoria VARCHAR(100),
    is_sistema BOOLEAN,
    compartilhado BOOLEAN,
    dados_template JSONB,
    uso_count INTEGER,
    rating DECIMAL(3,2),
    criado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    v_empresa_id := auth.uid();
    
    RETURN QUERY
    SELECT
        ct.id,
        ct.nome,
        ct.descricao,
        ct.nicho,
        ct.objetivo_principal,
        ct.categoria,
        ct.is_sistema,
        ct.compartilhado,
        ct.dados_template,
        ct.uso_count,
        ct.rating,
        ct.criado_em
    FROM campaign_templates ct
    WHERE (
        (p_include_sistema = true AND ct.is_sistema = true) OR
        (p_include_shared = true AND ct.compartilhado = true) OR
        ct.empresa_id = v_empresa_id
    )
    AND (p_nicho IS NULL OR ct.nicho = p_nicho)
    AND (p_objetivo IS NULL OR ct.objetivo_principal = p_objetivo)
    AND (p_categoria IS NULL OR ct.categoria = p_categoria)
    ORDER BY ct.is_sistema DESC, ct.rating DESC, ct.uso_count DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION list_campaign_templates TO authenticated;

-- Incrementar uso de template
DROP FUNCTION IF EXISTS increment_template_usage (UUID);

CREATE OR REPLACE FUNCTION increment_template_usage(
    p_template_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    UPDATE campaign_templates
    SET uso_count = uso_count + 1
    WHERE id = p_template_id;
    
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_template_usage TO authenticated;

-- Buscar template completo por ID
DROP FUNCTION IF EXISTS get_campaign_template (UUID);

CREATE OR REPLACE FUNCTION get_campaign_template(
    p_template_id UUID
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    descricao TEXT,
    nicho VARCHAR(100),
    objetivo_principal VARCHAR(50),
    categoria VARCHAR(100),
    is_sistema BOOLEAN,
    compartilhado BOOLEAN,
    dados_template JSONB,
    uso_count INTEGER,
    rating DECIMAL(3,2),
    criado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    v_empresa_id := auth.uid();
    
    RETURN QUERY
    SELECT
        ct.id,
        ct.nome,
        ct.descricao,
        ct.nicho,
        ct.objetivo_principal,
        ct.categoria,
        ct.is_sistema,
        ct.compartilhado,
        ct.dados_template,
        ct.uso_count,
        ct.rating,
        ct.criado_em
    FROM campaign_templates ct
    WHERE ct.id = p_template_id
    AND (
        ct.is_sistema = true OR
        ct.compartilhado = true OR
        ct.empresa_id = v_empresa_id
    )
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_campaign_template TO authenticated;

COMMENT ON
TABLE campaign_templates IS 'Templates de campanha completos para reutilização';

COMMENT ON FUNCTION create_campaign_template IS 'Cria um novo template de campanha';

COMMENT ON FUNCTION list_campaign_templates IS 'Lista templates disponíveis com filtros';

COMMENT ON FUNCTION increment_template_usage IS 'Incrementa contador de uso de um template';

COMMENT ON FUNCTION get_campaign_template IS 'Busca um template completo por ID';