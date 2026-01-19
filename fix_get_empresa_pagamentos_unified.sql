-- ============================================
-- SQL: Unificar Histórico Financeiro da Empresa
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
    processado_em TIMESTAMP WITH TIME ZONE,
    descricao TEXT,
    tipo VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    -- Identificar Empresa
    v_empresa_id := COALESCE(p_empresa_id, auth.uid());
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    RETURN QUERY
    SELECT
        t.id,
        v_empresa_id as empresa_id,
        t.valor,
        CASE 
            WHEN t.tipo = 'ajuste' THEN 'Ajuste Admin'
            WHEN t.referencia_pagamento IS NOT NULL THEN (SELECT p.metodo_pagamento FROM pagamentos p WHERE p.id = t.referencia_pagamento)
            ELSE 'Diverso'
        END as metodo_pagamento,
        CASE 
            WHEN t.status = 'concluida' THEN 'pago'
            ELSE t.status
        END as status,
        t.criado_em,
        CASE 
            WHEN t.status = 'concluida' THEN t.criado_em 
            ELSE NULL 
        END as processado_em,
        t.descricao,
        t.tipo
    FROM transacoes t
    WHERE (t.origem_id = v_empresa_id OR t.destino_id = v_empresa_id)
    AND (
        p_status IS NULL 
        OR (p_status = 'pago' AND t.status = 'concluida')
        OR t.status = p_status
    )
    ORDER BY t.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_empresa_pagamentos TO authenticated;
