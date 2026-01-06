-- ============================================
-- CORREÇÃO: get_empresa_stats
-- Migração 028: Corrigir função get_empresa_stats para não usar orcamento_utilizado
-- Data: 2024
-- ============================================

-- Verificar se a coluna orcamento_utilizado existe
DO $$
BEGIN
    -- Se a coluna não existir, criar
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'campanhas' 
        AND column_name = 'orcamento_utilizado'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN orcamento_utilizado DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Corrigir função get_empresa_stats para usar COALESCE corretamente
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
        COUNT(DISTINCT c.id)::BIGINT as total_campanhas,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'ativa')::BIGINT as campanhas_ativas,
        COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('em_analise', 'aprovada'))::BIGINT as campanhas_pendentes,
        COALESCE(SUM(DISTINCT cm.visualizacoes), 0)::BIGINT as total_visualizacoes,
        COALESCE(SUM(DISTINCT COALESCE(c.orcamento_utilizado, 0)), 0)::DECIMAL(10,2) as total_gasto,
        COALESCE(SUM(DISTINCT c.orcamento), 0)::DECIMAL(10,2) as orcamento_total,
        COALESCE(SUM(DISTINCT c.orcamento - COALESCE(c.orcamento_utilizado, 0)), 0)::DECIMAL(10,2) as saldo_disponivel
    FROM empresas e
    LEFT JOIN campanhas c ON c.empresa_id = e.id
    LEFT JOIN campanha_metricas cm ON cm.campanha_id = c.id
    WHERE e.id = v_empresa_id
    GROUP BY e.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_empresa_stats TO authenticated;

COMMENT ON FUNCTION get_empresa_stats IS 'Retorna estatísticas agregadas da empresa (campanhas, visualizações, gastos, saldo). Aceita p_empresa_id opcional, usa auth.uid() se não fornecido.';

