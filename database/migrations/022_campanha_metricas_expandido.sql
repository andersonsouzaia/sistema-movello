-- ============================================
-- SISTEMA DE MÉTRICAS EXPANDIDO - MOVELLO
-- Migração 022: Expandir métricas de campanhas
-- Data: 2024
-- ============================================

-- ============================================
-- 1. VERIFICAR/CRIAR TABELA campanha_metricas
-- ============================================

-- Criar tabela se não existir (pode não ter sido criada na migração 008)
CREATE TABLE IF NOT EXISTS campanha_metricas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    campanha_id UUID NOT NULL REFERENCES campanhas (id) ON DELETE CASCADE,
    data DATE NOT NULL,
    visualizacoes INTEGER NOT NULL DEFAULT 0,
    cliques INTEGER NOT NULL DEFAULT 0,
    conversoes INTEGER NOT NULL DEFAULT 0,
    valor_gasto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (campanha_id, data)
);

-- ============================================
-- 2. EXPANDIR TABELA campanha_metricas
-- ============================================

-- Adicionar novas colunas se não existirem
ALTER TABLE campanha_metricas
ADD COLUMN IF NOT EXISTS impressoes INTEGER DEFAULT 0;

ALTER TABLE campanha_metricas
ADD COLUMN IF NOT EXISTS tempo_medio_visualizacao INTEGER DEFAULT 0;

ALTER TABLE campanha_metricas
ADD COLUMN IF NOT EXISTS taxa_rejeicao DECIMAL(5, 2) DEFAULT 0;

ALTER TABLE campanha_metricas
ADD COLUMN IF NOT EXISTS alcance INTEGER DEFAULT 0;

ALTER TABLE campanha_metricas
ADD COLUMN IF NOT EXISTS engajamento INTEGER DEFAULT 0;

-- Criar índices básicos se não existirem
CREATE INDEX IF NOT EXISTS idx_campanha_metricas_campanha ON campanha_metricas (campanha_id);

-- ============================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_campanha_metricas_data ON campanha_metricas (data DESC);

CREATE INDEX IF NOT EXISTS idx_campanha_metricas_campanha_data ON campanha_metricas (campanha_id, data DESC);

-- ============================================
-- 4. FUNÇÃO: OBTER MÉTRICAS CONSOLIDADAS DE CAMPANHA
-- ============================================

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

  -- Calcular totais
  SELECT 
    COALESCE(SUM(visualizacoes), 0),
    COALESCE(SUM(cliques), 0),
    COALESCE(SUM(conversoes), 0),
    COALESCE(SUM(valor_gasto), 0),
    COALESCE(SUM(impressoes), 0),
    COALESCE(AVG(tempo_medio_visualizacao), 0)
  INTO 
    v_total_visualizacoes,
    v_total_cliques,
    v_total_conversoes,
    v_total_gasto,
    v_total_impressoes,
    v_tempo_medio
  FROM campanha_metricas
  WHERE campanha_id = p_campanha_id
    AND (p_data_inicio IS NULL OR data >= p_data_inicio)
    AND (p_data_fim IS NULL OR data <= p_data_fim);
  
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

-- ============================================
-- 5. FUNÇÃO: OBTER MÉTRICAS DIÁRIAS DE CAMPANHA
-- ============================================

CREATE OR REPLACE FUNCTION get_metricas_diarias_campanha(
  p_campanha_id UUID,
  p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
  data DATE,
  visualizacoes INTEGER,
  gasto DECIMAL,
  cliques INTEGER,
  conversoes INTEGER,
  impressoes INTEGER,
  ctr DECIMAL,
  cpc DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data_inicio DATE;
BEGIN
  -- Verificar se a campanha pertence à empresa do usuário autenticado
  IF NOT EXISTS (
    SELECT 1 FROM campanhas 
    WHERE id = p_campanha_id 
    AND empresa_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Campanha não encontrada ou sem permissão';
  END IF;

  v_data_inicio := CURRENT_DATE - (p_dias - 1);
  
  RETURN QUERY
  SELECT 
    cm.data,
    COALESCE(cm.visualizacoes, 0)::INTEGER,
    COALESCE(cm.valor_gasto, 0)::DECIMAL,
    COALESCE(cm.cliques, 0)::INTEGER,
    COALESCE(cm.conversoes, 0)::INTEGER,
    COALESCE(cm.impressoes, 0)::INTEGER,
    -- CTR diário
    CASE 
      WHEN cm.impressoes > 0 THEN 
        ROUND((cm.cliques::DECIMAL / cm.impressoes::DECIMAL * 100)::NUMERIC, 2)
      ELSE 0
    END AS ctr,
    -- CPC diário
    CASE 
      WHEN cm.cliques > 0 THEN 
        ROUND((cm.valor_gasto / cm.cliques::DECIMAL)::NUMERIC, 2)
      ELSE 0
    END AS cpc
  FROM campanha_metricas cm
  WHERE cm.campanha_id = p_campanha_id
    AND cm.data >= v_data_inicio
  ORDER BY cm.data DESC;
END;
$$;

-- ============================================
-- 6. FUNÇÃO: REGISTRAR MÉTRICA DE CAMPANHA
-- ============================================

CREATE OR REPLACE FUNCTION registrar_metrica_campanha(
  p_campanha_id UUID,
  p_data DATE,
  p_metricas JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metrica_id UUID;
BEGIN
  -- Verificar se a campanha pertence à empresa do usuário autenticado
  -- (ou se é admin)
  IF NOT EXISTS (
    SELECT 1 FROM campanhas 
    WHERE id = p_campanha_id 
    AND (empresa_id = auth.uid() OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.slug = 'admin'
    ))
  ) THEN
    RAISE EXCEPTION 'Campanha não encontrada ou sem permissão';
  END IF;

  -- Inserir ou atualizar métrica
  INSERT INTO campanha_metricas (
    campanha_id,
    data,
    visualizacoes,
    cliques,
    conversoes,
    valor_gasto,
    impressoes,
    tempo_medio_visualizacao,
    taxa_rejeicao,
    alcance,
    engajamento
  )
  VALUES (
    p_campanha_id,
    p_data,
    COALESCE((p_metricas->>'visualizacoes')::INTEGER, 0),
    COALESCE((p_metricas->>'cliques')::INTEGER, 0),
    COALESCE((p_metricas->>'conversoes')::INTEGER, 0),
    COALESCE((p_metricas->>'valor_gasto')::DECIMAL, 0),
    COALESCE((p_metricas->>'impressoes')::INTEGER, 0),
    COALESCE((p_metricas->>'tempo_medio_visualizacao')::INTEGER, 0),
    COALESCE((p_metricas->>'taxa_rejeicao')::DECIMAL, 0),
    COALESCE((p_metricas->>'alcance')::INTEGER, 0),
    COALESCE((p_metricas->>'engajamento')::INTEGER, 0)
  )
  ON CONFLICT (campanha_id, data) 
  DO UPDATE SET
    visualizacoes = EXCLUDED.visualizacoes,
    cliques = EXCLUDED.cliques,
    conversoes = EXCLUDED.conversoes,
    valor_gasto = EXCLUDED.valor_gasto,
    impressoes = EXCLUDED.impressoes,
    tempo_medio_visualizacao = EXCLUDED.tempo_medio_visualizacao,
    taxa_rejeicao = EXCLUDED.taxa_rejeicao,
    alcance = EXCLUDED.alcance,
    engajamento = EXCLUDED.engajamento
  RETURNING id INTO v_metrica_id;
  
  RETURN v_metrica_id;
END;
$$;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

ALTER TABLE campanha_metricas ENABLE ROW LEVEL SECURITY;

-- Empresas podem ver métricas de suas campanhas
-- Remover política se já existir antes de criar
DROP POLICY IF EXISTS "Empresas podem ver métricas de suas campanhas" ON campanha_metricas;

CREATE POLICY "Empresas podem ver métricas de suas campanhas" ON campanha_metricas FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM campanhas
            WHERE
                campanhas.id = campanha_metricas.campanha_id
                AND campanhas.empresa_id = auth.uid ()
        )
    );

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION get_campanha_metricas IS 'Retorna métricas consolidadas de uma campanha com cálculos de CTR, CPC, CPM, CPA';

COMMENT ON FUNCTION get_metricas_diarias_campanha IS 'Retorna métricas diárias de uma campanha para os últimos N dias';

COMMENT ON FUNCTION registrar_metrica_campanha IS 'Insere ou atualiza métricas diárias de uma campanha';