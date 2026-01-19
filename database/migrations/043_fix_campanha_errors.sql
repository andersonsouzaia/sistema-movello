-- ============================================
-- FIX ERROS SQL CAMPANHA
-- Migração 043: Corrige coluna ambígua e falta de coluna
-- ============================================

-- 1. ADICIONAR COLUNA ATUALIZADO_EM
-- O erro "column atualizado_em does not exist" indica que ela falta
DO $$
BEGIN
    BEGIN
        ALTER TABLE campanhas ADD COLUMN atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;

-- 2. CORRIGIR GET_CAMPANHA_METRICAS (Coluna ambígua)
CREATE OR REPLACE FUNCTION get_campanha_metricas(
  p_campanha_id UUID,
  p_data_inicio DATE DEFAULT NULL,
  p_data_fim DATE DEFAULT NULL
)
RETURNS TABLE (
  total_visualizacoes BIGINT,
  total_cliques BIGINT,
  total_conversoes BIGINT,
  total_gasto DECIMAL,
  total_impressoes BIGINT,
  ctr DECIMAL,
  cpc DECIMAL,
  cpm DECIMAL,
  cpa DECIMAL,
  taxa_conversao DECIMAL,
  tempo_medio_visualizacao DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_visualizacoes BIGINT;
  v_total_cliques BIGINT;
  v_total_conversoes BIGINT;
  v_total_gasto DECIMAL;
  v_total_impressoes BIGINT;
  v_tempo_medio DECIMAL;
BEGIN
  -- Verificar se a campanha pertence à empresa do usuário autenticado
  IF NOT EXISTS (
    SELECT 1 FROM campanhas 
    WHERE id = p_campanha_id 
    AND empresa_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Campanha não encontrada ou sem permissão';
  END IF;

  -- Calcular totais (USANDO ALIAS "cm" PARA EVITAR AMBIGUIDADE)
  SELECT 
    COALESCE(SUM(cm.visualizacoes), 0),
    COALESCE(SUM(cm.cliques), 0),
    COALESCE(SUM(cm.conversoes), 0),
    COALESCE(SUM(cm.valor_gasto), 0),
    COALESCE(SUM(cm.impressoes), 0),
    COALESCE(AVG(cm.tempo_medio_visualizacao), 0)
  INTO 
    v_total_visualizacoes,
    v_total_cliques,
    v_total_conversoes,
    v_total_gasto,
    v_total_impressoes,
    v_tempo_medio
  FROM campanha_metricas cm
  WHERE cm.campanha_id = p_campanha_id
    AND (p_data_inicio IS NULL OR cm.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR cm.data <= p_data_fim);
  
  -- Retornar métricas calculadas
  RETURN QUERY SELECT
    v_total_visualizacoes,
    v_total_cliques,
    v_total_conversoes,
    v_total_gasto,
    v_total_impressoes,
    -- CTR (Click-Through Rate) = (cliques / impressoes) * 100
    CASE 
      WHEN v_total_impressoes > 0 THEN 
        ROUND((v_total_cliques::DECIMAL / v_total_impressoes::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END AS ctr,
    -- CPC (Custo por Clique) = gasto / cliques
    CASE 
      WHEN v_total_cliques > 0 THEN 
        ROUND((v_total_gasto / v_total_cliques::DECIMAL)::NUMERIC, 2)
      ELSE 0
    END AS cpc,
    -- CPM (Custo por Mil Impressões) = (gasto / impressoes) * 1000
    CASE 
      WHEN v_total_impressoes > 0 THEN 
        ROUND((v_total_gasto / (v_total_impressoes::DECIMAL / 1000))::NUMERIC, 2)
      ELSE 0
    END AS cpm,
    -- CPA (Custo por Aquisição) = gasto / conversoes
    CASE 
      WHEN v_total_conversoes > 0 THEN 
        ROUND((v_total_gasto / v_total_conversoes::DECIMAL)::NUMERIC, 2)
      ELSE 0
    END AS cpa,
    -- Taxa de Conversão = (conversoes / cliques) * 100
    CASE 
      WHEN v_total_cliques > 0 THEN 
        ROUND((v_total_conversoes::DECIMAL / v_total_cliques::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END AS taxa_conversao,
    -- Tempo médio de visualização
    ROUND(v_tempo_medio::NUMERIC, 2) AS tempo_medio_visualizacao;
END;
$$;
