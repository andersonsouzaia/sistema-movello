-- ============================================
-- MÉTRICAS DIÁRIAS PARA DASHBOARD - MOVELLO
-- Migração 023: Funções para dashboard com dados reais
-- Data: 2024
-- ============================================

-- ============================================
-- 1. FUNÇÃO: OBTER MÉTRICAS DIÁRIAS DA EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION get_empresa_metricas_diarias(
  p_empresa_id UUID,
  p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
  data DATE,
  visualizacoes BIGINT,
  gasto DECIMAL,
  cliques BIGINT,
  conversoes BIGINT,
  impressoes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data_inicio DATE;
BEGIN
  -- Verificar se o usuário tem permissão (empresa própria ou admin)
  IF p_empresa_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
  ) THEN
    RAISE EXCEPTION 'Sem permissão para acessar métricas desta empresa';
  END IF;

  v_data_inicio := CURRENT_DATE - (p_dias - 1);
  
  -- Agregar métricas de todas as campanhas ativas da empresa
  RETURN QUERY
  SELECT 
    cm.data,
    COALESCE(SUM(cm.visualizacoes), 0)::BIGINT AS visualizacoes,
    COALESCE(SUM(cm.valor_gasto), 0)::DECIMAL AS gasto,
    COALESCE(SUM(cm.cliques), 0)::BIGINT AS cliques,
    COALESCE(SUM(cm.conversoes), 0)::BIGINT AS conversoes,
    COALESCE(SUM(cm.impressoes), 0)::BIGINT AS impressoes
  FROM campanha_metricas cm
  INNER JOIN campanhas c ON cm.campanha_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND c.status IN ('ativa', 'pausada') -- Apenas campanhas ativas ou pausadas
    AND cm.data >= v_data_inicio
  GROUP BY cm.data
  ORDER BY cm.data DESC;
END;
$$;

-- ============================================
-- 2. FUNÇÃO: OBTER MÉTRICAS CONSOLIDADAS DA EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION get_empresa_metricas_consolidadas(
  p_empresa_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resultado JSONB;
  v_periodo_atual JSONB;
  v_periodo_anterior JSONB;
  v_data_inicio_atual DATE;
  v_data_fim_atual DATE;
  v_data_inicio_anterior DATE;
  v_data_fim_anterior DATE;
BEGIN
  -- Verificar permissão
  IF p_empresa_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
  ) THEN
    RAISE EXCEPTION 'Sem permissão para acessar métricas desta empresa';
  END IF;

  -- Período atual: últimos 30 dias
  v_data_fim_atual := CURRENT_DATE;
  v_data_inicio_atual := CURRENT_DATE - 29;
  
  -- Período anterior: 30-60 dias atrás
  v_data_fim_anterior := v_data_inicio_atual - 1;
  v_data_inicio_anterior := v_data_fim_anterior - 29;

  -- Métricas do período atual
  SELECT jsonb_build_object(
    'total_visualizacoes', COALESCE(SUM(cm.visualizacoes), 0),
    'total_cliques', COALESCE(SUM(cm.cliques), 0),
    'total_conversoes', COALESCE(SUM(cm.conversoes), 0),
    'total_gasto', COALESCE(SUM(cm.valor_gasto), 0),
    'total_impressoes', COALESCE(SUM(cm.impressoes), 0),
    'ctr', CASE 
      WHEN SUM(cm.impressoes) > 0 THEN 
        ROUND((SUM(cm.cliques)::DECIMAL / SUM(cm.impressoes)::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END,
    'cpc', CASE 
      WHEN SUM(cm.cliques) > 0 THEN 
        ROUND((SUM(cm.valor_gasto) / SUM(cm.cliques)::DECIMAL)::NUMERIC, 2)
      ELSE 0
    END,
    'cpm', CASE 
      WHEN SUM(cm.impressoes) > 0 THEN 
        ROUND((SUM(cm.valor_gasto) / (SUM(cm.impressoes)::DECIMAL / 1000))::NUMERIC, 2)
      ELSE 0
    END,
    'cpa', CASE 
      WHEN SUM(cm.conversoes) > 0 THEN 
        ROUND((SUM(cm.valor_gasto) / SUM(cm.conversoes)::DECIMAL)::NUMERIC, 2)
      ELSE 0
    END,
    'taxa_conversao', CASE 
      WHEN SUM(cm.cliques) > 0 THEN 
        ROUND((SUM(cm.conversoes)::DECIMAL / SUM(cm.cliques)::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END
  )
  INTO v_periodo_atual
  FROM campanha_metricas cm
  INNER JOIN campanhas c ON cm.campanha_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND c.status IN ('ativa', 'pausada')
    AND cm.data >= v_data_inicio_atual
    AND cm.data <= v_data_fim_atual;

  -- Métricas do período anterior
  SELECT jsonb_build_object(
    'total_visualizacoes', COALESCE(SUM(cm.visualizacoes), 0),
    'total_cliques', COALESCE(SUM(cm.cliques), 0),
    'total_conversoes', COALESCE(SUM(cm.conversoes), 0),
    'total_gasto', COALESCE(SUM(cm.valor_gasto), 0),
    'total_impressoes', COALESCE(SUM(cm.impressoes), 0)
  )
  INTO v_periodo_anterior
  FROM campanha_metricas cm
  INNER JOIN campanhas c ON cm.campanha_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND c.status IN ('ativa', 'pausada')
    AND cm.data >= v_data_inicio_anterior
    AND cm.data <= v_data_fim_anterior;

  -- Calcular tendências
  v_resultado := jsonb_build_object(
    'periodo_atual', v_periodo_atual,
    'periodo_anterior', v_periodo_anterior,
    'tendencias', jsonb_build_object(
      'visualizacoes_crescimento', CASE 
        WHEN (v_periodo_anterior->>'total_visualizacoes')::BIGINT > 0 THEN
          ROUND((((v_periodo_atual->>'total_visualizacoes')::BIGINT - (v_periodo_anterior->>'total_visualizacoes')::BIGINT)::DECIMAL / (v_periodo_anterior->>'total_visualizacoes')::BIGINT * 100)::NUMERIC, 2)
        ELSE 0
      END,
      'gasto_crescimento', CASE 
        WHEN (v_periodo_anterior->>'total_gasto')::DECIMAL > 0 THEN
          ROUND((((v_periodo_atual->>'total_gasto')::DECIMAL - (v_periodo_anterior->>'total_gasto')::DECIMAL) / (v_periodo_anterior->>'total_gasto')::DECIMAL * 100)::NUMERIC, 2)
        ELSE 0
      END,
      'cliques_crescimento', CASE 
        WHEN (v_periodo_anterior->>'total_cliques')::BIGINT > 0 THEN
          ROUND((((v_periodo_atual->>'total_cliques')::BIGINT - (v_periodo_anterior->>'total_cliques')::BIGINT)::DECIMAL / (v_periodo_anterior->>'total_cliques')::BIGINT * 100)::NUMERIC, 2)
        ELSE 0
      END,
      'conversoes_crescimento', CASE 
        WHEN (v_periodo_anterior->>'total_conversoes')::BIGINT > 0 THEN
          ROUND((((v_periodo_atual->>'total_conversoes')::BIGINT - (v_periodo_anterior->>'total_conversoes')::BIGINT)::DECIMAL / (v_periodo_anterior->>'total_conversoes')::BIGINT * 100)::NUMERIC, 2)
        ELSE 0
      END
    )
  );

  RETURN v_resultado;
END;
$$;

-- ============================================
-- 3. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION get_empresa_metricas_diarias IS 'Retorna métricas diárias agregadas de todas as campanhas ativas da empresa';
COMMENT ON FUNCTION get_empresa_metricas_consolidadas IS 'Retorna métricas consolidadas com comparação entre períodos e tendências';


