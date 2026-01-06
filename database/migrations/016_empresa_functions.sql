-- ============================================
-- SISTEMA EMPRESA - FUNÇÕES SQL E RLS
-- Migração 016: Funções e políticas RLS para empresas gerenciarem campanhas
-- Data: 2024
-- ============================================

-- ============================================
-- 1. FUNÇÕES SQL PARA CAMPANHAS
-- ============================================

-- ============================================
-- 1.1. CRIAR CAMPANHA (EMPRESA)
-- ============================================

CREATE OR REPLACE FUNCTION create_campanha_empresa(
    p_titulo VARCHAR(255),
    p_descricao TEXT,
    p_orcamento DECIMAL(10,2),
    p_data_inicio DATE,
    p_data_fim DATE
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
    
    -- Criar campanha
    INSERT INTO campanhas (
        empresa_id,
        titulo,
        descricao,
        orcamento,
        data_inicio,
        data_fim,
        status,
        criado_em
    )
    VALUES (
        v_empresa_id,
        p_titulo,
        p_descricao,
        p_orcamento,
        p_data_inicio,
        p_data_fim,
        'em_analise',
        NOW()
    )
    RETURNING id INTO v_campanha_id;
    
    RETURN v_campanha_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar campanha: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION create_campanha_empresa TO authenticated;

-- ============================================
-- 1.2. ATUALIZAR CAMPANHA (EMPRESA)
-- ============================================

CREATE OR REPLACE FUNCTION update_campanha_empresa(
    p_campanha_id UUID,
    p_titulo VARCHAR(255),
    p_descricao TEXT,
    p_orcamento DECIMAL(10,2),
    p_data_inicio DATE,
    p_data_fim DATE
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
    
    -- Verificar se a campanha existe e pertence à empresa
    SELECT status INTO v_campanha_status
    FROM campanhas
    WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
    
    IF v_campanha_status IS NULL THEN
        RAISE EXCEPTION 'Campanha não encontrada ou você não tem permissão para editá-la';
    END IF;
    
    -- Verificar se pode ser editada (apenas em_analise ou reprovada)
    IF v_campanha_status NOT IN ('em_analise', 'reprovada') THEN
        RAISE EXCEPTION 'Campanha não pode ser editada no status atual (%)', v_campanha_status;
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
    
    -- Atualizar campanha
    UPDATE campanhas
    SET
        titulo = p_titulo,
        descricao = p_descricao,
        orcamento = p_orcamento,
        data_inicio = p_data_inicio,
        data_fim = p_data_fim,
        atualizado_em = NOW()
    WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Erro ao atualizar campanha';
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao atualizar campanha: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION update_campanha_empresa TO authenticated;

-- ============================================
-- 1.3. PAUSAR/ATIVAR CAMPANHA (EMPRESA)
-- ============================================

CREATE OR REPLACE FUNCTION toggle_campanha_empresa(
    p_campanha_id UUID,
    p_action VARCHAR(20) -- 'pause' ou 'activate'
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
    
    -- Verificar se a campanha existe e pertence à empresa
    SELECT status INTO v_campanha_status
    FROM campanhas
    WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
    
    IF v_campanha_status IS NULL THEN
        RAISE EXCEPTION 'Campanha não encontrada ou você não tem permissão para editá-la';
    END IF;
    
    -- Validar ação
    IF p_action = 'pause' THEN
        -- Pausar: apenas se status = 'ativa'
        IF v_campanha_status != 'ativa' THEN
            RAISE EXCEPTION 'Apenas campanhas ativas podem ser pausadas';
        END IF;
        
        UPDATE campanhas
        SET status = 'pausada', atualizado_em = NOW()
        WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
        
    ELSIF p_action = 'activate' THEN
        -- Ativar: apenas se status = 'pausada' e aprovada
        IF v_campanha_status != 'pausada' THEN
            RAISE EXCEPTION 'Apenas campanhas pausadas podem ser ativadas';
        END IF;
        
        -- Verificar se foi aprovada
        IF NOT EXISTS (
            SELECT 1 FROM campanhas
            WHERE id = p_campanha_id
            AND aprovado_por IS NOT NULL
            AND aprovado_em IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Campanha precisa ser aprovada antes de ser ativada';
        END IF;
        
        UPDATE campanhas
        SET status = 'ativa', atualizado_em = NOW()
        WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
        
    ELSE
        RAISE EXCEPTION 'Ação inválida. Use "pause" ou "activate"';
    END IF;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Erro ao alterar status da campanha';
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao alterar status da campanha: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_campanha_empresa TO authenticated;

-- ============================================
-- 2. FUNÇÕES SQL PARA ESTATÍSTICAS
-- ============================================

-- ============================================
-- 2.1. ESTATÍSTICAS DA EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION get_empresa_stats(
    p_empresa_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_campanhas BIGINT,
    campanhas_ativas BIGINT,
    campanhas_pendentes BIGINT,
    total_visualizacoes BIGINT,
    total_gasto DECIMAL(10,2),
    orcamento_total DECIMAL(10,2),
    saldo_disponivel DECIMAL(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    -- Se não fornecido, usar empresa autenticada
    v_empresa_id := COALESCE(p_empresa_id, auth.uid());
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT
        COUNT(*) FILTER (WHERE c.id IS NOT NULL)::BIGINT as total_campanhas,
        COUNT(*) FILTER (WHERE c.status = 'ativa')::BIGINT as campanhas_ativas,
        COUNT(*) FILTER (WHERE c.status IN ('em_analise', 'aprovada'))::BIGINT as campanhas_pendentes,
        COALESCE(SUM(cm.visualizacoes), 0)::BIGINT as total_visualizacoes,
        COALESCE(SUM(c.orcamento_utilizado), 0)::DECIMAL(10,2) as total_gasto,
        COALESCE(SUM(c.orcamento), 0)::DECIMAL(10,2) as orcamento_total,
        COALESCE(SUM(c.orcamento - c.orcamento_utilizado), 0)::DECIMAL(10,2) as saldo_disponivel
    FROM empresas e
    LEFT JOIN campanhas c ON c.empresa_id = e.id
    LEFT JOIN campanha_metricas cm ON cm.campanha_id = c.id
    WHERE e.id = v_empresa_id
    GROUP BY e.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_empresa_stats TO authenticated;

-- ============================================
-- 3. FUNÇÕES SQL PARA PAGAMENTOS
-- ============================================

-- ============================================
-- 3.1. LISTAR PAGAMENTOS DA EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION get_empresa_pagamentos(
    p_empresa_id UUID DEFAULT NULL,
    p_status VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    empresa_id UUID,
    valor DECIMAL(10,2),
    metodo_pagamento VARCHAR(50),
    status VARCHAR(50),
    criado_em TIMESTAMP WITH TIME ZONE,
    processado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    -- Se não fornecido, usar empresa autenticada
    v_empresa_id := COALESCE(p_empresa_id, auth.uid());
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT
        p.id,
        p.empresa_id,
        p.valor,
        p.metodo_pagamento,
        p.status,
        p.criado_em,
        p.processado_em
    FROM pagamentos p
    WHERE p.empresa_id = v_empresa_id
    AND (p_status IS NULL OR p.status = p_status)
    ORDER BY p.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_empresa_pagamentos TO authenticated;

-- ============================================
-- 4. RLS POLICIES ADICIONAIS
-- ============================================

-- ============================================
-- 4.1. INSERT CAMPANHAS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem criar campanhas" ON campanhas;

CREATE POLICY "Empresas podem criar campanhas" ON campanhas
FOR INSERT TO authenticated
WITH CHECK (empresa_id = auth.uid());

-- ============================================
-- 4.2. UPDATE CAMPANHAS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem atualizar campanhas próprias" ON campanhas;

CREATE POLICY "Empresas podem atualizar campanhas próprias" ON campanhas
FOR UPDATE TO authenticated
USING (empresa_id = auth.uid() AND status IN ('em_analise', 'reprovada'))
WITH CHECK (empresa_id = auth.uid());

-- ============================================
-- 4.3. INSERT MIDIAS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem criar mídias" ON midias;

CREATE POLICY "Empresas podem criar mídias" ON midias
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM campanhas 
        WHERE id = campanha_id AND empresa_id = auth.uid()
    )
);

-- ============================================
-- 4.4. UPDATE MIDIAS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem atualizar mídias" ON midias;

CREATE POLICY "Empresas podem atualizar mídias" ON midias
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM campanhas 
        WHERE id = campanha_id 
        AND empresa_id = auth.uid() 
        AND status IN ('em_analise', 'reprovada')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM campanhas 
        WHERE id = campanha_id 
        AND empresa_id = auth.uid()
    )
);

-- ============================================
-- 4.5. DELETE MIDIAS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem deletar mídias" ON midias;

CREATE POLICY "Empresas podem deletar mídias" ON midias
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM campanhas 
        WHERE id = campanha_id 
        AND empresa_id = auth.uid() 
        AND status IN ('em_analise', 'reprovada')
    )
);

-- ============================================
-- 4.6. SELECT PAGAMENTOS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem ver seus pagamentos" ON pagamentos;

CREATE POLICY "Empresas podem ver seus pagamentos" ON pagamentos
FOR SELECT TO authenticated
USING (empresa_id = auth.uid());

-- ============================================
-- 4.7. INSERT PAGAMENTOS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem criar pagamentos" ON pagamentos;

CREATE POLICY "Empresas podem criar pagamentos" ON pagamentos
FOR INSERT TO authenticated
WITH CHECK (empresa_id = auth.uid());

-- ============================================
-- 4.8. INSERT TICKETS
-- ============================================

DROP POLICY IF EXISTS "Empresas podem criar tickets" ON tickets;

CREATE POLICY "Empresas podem criar tickets" ON tickets
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM empresas
        WHERE id = auth.uid()
    )
    AND (
        empresa_id = auth.uid() OR empresa_id IS NULL
    )
);

-- ============================================
-- 5. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION create_campanha_empresa IS 'Cria uma campanha para a empresa autenticada com validações de datas e orçamento';
COMMENT ON FUNCTION update_campanha_empresa IS 'Atualiza uma campanha da empresa autenticada, apenas se status permitir edição';
COMMENT ON FUNCTION toggle_campanha_empresa IS 'Pausa ou ativa uma campanha da empresa autenticada';
COMMENT ON FUNCTION get_empresa_stats IS 'Retorna estatísticas agregadas da empresa (campanhas, visualizações, gastos, saldo)';
COMMENT ON FUNCTION get_empresa_pagamentos IS 'Lista pagamentos da empresa autenticada com filtro opcional de status';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

