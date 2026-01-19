-- ============================================
-- SQL: Otimizar get_empresa_stats para cálculo de saldo real
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
    v_total_creditos DECIMAL(10,2) := 0;
    v_total_alocado DECIMAL(10,2) := 0;
BEGIN
    -- 1. Identificar Empresa
    v_empresa_id := COALESCE(p_empresa_id, auth.uid());
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- 2. Calcular Créditos Totais (Depósitos via Pagamentos + Ajustes do Admin)
    -- Tipo 'pagamento' (Origem: Empresa) -> Crédito na carteira
    -- Tipo 'ajuste' (Destino: Empresa) -> Crédito/Débito na carteira
    SELECT COALESCE(SUM(
        CASE 
            WHEN tipo = 'pagamento' THEN valor 
            WHEN tipo = 'ajuste' THEN valor 
            ELSE 0 
        END
    ), 0) INTO v_total_creditos
    FROM transacoes
    WHERE (origem_id = v_empresa_id OR destino_id = v_empresa_id)
      AND status IN ('pago', 'concluida');

    -- 3. Calcular Valor Alocado em Campanhas
    -- Reservamos o Orçamento Total para campanhas em curso
    -- Para campanhas finalizadas/canceladas, contamos apenas o que foi gasto (liberando o resto para o saldo)
    SELECT COALESCE(SUM(
        CASE 
            WHEN status IN ('ativa', 'pausada', 'em_analise', 'aprovada') THEN orcamento
            ELSE COALESCE(orcamento_utilizado, 0)
        END
    ), 0) INTO v_total_alocado
    FROM campanhas
    WHERE empresa_id = v_empresa_id
      AND status != 'rascunho';

    -- 4. Retornar os Stats Consolidados
    RETURN QUERY
    SELECT
        COUNT(DISTINCT c.id)::BIGINT as total_campanhas,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ativa')::BIGINT as campanhas_ativas,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('em_analise', 'aprovada'))::BIGINT as campanhas_pendentes,
        COALESCE(SUM(DISTINCT cm.visualizacoes), 0)::BIGINT as total_visualizacoes,
        COALESCE(SUM(DISTINCT COALESCE(c.orcamento_utilizado, 0)), 0)::DECIMAL(10,2) as total_gasto,
        COALESCE(SUM(DISTINCT c.orcamento), 0)::DECIMAL(10,2) as orcamento_total,
        (v_total_creditos - v_total_alocado)::DECIMAL(10,2) as saldo_disponivel
    FROM empresas e
    LEFT JOIN campanhas c ON c.empresa_id = e.id
    LEFT JOIN campanha_metricas cm ON cm.campanha_id = c.id
    WHERE e.id = v_empresa_id
    GROUP BY e.id;
END;
$$;
