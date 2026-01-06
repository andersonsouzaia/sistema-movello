-- ============================================
-- SISTEMA DE RASCUNHOS DE CAMPANHAS - MOVELLO
-- Migração 021: Sistema completo de rascunhos
-- Data: 2024
-- ============================================

-- ============================================
-- 1. ADICIONAR STATUS 'rascunho' AO CHECK CONSTRAINT
-- ============================================

-- Primeiro, remover o constraint existente
ALTER TABLE campanhas
DROP CONSTRAINT IF EXISTS campanhas_status_check;

-- Adicionar novo constraint com status 'rascunho'
ALTER TABLE campanhas
ADD CONSTRAINT campanhas_status_check CHECK (
    status IN (
        'em_analise',
        'aprovada',
        'reprovada',
        'ativa',
        'pausada',
        'finalizada',
        'cancelada',
        'rascunho'
    )
);

-- ============================================
-- 2. ADICIONAR COLUNAS PARA RASCUNHOS
-- ============================================

ALTER TABLE campanhas
ADD COLUMN IF NOT EXISTS is_rascunho BOOLEAN DEFAULT FALSE;

ALTER TABLE campanhas
ADD COLUMN IF NOT EXISTS saldo_insuficiente BOOLEAN DEFAULT FALSE;

ALTER TABLE campanhas
ADD COLUMN IF NOT EXISTS rascunho_salvo_em TIMESTAMP
WITH
    TIME ZONE;

-- ============================================
-- 3. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_campanhas_is_rascunho ON campanhas (is_rascunho);

CREATE INDEX IF NOT EXISTS idx_campanhas_saldo_insuficiente ON campanhas (saldo_insuficiente);

-- ============================================
-- 4. FUNÇÃO: SALVAR RASCUNHO DE CAMPANHA
-- ============================================

CREATE OR REPLACE FUNCTION salvar_rascunho_campanha(
  p_dados JSONB,
  p_campanha_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campanha_id UUID;
  v_empresa_id UUID;
BEGIN
  -- Obter empresa_id do usuário autenticado
  v_empresa_id := auth.uid();
  
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Se campanha existe, atualizar; senão, criar
  IF p_campanha_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM campanhas 
    WHERE id = p_campanha_id 
    AND empresa_id = v_empresa_id
  ) THEN
    -- Atualizar campanha existente como rascunho
    UPDATE campanhas
    SET 
      titulo = COALESCE((p_dados->>'titulo')::TEXT, titulo),
      descricao = COALESCE((p_dados->>'descricao')::TEXT, descricao),
      orcamento = COALESCE((p_dados->>'orcamento')::DECIMAL, orcamento),
      data_inicio = COALESCE((p_dados->>'data_inicio')::DATE, data_inicio),
      data_fim = COALESCE((p_dados->>'data_fim')::DATE, data_fim),
      is_rascunho = TRUE,
      status = 'rascunho',
      rascunho_salvo_em = NOW(),
      atualizado_em = NOW(),
      -- Campos de geolocalização
      localizacao_tipo = COALESCE((p_dados->>'localizacao_tipo')::TEXT, localizacao_tipo),
      raio_km = COALESCE((p_dados->>'raio_km')::DECIMAL, raio_km),
      centro_latitude = COALESCE((p_dados->>'centro_latitude')::DECIMAL, centro_latitude),
      centro_longitude = COALESCE((p_dados->>'centro_longitude')::DECIMAL, centro_longitude),
      poligono_coordenadas = COALESCE((p_dados->>'poligono_coordenadas')::JSONB, poligono_coordenadas),
      cidades = COALESCE((p_dados->>'cidades')::TEXT[], cidades),
      estados = COALESCE((p_dados->>'estados')::TEXT[], estados),
      regioes = COALESCE((p_dados->>'regioes')::TEXT[], regioes),
      -- Campos de nicho
      nicho = COALESCE((p_dados->>'nicho')::TEXT, nicho),
      categorias = COALESCE((p_dados->>'categorias')::TEXT[], categorias),
      -- Campos de público-alvo
      publico_alvo = COALESCE((p_dados->>'publico_alvo')::JSONB, publico_alvo),
      horarios_exibicao = COALESCE((p_dados->>'horarios_exibicao')::JSONB, horarios_exibicao),
      dias_semana = COALESCE((p_dados->>'dias_semana')::INTEGER[], dias_semana),
      -- Campos de objetivos
      objetivo_principal = COALESCE((p_dados->>'objetivo_principal')::TEXT, objetivo_principal),
      objetivos_secundarios = COALESCE((p_dados->>'objetivos_secundarios')::TEXT[], objetivos_secundarios),
      kpis_meta = COALESCE((p_dados->>'kpis_meta')::JSONB, kpis_meta),
      estrategia = COALESCE((p_dados->>'estrategia')::TEXT, estrategia)
    WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
    
    RETURN p_campanha_id;
  ELSE
    -- Criar nova campanha como rascunho
    INSERT INTO campanhas (
      empresa_id, titulo, descricao, orcamento, data_inicio, data_fim,
      status, is_rascunho, saldo_insuficiente, rascunho_salvo_em,
      localizacao_tipo, raio_km, centro_latitude, centro_longitude,
      poligono_coordenadas, cidades, estados, regioes, nicho, categorias,
      publico_alvo, horarios_exibicao, dias_semana, objetivo_principal,
      objetivos_secundarios, kpis_meta, estrategia
    )
    VALUES (
      v_empresa_id,
      COALESCE(NULLIF(p_dados->>'titulo', ''), 'Novo Rascunho'),
      NULLIF(p_dados->>'descricao', ''),
      COALESCE(
        CASE 
          WHEN p_dados ? 'orcamento' AND p_dados->>'orcamento' != '' AND p_dados->>'orcamento' IS NOT NULL 
          THEN (p_dados->>'orcamento')::DECIMAL 
          ELSE NULL 
        END,
        0
      ),
      COALESCE(
        CASE 
          WHEN p_dados ? 'data_inicio' AND p_dados->>'data_inicio' != '' AND p_dados->>'data_inicio' IS NOT NULL 
          THEN (p_dados->>'data_inicio')::DATE 
          ELSE NULL 
        END,
        CURRENT_DATE
      ),
      COALESCE(
        CASE 
          WHEN p_dados ? 'data_fim' AND p_dados->>'data_fim' != '' AND p_dados->>'data_fim' IS NOT NULL 
          THEN (p_dados->>'data_fim')::DATE 
          ELSE NULL 
        END,
        CURRENT_DATE + INTERVAL '30 days'
      ),
      'rascunho',
      TRUE,
      FALSE,
      NOW(),
      CASE WHEN p_dados ? 'localizacao_tipo' AND p_dados->>'localizacao_tipo' != '' THEN p_dados->>'localizacao_tipo' ELSE NULL END,
      CASE WHEN p_dados ? 'raio_km' AND p_dados->>'raio_km' != '' AND p_dados->>'raio_km' IS NOT NULL THEN (p_dados->>'raio_km')::DECIMAL ELSE NULL END,
      CASE WHEN p_dados ? 'centro_latitude' AND p_dados->>'centro_latitude' != '' AND p_dados->>'centro_latitude' IS NOT NULL THEN (p_dados->>'centro_latitude')::DECIMAL ELSE NULL END,
      CASE WHEN p_dados ? 'centro_longitude' AND p_dados->>'centro_longitude' != '' AND p_dados->>'centro_longitude' IS NOT NULL THEN (p_dados->>'centro_longitude')::DECIMAL ELSE NULL END,
      CASE WHEN p_dados ? 'poligono_coordenadas' AND p_dados->'poligono_coordenadas' IS NOT NULL AND p_dados->'poligono_coordenadas'::text != 'null' THEN p_dados->'poligono_coordenadas' ELSE NULL END,
      CASE WHEN p_dados ? 'cidades' AND p_dados->'cidades' IS NOT NULL AND jsonb_typeof(p_dados->'cidades') = 'array' AND jsonb_array_length(p_dados->'cidades') > 0 THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'cidades')) ELSE NULL END,
      CASE WHEN p_dados ? 'estados' AND p_dados->'estados' IS NOT NULL AND jsonb_typeof(p_dados->'estados') = 'array' AND jsonb_array_length(p_dados->'estados') > 0 THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'estados')) ELSE NULL END,
      CASE WHEN p_dados ? 'regioes' AND p_dados->'regioes' IS NOT NULL AND jsonb_typeof(p_dados->'regioes') = 'array' AND jsonb_array_length(p_dados->'regioes') > 0 THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'regioes')) ELSE NULL END,
      CASE WHEN p_dados ? 'nicho' AND p_dados->>'nicho' != '' THEN p_dados->>'nicho' ELSE NULL END,
      CASE WHEN p_dados ? 'categorias' AND p_dados->'categorias' IS NOT NULL AND jsonb_typeof(p_dados->'categorias') = 'array' AND jsonb_array_length(p_dados->'categorias') > 0 THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'categorias')) ELSE NULL END,
      CASE WHEN p_dados ? 'publico_alvo' AND p_dados->'publico_alvo' IS NOT NULL AND p_dados->'publico_alvo'::text != 'null' THEN p_dados->'publico_alvo' ELSE NULL END,
      CASE WHEN p_dados ? 'horarios_exibicao' AND p_dados->'horarios_exibicao' IS NOT NULL AND p_dados->'horarios_exibicao'::text != 'null' THEN p_dados->'horarios_exibicao' ELSE NULL END,
      CASE WHEN p_dados ? 'dias_semana' AND p_dados->'dias_semana' IS NOT NULL AND jsonb_typeof(p_dados->'dias_semana') = 'array' AND jsonb_array_length(p_dados->'dias_semana') > 0 THEN ARRAY(SELECT (jsonb_array_elements_text(p_dados->'dias_semana'))::INTEGER) ELSE NULL END,
      CASE WHEN p_dados ? 'objetivo_principal' AND p_dados->>'objetivo_principal' != '' THEN p_dados->>'objetivo_principal' ELSE NULL END,
      CASE WHEN p_dados ? 'objetivos_secundarios' AND p_dados->'objetivos_secundarios' IS NOT NULL AND jsonb_typeof(p_dados->'objetivos_secundarios') = 'array' AND jsonb_array_length(p_dados->'objetivos_secundarios') > 0 THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'objetivos_secundarios')) ELSE NULL END,
      CASE WHEN p_dados ? 'kpis_meta' AND p_dados->'kpis_meta' IS NOT NULL AND p_dados->'kpis_meta'::text != 'null' THEN p_dados->'kpis_meta' ELSE NULL END,
      CASE WHEN p_dados ? 'estrategia' AND p_dados->>'estrategia' != '' THEN p_dados->>'estrategia' ELSE NULL END
    )
    RETURNING id INTO v_campanha_id;
    
    RETURN v_campanha_id;
  END IF;
END;
$$;

-- ============================================
-- 5. FUNÇÃO: ATIVAR RASCUNHO DE CAMPANHA
-- ============================================

CREATE OR REPLACE FUNCTION ativar_rascunho_campanha(p_campanha_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_campanha campanhas%ROWTYPE;
  v_saldo_disponivel DECIMAL;
  v_stats JSONB;
BEGIN
  -- Buscar campanha
  SELECT * INTO v_campanha 
  FROM campanhas 
  WHERE id = p_campanha_id 
  AND empresa_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campanha não encontrada';
  END IF;
  
  IF NOT v_campanha.is_rascunho THEN
    RAISE EXCEPTION 'Campanha não é um rascunho';
  END IF;
  
  -- Verificar saldo disponível usando get_empresa_stats
  -- get_empresa_stats retorna uma tabela, então precisamos fazer SELECT INTO
  SELECT saldo_disponivel INTO v_saldo_disponivel
  FROM get_empresa_stats(auth.uid())
  LIMIT 1;
  
  -- Se não retornou nada, saldo é 0
  IF v_saldo_disponivel IS NULL THEN
    v_saldo_disponivel := 0;
  END IF;
  
  -- Verificar se tem saldo suficiente
  IF v_saldo_disponivel < v_campanha.orcamento THEN
    -- Marcar como saldo insuficiente
    UPDATE campanhas
    SET saldo_insuficiente = TRUE
    WHERE id = p_campanha_id;
    
    RETURN jsonb_build_object(
      'sucesso', false,
      'saldo_disponivel', v_saldo_disponivel,
      'orcamento_necessario', v_campanha.orcamento,
      'mensagem', 'Saldo insuficiente para ativar esta campanha'
    );
  END IF;
  
  -- Ativar campanha
  UPDATE campanhas
  SET 
    is_rascunho = FALSE,
    status = 'em_analise',
    saldo_insuficiente = FALSE,
    rascunho_salvo_em = NULL,
    atualizado_em = NOW()
  WHERE id = p_campanha_id;
  
  RETURN jsonb_build_object(
    'sucesso', true,
    'mensagem', 'Rascunho ativado com sucesso. Campanha enviada para análise.'
  );
END;
$$;

-- ============================================
-- 6. RLS POLICIES PARA RASCUNHOS
-- ============================================

-- Empresas podem ver seus próprios rascunhos
-- (já coberto pela política existente de campanhas)

-- Empresas podem criar rascunhos
-- (já coberto pela política existente de INSERT em campanhas)

-- Empresas podem atualizar seus próprios rascunhos
-- (já coberto pela política existente de UPDATE em campanhas)

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION salvar_rascunho_campanha IS 'Salva ou atualiza um rascunho de campanha. Não valida saldo.';

COMMENT ON FUNCTION ativar_rascunho_campanha IS 'Ativa um rascunho verificando saldo disponível. Retorna JSONB com resultado.';

COMMENT ON COLUMN campanhas.is_rascunho IS 'Indica se a campanha é um rascunho';

COMMENT ON COLUMN campanhas.saldo_insuficiente IS 'Indica se a campanha não pode ser ativada por falta de saldo';

COMMENT ON COLUMN campanhas.rascunho_salvo_em IS 'Data e hora em que o rascunho foi salvo pela última vez';