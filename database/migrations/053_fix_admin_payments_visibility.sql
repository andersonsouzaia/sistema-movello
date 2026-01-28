-- ============================================
-- FIX ADMIN PAYMENTS VISIBILITY
-- Migração 053: Corrigir visibilidade de pagamentos e ajustes no painel admin
-- ============================================

-- Drop old functions to avoid return type conflicts
DROP FUNCTION IF EXISTS get_admin_financial_history(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_adjust_balance(UUID, DECIMAL, TEXT, UUID);

-- 1. Garantir que a função get_admin_financial_history retorne todos os dados necessários
CREATE OR REPLACE FUNCTION get_admin_financial_history(
    p_status TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    empresa_id UUID,
    empresa_nome TEXT,
    tipo TEXT,
    descricao TEXT,
    valor DECIMAL,
    status TEXT,
    metodo_pagamento TEXT,
    criado_em TIMESTAMPTZ,
    processado_em TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.empresa_id,
        COALESCE(e.razao_social, u.email) as empresa_nome,
        CASE 
            WHEN p.metodo_pagamento = 'ajuste_manual' THEN 'ajuste'
            ELSE 'pagamento'
        END as tipo,
        COALESCE(p.referencia_externa, 'Pagamento') as descricao,
        p.valor_liquido as valor,
        p.status::TEXT,
        p.metodo_pagamento::TEXT,
        p.criado_em,
        p.processado_em
    FROM pagamentos p
    LEFT JOIN empresas e ON e.id = p.empresa_id
    LEFT JOIN users u ON u.id = p.empresa_id
    WHERE 
        (p_status IS NULL OR p.status = p_status)
        AND (
            p_search IS NULL 
            OR e.razao_social ILIKE '%' || p_search || '%'
            OR u.email ILIKE '%' || p_search || '%'
            OR p.referencia_externa ILIKE '%' || p_search || '%'
            OR p.id::TEXT ILIKE '%' || p_search || '%'
        )
    ORDER BY p.criado_em DESC;
END;
$$;

-- 2. Garantir que admin_adjust_balance insira corretamente em pagamentos
CREATE OR REPLACE FUNCTION admin_adjust_balance(
    p_empresa_id UUID,
    p_valor DECIMAL,
    p_descricao TEXT,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_id UUID;
BEGIN
    -- Inserir como um pagamento do tipo 'ajuste_manual'
    -- Se valor > 0, é crédito (status 'pago')
    -- Se valor < 0, tecnicamente reduz saldo. 
    -- Como o sistema calcula saldo = sum(pagamentos) - sum(repasses),
    -- inserir um pagamento negativo DEVE funcionar se a logica de saldo for puramente soma.
    
    INSERT INTO pagamentos (
        empresa_id,
        valor,
        taxa_comissao,
        valor_liquido,
        status,
        metodo_pagamento,
        referencia_externa,
        processado_em,
        processado_por
    ) VALUES (
        p_empresa_id,
        p_valor,
        0,
        p_valor, -- Valor líquido igual ao valor total
        'pago', -- Já entra como pago/efetivado
        'ajuste_manual',
        p_descricao,
        NOW(),
        p_admin_id
    ) RETURNING id INTO v_new_id;

    -- Registrar transação correspondente
    INSERT INTO transacoes (
        tipo,
        origem_id, -- Quem "pagou". No caso de ajuste positivo, é como se empresa pagasse. 
                   -- Mas ajuste é especial. Vamos manter padrão.
        valor,
        status,
        descricao,
        referencia_pagamento
    ) VALUES (
        'pagamento', -- Mantemos tipo 'pagamento' para simplificar, ou poderíamos alterar estrutura
        p_empresa_id,
        p_valor,
        'concluida',
        p_descricao,
        v_new_id
    );

    RETURN TRUE;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_admin_financial_history(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_balance(UUID, DECIMAL, TEXT, UUID) TO authenticated;
