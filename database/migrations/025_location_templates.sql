-- ============================================
-- TEMPLATES DE LOCALIZAÇÃO
-- Migração 025: Sistema de templates de localização reutilizáveis
-- Data: 2024
-- ============================================

-- ============================================
-- 1. TABELA DE TEMPLATES DE LOCALIZAÇÃO
-- ============================================

CREATE TABLE IF NOT EXISTS location_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    localizacao_tipo VARCHAR(50) NOT NULL CHECK (localizacao_tipo IN ('raio', 'poligono', 'cidade', 'estado')),
    raio_km DECIMAL(10,2),
    centro_latitude DECIMAL(10,8),
    centro_longitude DECIMAL(11,8),
    poligono_coordenadas JSONB,
    cidades TEXT[],
    estados TEXT[],
    is_favorito BOOLEAN DEFAULT false,
    compartilhado BOOLEAN DEFAULT false, -- Se true, outros usuários da empresa podem usar
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_por UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_location_templates_empresa ON location_templates (empresa_id);

CREATE INDEX IF NOT EXISTS idx_location_templates_favorito ON location_templates (empresa_id, is_favorito)
WHERE
    is_favorito = true;

CREATE INDEX IF NOT EXISTS idx_location_templates_compartilhado ON location_templates (empresa_id, compartilhado)
WHERE
    compartilhado = true;

-- ============================================
-- 2. TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_location_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_location_templates_updated_at ON location_templates;

CREATE TRIGGER trigger_update_location_templates_updated_at
    BEFORE UPDATE ON location_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_location_templates_updated_at();

-- ============================================
-- 3. RLS POLICIES
-- ============================================

ALTER TABLE location_templates ENABLE ROW LEVEL SECURITY;

-- SELECT: Empresas podem ver seus próprios templates e templates compartilhados
CREATE POLICY "Empresas podem ver seus templates" ON location_templates FOR
SELECT TO authenticated USING (
        empresa_id = auth.uid ()
        OR (
            compartilhado = true
            AND empresa_id IN (
                SELECT id
                FROM empresas
                WHERE
                    id = auth.uid ()
            )
        )
    );

-- INSERT: Empresas podem criar templates próprios
CREATE POLICY "Empresas podem criar templates" ON location_templates FOR
INSERT
    TO authenticated
WITH
    CHECK (empresa_id = auth.uid ());

-- UPDATE: Empresas podem atualizar seus próprios templates
CREATE POLICY "Empresas podem atualizar templates próprios" ON location_templates FOR
UPDATE TO authenticated USING (empresa_id = auth.uid ())
WITH
    CHECK (empresa_id = auth.uid ());

-- DELETE: Empresas podem deletar seus próprios templates
CREATE POLICY "Empresas podem deletar templates próprios" ON location_templates FOR DELETE TO authenticated USING (empresa_id = auth.uid ());

-- ============================================
-- 4. FUNÇÕES SQL
-- ============================================

-- Criar template de localização
CREATE OR REPLACE FUNCTION create_location_template(
    p_nome VARCHAR(255),
    p_localizacao_tipo VARCHAR(50),
    p_descricao TEXT DEFAULT NULL,
    p_raio_km DECIMAL(10,2) DEFAULT NULL,
    p_centro_latitude DECIMAL(10,8) DEFAULT NULL,
    p_centro_longitude DECIMAL(11,8) DEFAULT NULL,
    p_poligono_coordenadas JSONB DEFAULT NULL,
    p_cidades TEXT[] DEFAULT NULL,
    p_estados TEXT[] DEFAULT NULL,
    p_is_favorito BOOLEAN DEFAULT false,
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
    
    INSERT INTO location_templates (
        empresa_id,
        nome,
        descricao,
        localizacao_tipo,
        raio_km,
        centro_latitude,
        centro_longitude,
        poligono_coordenadas,
        cidades,
        estados,
        is_favorito,
        compartilhado,
        criado_por
    )
    VALUES (
        v_empresa_id,
        p_nome,
        p_descricao,
        p_localizacao_tipo,
        p_raio_km,
        p_centro_latitude,
        p_centro_longitude,
        p_poligono_coordenadas,
        p_cidades,
        p_estados,
        p_is_favorito,
        p_compartilhado,
        v_empresa_id
    )
    RETURNING id INTO v_template_id;
    
    RETURN v_template_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_location_template TO authenticated;

-- Listar templates da empresa
CREATE OR REPLACE FUNCTION list_location_templates(
    p_include_shared BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    descricao TEXT,
    localizacao_tipo VARCHAR(50),
    raio_km DECIMAL(10,2),
    centro_latitude DECIMAL(10,8),
    centro_longitude DECIMAL(11,8),
    poligono_coordenadas JSONB,
    cidades TEXT[],
    estados TEXT[],
    is_favorito BOOLEAN,
    compartilhado BOOLEAN,
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
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT
        lt.id,
        lt.nome,
        lt.descricao,
        lt.localizacao_tipo,
        lt.raio_km,
        lt.centro_latitude,
        lt.centro_longitude,
        lt.poligono_coordenadas,
        lt.cidades,
        lt.estados,
        lt.is_favorito,
        lt.compartilhado,
        lt.criado_em
    FROM location_templates lt
    WHERE lt.empresa_id = v_empresa_id
       OR (p_include_shared = true AND lt.compartilhado = true AND lt.empresa_id IN (
           SELECT id FROM empresas WHERE id = v_empresa_id
       ))
    ORDER BY lt.is_favorito DESC, lt.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION list_location_templates TO authenticated;

-- Toggle favorito
CREATE OR REPLACE FUNCTION toggle_template_favorite(
    p_template_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    v_empresa_id := auth.uid();
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    UPDATE location_templates
    SET is_favorito = NOT is_favorito
    WHERE id = p_template_id AND empresa_id = v_empresa_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template não encontrado ou você não tem permissão';
    END IF;
    
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_template_favorite TO authenticated;

COMMENT ON
TABLE location_templates IS 'Templates de localização reutilizáveis para campanhas';

COMMENT ON FUNCTION create_location_template IS 'Cria um novo template de localização para a empresa autenticada';

COMMENT ON FUNCTION list_location_templates IS 'Lista templates de localização da empresa, incluindo compartilhados se solicitado';

COMMENT ON FUNCTION toggle_template_favorite IS 'Alterna o status de favorito de um template';
