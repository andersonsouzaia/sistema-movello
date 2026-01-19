-- ============================================
-- SQL: Histórico Financeiro Unificado para Admin
-- ============================================

CREATE OR REPLACE FUNCTION get_admin_financial_history(
    p_status VARCHAR(50) DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    empresa_id UUID,
    empresa_nome TEXT,
    valor DECIMAL(10,2),
    status VARCHAR(50),
    tipo VARCHAR(50),
    descricao TEXT,
    metodo_pagamento TEXT,
    criado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        COALESCE(t.origem_id, t.destino_id) as empresa_id,
        e.razao_social as empresa_nome,
        t.valor,
        CASE 
            WHEN t.status = 'concluida' THEN 'pago'
            ELSE t.status
        END as status,
        t.tipo::VARCHAR(50),
        t.descricao,
        CASE 
            WHEN t.tipo = 'ajuste' THEN 'Ajuste Admin'
            WHEN t.referencia_pagamento IS NOT NULL THEN (SELECT p.metodo_pagamento FROM pagamentos p WHERE p.id = t.referencia_pagamento)
            ELSE 'Diverso'
        END as metodo_pagamento,
        t.criado_em
    FROM transacoes t
    LEFT JOIN empresas e ON e.id = COALESCE(t.origem_id, t.destino_id)
    WHERE (t.tipo = 'pagamento' OR t.tipo = 'ajuste')
      AND (p_status IS NULL OR t.status = p_status OR (p_status = 'pago' AND t.status = 'concluida'))
      AND (
          p_search IS NULL 
          OR e.razao_social ILIKE '%' || p_search || '%' 
          OR t.descricao ILIKE '%' || p_search || '%'
          OR t.id::TEXT ILIKE '%' || p_search || '%'
      )
    ORDER BY t.criado_em DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_financial_history TO authenticated;
