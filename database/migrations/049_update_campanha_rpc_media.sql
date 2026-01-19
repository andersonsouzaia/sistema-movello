-- ============================================
-- UPDATE CAMPANHA RPCs PARA MÍDIAS E QR CODE
-- Migração 049: Atualiza create/update_campanha_empresa para aceitar mídias e syncar tabela midias
-- Data: 2026-01-19
-- ============================================

-- 1. DROP funções antigas (Limpeza agressiva de todas as sobrecargas)
DO $$
DECLARE 
    func_record RECORD;
BEGIN
    -- Drop create_campanha_empresa
    FOR func_record IN 
        SELECT oid::regprocedure::text as sig 
        FROM pg_proc 
        WHERE proname = 'create_campanha_empresa'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.sig;
    END LOOP;

    -- Drop update_campanha_empresa
    FOR func_record IN 
        SELECT oid::regprocedure::text as sig 
        FROM pg_proc 
        WHERE proname = 'update_campanha_empresa'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.sig;
    END LOOP;
END $$;

-- 2. RECRIA CREATE_CAMPANHA_EMPRESA com novos parâmetros
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

-- 3. RECRIA UPDATE_CAMPANHA_EMPRESA com novos parâmetros
CREATE OR REPLACE FUNCTION update_campanha_empresa(
    p_campanha_id UUID,
    p_titulo VARCHAR(255),
    p_descricao TEXT,
    p_orcamento DECIMAL(10,2),
    p_data_inicio DATE,
    p_data_fim DATE,
    -- Novos Parâmetros Opcionais (para manter compatibilidade se não passados, default NULL)
    p_midias_urls JSONB DEFAULT NULL,
    p_qr_code_link TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
    v_campanha_status VARCHAR(50);
    v_user_tipo TEXT;
BEGIN
    v_empresa_id := auth.uid();
    
    IF v_empresa_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;
    
    SELECT tipo INTO v_user_tipo FROM users WHERE id = v_empresa_id;
    IF v_user_tipo != 'empresa' THEN RAISE EXCEPTION 'Usuário não é uma empresa'; END IF;
    
    SELECT status INTO v_campanha_status FROM campanhas WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
    IF v_campanha_status IS NULL THEN RAISE EXCEPTION 'Campanha não encontrada'; END IF;
    IF v_campanha_status NOT IN ('em_analise', 'reprovada') THEN RAISE EXCEPTION 'Status inválido para edição'; END IF;
    
    IF p_data_inicio < CURRENT_DATE THEN RAISE EXCEPTION 'Data inválida'; END IF;
    IF p_data_fim <= p_data_inicio THEN RAISE EXCEPTION 'Data fim inválida'; END IF;
    IF p_orcamento < 100.00 THEN RAISE EXCEPTION 'Orçamento mínimo R$ 100'; END IF;
    
    -- Atualizar campanha
    UPDATE campanhas
    SET
        titulo = p_titulo,
        descricao = p_descricao,
        orcamento = p_orcamento,
        data_inicio = p_data_inicio,
        data_fim = p_data_fim,
        atualizado_em = NOW(),
        -- Atualiza campos opcionais se fornecidos
        midias_urls = COALESCE(p_midias_urls, midias_urls),
        qr_code_link = COALESCE(p_qr_code_link, qr_code_link)
    WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
    
    -- Sincronizar Mídias (Adicionar novas)
    IF p_midias_urls IS NOT NULL AND jsonb_array_length(p_midias_urls) > 0 THEN
        INSERT INTO midias (campanha_id, url, tipo, status, created_at)
        SELECT 
            p_campanha_id,
            t.url,
            CASE 
                WHEN t.url ILIKE '%.mp4' OR t.url ILIKE '%.webm' OR t.url ILIKE '%.mov' THEN 'video' 
                ELSE 'imagem' 
            END,
            'em_analise',
            NOW()
        FROM jsonb_array_elements_text(p_midias_urls) AS t(url)
        WHERE NOT EXISTS (
            SELECT 1 FROM midias m 
            WHERE m.campanha_id = p_campanha_id 
            AND m.url = t.url
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION create_campanha_empresa TO authenticated;
GRANT EXECUTE ON FUNCTION update_campanha_empresa TO authenticated;
