-- ============================================
-- UPDATE CAMPANHA RPC - GEOLOCALIZACAO E NICHO
-- Migração 034: Atualiza create_campanha_empresa para aceitar parâmetros de segmentação
-- ============================================

-- 1. ATUALIZAR create_campanha_empresa
-- Adiciona parâmetros de Nicho, Categorias, Geolocalização e Objetivos
CREATE OR REPLACE FUNCTION create_campanha_empresa(
    p_titulo VARCHAR(255),
    p_descricao TEXT,
    p_orcamento DECIMAL(10,2),
    p_data_inicio DATE,
    p_data_fim DATE,
    -- Segmentação: Nicho
    p_nicho VARCHAR(50),
    p_categorias TEXT[],
    -- Segmentação: Localização
    p_localizacao_tipo VARCHAR(20), -- 'raio', 'poligono', 'cidade', 'estado', 'regiao'
    p_raio_km DECIMAL(10,1) DEFAULT NULL,
    p_centro_latitude DECIMAL(10,8) DEFAULT NULL,
    p_centro_longitude DECIMAL(11,8) DEFAULT NULL,
    p_poligono_coordenadas JSONB DEFAULT NULL,
    p_cidades TEXT[] DEFAULT NULL,
    p_estados TEXT[] DEFAULT NULL,
    p_regioes TEXT[] DEFAULT NULL,
    -- Segmentação: Público Alvo
    p_publico_alvo JSONB DEFAULT NULL,
    p_horarios_exibicao JSONB DEFAULT NULL,
    p_dias_semana INTEGER[] DEFAULT NULL,
    -- Objetivos
    p_objetivo_principal VARCHAR(50) DEFAULT NULL,
    p_objetivos_secundarios TEXT[] DEFAULT NULL,
    p_kpis_meta JSONB DEFAULT NULL,
    p_estrategia VARCHAR(100) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
    v_campanha_id UUID;
    v_user_tipo TEXT;
BEGIN
    -- Obter ID da empresa autenticada
    v_empresa_id := auth.uid();
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    -- Verificar se o usuário é uma empresa
    SELECT tipo INTO v_user_tipo
    FROM users
    WHERE id = v_empresa_id;
    
    IF v_user_tipo != 'empresa' THEN
        RAISE EXCEPTION 'Usuário não é uma empresa';
    END IF;
    
    -- Validar datas
    IF p_data_inicio < CURRENT_DATE THEN
        RAISE EXCEPTION 'Data de início deve ser maior ou igual à data atual';
    END IF;
    
    IF p_data_fim <= p_data_inicio THEN
        RAISE EXCEPTION 'Data de fim deve ser maior que a data de início';
    END IF;
    
    -- Validar orçamento mínimo
    IF p_orcamento < 100.00 THEN
        RAISE EXCEPTION 'Orçamento mínimo é R$ 100,00';
    END IF;

    -- Validar Nicho e Categorias
    IF p_nicho IS NULL OR length(p_nicho) < 3 THEN
        RAISE EXCEPTION 'Nicho é obrigatório';
    END IF;

    IF p_categorias IS NULL OR array_length(p_categorias, 1) < 1 THEN
        RAISE EXCEPTION 'Selecione pelo menos uma categoria';
    END IF;

    -- Validar Localização
    IF p_localizacao_tipo IS NULL THEN
        RAISE EXCEPTION 'Tipo de localização é obrigatório';
    END IF;

    IF p_localizacao_tipo = 'raio' THEN
        IF p_raio_km IS NULL OR p_centro_latitude IS NULL OR p_centro_longitude IS NULL THEN
            RAISE EXCEPTION 'Para localização por raio, informe raio, latitude e longitude';
        END IF;
    ELSIF p_localizacao_tipo = 'poligono' THEN
        IF p_poligono_coordenadas IS NULL THEN
            RAISE EXCEPTION 'Para localização por polígono, informe as coordenadas';
        END IF;
    ELSIF p_localizacao_tipo = 'cidade' THEN
        IF (p_cidades IS NULL OR array_length(p_cidades, 1) < 1) THEN
             RAISE EXCEPTION 'Para localização por cidade, informe pelo menos uma cidade';
        END IF;
    END IF;
    
    -- Criar campanha com todos os campos
    INSERT INTO campanhas (
        empresa_id,
        titulo,
        descricao,
        orcamento,
        data_inicio,
        data_fim,
        status,
        criado_em,
        -- Campos de segmentação
        nicho,
        categorias,
        localizacao_tipo,
        raio_km,
        centro_latitude,
        centro_longitude,
        poligono_coordenadas,
        cidades,
        estados,
        regioes,
        publico_alvo,
        horarios_exibicao,
        dias_semana,
        objetivo_principal,
        objetivos_secundarios,
        kpis_meta,
        estrategia
    )
    VALUES (
        v_empresa_id,
        p_titulo,
        p_descricao,
        p_orcamento,
        p_data_inicio,
        p_data_fim,
        'em_analise',
        NOW(),
        -- Valores de segmentação
        p_nicho,
        p_categorias,
        p_localizacao_tipo,
        p_raio_km,
        p_centro_latitude,
        p_centro_longitude,
        p_poligono_coordenadas,
        p_cidades,
        p_estados,
        p_regioes,
        p_publico_alvo,
        p_horarios_exibicao,
        p_dias_semana,
        p_objetivo_principal,
        p_objetivos_secundarios,
        p_kpis_meta,
        p_estrategia
    )
    RETURNING id INTO v_campanha_id;
    
    RETURN v_campanha_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar campanha: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION create_campanha_empresa TO authenticated;
