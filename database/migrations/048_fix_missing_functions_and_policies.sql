-- ============================================
-- FIX: FUNÇÕES E POLÍTICAS FALTANTES
-- Migração 048: Recria função de update e adiciona política de SELECT para mídias
-- Data: 2026-01-19
-- ============================================

-- 1. Recriar função update_campanha_empresa (caso tenha sido perdida)
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

-- 2. Adicionar política de SELECT para mídias (Faltava na migração 016)
DROP POLICY IF EXISTS "Empresas podem ver mídias de suas campanhas" ON midias;

CREATE POLICY "Empresas podem ver mídias de suas campanhas" ON midias
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM campanhas 
        WHERE id = campanha_id 
        AND empresa_id = auth.uid()
    )
);

-- 3. Garantir que RLS está ativo
ALTER TABLE midias ENABLE ROW LEVEL SECURITY;
