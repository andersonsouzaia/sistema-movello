-- ============================================
-- FIX TEMPLATE RPC E COLUNAS CAMPANHA
-- Migração 037: Resolve erro create_location_template e coluna 'nome'
-- ============================================

DO $$
BEGIN
    -- 1. Resolver problema da coluna 'nome' em campanhas
    -- O erro 'null value in column "nome" of relation "campanhas"' indica que existe uma coluna 'nome' NOT NULL.
    -- Vamos torna-la NULLABLE pois usamos 'titulo'.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'nome'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN nome DROP NOT NULL;
    END IF;

    -- 2. Garantir tabela location_templates
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'location_templates') THEN
       CREATE TABLE location_templates (
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
            compartilhado BOOLEAN DEFAULT false,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            criado_por UUID REFERENCES users(id) ON DELETE SET NULL
        );
        -- Indices
        CREATE INDEX IF NOT EXISTS idx_location_templates_empresa ON location_templates (empresa_id);
    END IF;

END $$;

-- 3. Recriar create_location_template para garantir existência no schema cache
-- Obs: Usamos parametro DEFAULT NULL para torná-la mais flexivel
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
