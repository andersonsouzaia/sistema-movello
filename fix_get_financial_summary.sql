-- ============================================
-- FIX: get_financial_summary
-- Resolve Erro 400 Bad Request ao aceitar parâmetros como TEXT e converter
-- ============================================

CREATE OR REPLACE FUNCTION get_financial_summary(
    p_data_inicio TEXT DEFAULT NULL,
    p_data_fim TEXT DEFAULT NULL
)
RETURNS TABLE (
    total_receitas DECIMAL,
    total_despesas DECIMAL,
    saldo DECIMAL,
    pagamentos_pendentes INTEGER,
    repasses_pendentes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_total_receitas DECIMAL := 0;
    v_total_despesas DECIMAL := 0;
    v_pagamentos_pendentes INTEGER := 0;
    v_repasses_pendentes INTEGER := 0;
BEGIN
    -- Converter parâmetros de texto para data, usando padrão se nulo
    v_data_inicio := COALESCE(
        CASE WHEN p_data_inicio IS NOT NULL THEN p_data_inicio::DATE ELSE NULL END, 
        CURRENT_DATE - INTERVAL '30 days'
    );
    v_data_fim := COALESCE(
        CASE WHEN p_data_fim IS NOT NULL THEN p_data_fim::DATE ELSE NULL END, 
        CURRENT_DATE
    );

    -- Calcular receitas (pagamentos pagos)
    SELECT COALESCE(SUM(valor_liquido), 0) INTO v_total_receitas
    FROM pagamentos
    WHERE status = 'pago'
    AND DATE(criado_em) BETWEEN v_data_inicio AND v_data_fim;
    
    -- Calcular despesas (repasses pagos)
    SELECT COALESCE(SUM(valor_liquido), 0) INTO v_total_despesas
    FROM repasses
    WHERE status = 'pago'
    AND DATE(criado_em) BETWEEN v_data_inicio AND v_data_fim;
    
    -- Contar pagamentos pendentes
    SELECT COUNT(*) INTO v_pagamentos_pendentes
    FROM pagamentos
    WHERE status IN ('pendente', 'processando');
    
    -- Contar repasses pendentes
    SELECT COUNT(*) INTO v_repasses_pendentes
    FROM repasses
    WHERE status IN ('pendente', 'processando');
    
    RETURN QUERY
    SELECT 
        v_total_receitas as total_receitas,
        v_total_despesas as total_despesas,
        (v_total_receitas - v_total_despesas) as saldo,
        v_pagamentos_pendentes as pagamentos_pendentes,
        v_repasses_pendentes as repasses_pendentes;
END;
$$;

GRANT EXECUTE ON FUNCTION get_financial_summary(TEXT, TEXT) TO authenticated;
