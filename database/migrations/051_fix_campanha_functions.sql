-- ============================================
-- FIX CAMPANHA FUNCTIONS
-- Migração 051: Corrige deleção e previne duplicação
-- Data: 2026-01-28
-- ============================================

-- 1. DEFINE DELETE_CAMPANHA_EMPRESA (Ensures existence)
CREATE OR REPLACE FUNCTION delete_campanha_empresa(p_campanha_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
    v_status VARCHAR(50);
BEGIN
    -- 1. Identificar empresa
    v_empresa_id := auth.uid();
    IF v_empresa_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

    -- 2. Verificar se campanha existe e pertence à empresa
    SELECT status INTO v_status 
    FROM campanhas 
    WHERE id = p_campanha_id AND empresa_id = v_empresa_id;

    IF v_status IS NULL THEN 
        RAISE EXCEPTION 'Campanha não encontrada ou não pertence a esta empresa'; 
    END IF;

    -- 3. Validar se pode deletar
    -- Regra: Apenas rascunhos, em análise ou reprovados podem ser deletados completamente.
    IF v_status NOT IN ('rascunho', 'em_analise', 'reprovada') THEN
        RAISE EXCEPTION 'Apenas campanhas em rascunho, análise ou reprovadas podem ser excluídas.';
    END IF;

    -- 4. Deletar (Cascata deve cuidar das mídias se configurada, senão deletamos manual)
    DELETE FROM midias WHERE campanha_id = p_campanha_id; -- Garantir limpeza
    DELETE FROM campanhas WHERE id = p_campanha_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_campanha_empresa TO authenticated;

-- 2. UPDATE CREATE_CAMPANHA_EMPRESA (Adds duplication check)
CREATE OR REPLACE FUNCTION create_campanha_empresa(
    p_titulo VARCHAR(255),
    p_descricao TEXT,
    p_orcamento DECIMAL(10,2),
    p_data_inicio DATE,
    p_data_fim DATE,
    -- Parâmetros adicionais de Segmentação e Objetivos
    p_nicho TEXT DEFAULT NULL,
    p_categorias TEXT[] DEFAULT NULL,
    p_localizacao_tipo TEXT DEFAULT NULL,
    p_raio_km DECIMAL DEFAULT NULL,
    p_centro_latitude DECIMAL DEFAULT NULL,
    p_centro_longitude DECIMAL DEFAULT NULL,
    p_poligono_coordenadas JSONB DEFAULT NULL,
    p_cidades TEXT[] DEFAULT NULL,
    p_estados TEXT[] DEFAULT NULL,
    p_regioes TEXT[] DEFAULT NULL,
    p_publico_alvo JSONB DEFAULT NULL,
    p_horarios_exibicao JSONB DEFAULT NULL,
    p_dias_semana INTEGER[] DEFAULT NULL,
    p_objetivo_principal TEXT DEFAULT NULL,
    p_objetivos_secundarios TEXT[] DEFAULT NULL,
    p_kpis_meta JSONB DEFAULT NULL,
    p_estrategia TEXT DEFAULT NULL,
    -- Novos Parâmetros de Mídia
    p_midias_urls JSONB DEFAULT NULL,
    p_qr_code_link TEXT DEFAULT NULL
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
    SELECT tipo INTO v_user_tipo FROM users WHERE id = v_empresa_id;
    
    IF v_user_tipo != 'empresa' THEN
        RAISE EXCEPTION 'Usuário não é uma empresa';
    END IF;

    -- =================================================================
    -- ANTI-DUPLICATION CHECK
    -- Impede criação se uma campanha com MESMO título foi criada há menos de 1 minuto
    IF EXISTS (
        SELECT 1 FROM campanhas 
        WHERE empresa_id = v_empresa_id 
        AND titulo = p_titulo
        AND criado_em > (NOW() - INTERVAL '1 minute')
    ) THEN
        RAISE EXCEPTION 'Uma campanha com este título foi criada recentemente. Evite cliques duplos.';
    END IF;
    -- =================================================================
    
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
    
    -- Criar campanha
    INSERT INTO campanhas (
        empresa_id, titulo, descricao, orcamento, data_inicio, data_fim, status, criado_em,
        -- Novos campos
        nicho, categorias,
        localizacao_tipo, raio_km, centro_latitude, centro_longitude, poligono_coordenadas, cidades, estados, regioes,
        publico_alvo, horarios_exibicao, dias_semana,
        objetivo_principal, objetivos_secundarios, kpis_meta, estrategia,
        midias_urls, qr_code_link
    )
    VALUES (
        v_empresa_id, p_titulo, p_descricao, p_orcamento, p_data_inicio, p_data_fim, 'em_analise', NOW(),
        p_nicho, p_categorias,
        p_localizacao_tipo, p_raio_km, p_centro_latitude, p_centro_longitude, p_poligono_coordenadas, p_cidades, p_estados, p_regioes,
        p_publico_alvo, p_horarios_exibicao, p_dias_semana,
        p_objetivo_principal, p_objetivos_secundarios, p_kpis_meta, p_estrategia,
        p_midias_urls, p_qr_code_link
    )
    RETURNING id INTO v_campanha_id;
    
    -- Sincronizar Mídias (INSERT na tabela midias)
    IF p_midias_urls IS NOT NULL AND jsonb_array_length(p_midias_urls) > 0 THEN
        INSERT INTO midias (campanha_id, url, tipo, status, created_at)
        SELECT 
            v_campanha_id,
            value::text, 
            CASE 
                WHEN value::text ILIKE '%.mp4' OR value::text ILIKE '%.webm' OR value::text ILIKE '%.mov' THEN 'video' 
                ELSE 'imagem' 
            END,
            'em_analise',
            NOW()
        FROM jsonb_array_elements_text(p_midias_urls);
    END IF;
    
    RETURN v_campanha_id;
END;
$$;
