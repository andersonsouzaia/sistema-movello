-- ============================================
-- ADD DELETE CAMPANHA FUNCTION
-- Migração 050: Adiciona função para deletar campanhas (segura)
-- Data: 2026-01-19
-- ============================================

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
    -- Campanhas ativas/pausadas/concluídas devem ser mantidas para histórico (ou soft-deleted, 
    -- mas por enquanto vamos restringir a deleção).
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
