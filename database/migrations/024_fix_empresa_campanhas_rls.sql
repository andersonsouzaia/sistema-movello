-- ============================================
-- CORREÇÃO RLS E FUNÇÕES PARA SISTEMA EMPRESA
-- Migração 024: Adicionar políticas RLS faltantes e garantir funções disponíveis
-- Data: 2024
-- ============================================

-- ============================================
-- 1. POLÍTICAS RLS PARA CAMPANHAS
-- ============================================

-- SELECT: Empresas podem ver suas próprias campanhas
DROP POLICY IF EXISTS "Empresas podem ver suas campanhas" ON campanhas;

CREATE POLICY "Empresas podem ver suas campanhas" ON campanhas FOR
SELECT TO authenticated USING (empresa_id = auth.uid ());

-- SELECT: Admins podem ver todas as campanhas
DROP POLICY IF EXISTS "Admins podem ver todas as campanhas" ON campanhas;

CREATE POLICY "Admins podem ver todas as campanhas" ON campanhas FOR
SELECT TO authenticated USING (is_user_admin ());

-- ============================================
-- 2. GARANTIR FUNÇÃO get_empresa_stats DISPONÍVEL
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
        COALESCE(SUM(c.orcamento - COALESCE(c.orcamento_utilizado, 0)), 0)::DECIMAL(10,2) as saldo_disponivel
    FROM empresas e
    LEFT JOIN campanhas c ON c.empresa_id = e.id
    LEFT JOIN campanha_metricas cm ON cm.campanha_id = c.id
    WHERE e.id = v_empresa_id
    GROUP BY e.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_empresa_stats TO authenticated;

COMMENT ON FUNCTION get_empresa_stats IS 'Retorna estatísticas agregadas da empresa (campanhas, visualizações, gastos, saldo). Aceita p_empresa_id opcional, usa auth.uid() se não fornecido.';

-- ============================================
-- 3. COMENTÁRIOS DAS POLÍTICAS
-- ============================================

COMMENT ON POLICY "Empresas podem ver suas campanhas" ON campanhas IS 'Permite que empresas vejam apenas suas próprias campanhas';

COMMENT ON POLICY "Admins podem ver todas as campanhas" ON campanhas IS 'Permite que admins vejam todas as campanhas do sistema';