-- ============================================
-- FIX ARRAY PARSING IN RPC
-- Migração 045: Corrige erro "malformed array literal" ao salvar rascunho
-- O erro ocorre porque ::INTEGER[] não converte JSON Array "[1,2]" para PG Array "{1,2}"
-- ============================================

CREATE OR REPLACE FUNCTION salvar_rascunho_campanha(
  p_dados JSONB,
  p_campanha_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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
      
      -- FIX ARRAY PARSING (Cidades, Estados, Regiões)
      cidades = CASE 
        WHEN p_dados ? 'cidades' AND jsonb_typeof(p_dados->'cidades') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'cidades')) 
        ELSE cidades 
      END,
      estados = CASE 
        WHEN p_dados ? 'estados' AND jsonb_typeof(p_dados->'estados') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'estados')) 
        ELSE estados 
      END,
      regioes = CASE 
        WHEN p_dados ? 'regioes' AND jsonb_typeof(p_dados->'regioes') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'regioes')) 
        ELSE regioes 
      END,

      -- Campos de nicho
      nicho = COALESCE((p_dados->>'nicho')::TEXT, nicho),
      -- FIX ARRAY PARSING (Categorias)
      categorias = CASE 
        WHEN p_dados ? 'categorias' AND jsonb_typeof(p_dados->'categorias') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'categorias')) 
        ELSE categorias 
      END,

      -- Campos de público-alvo
      publico_alvo = COALESCE((p_dados->>'publico_alvo')::JSONB, publico_alvo),
      horarios_exibicao = COALESCE((p_dados->>'horarios_exibicao')::JSONB, horarios_exibicao),
      -- FIX ARRAY PARSING (Dias Semana - INTEGERS)
      dias_semana = CASE 
        WHEN p_dados ? 'dias_semana' AND jsonb_typeof(p_dados->'dias_semana') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'dias_semana')::INTEGER) 
        ELSE dias_semana 
      END,

      -- Campos de objetivos
      objetivo_principal = COALESCE((p_dados->>'objetivo_principal')::TEXT, objetivo_principal),
      -- FIX ARRAY PARSING (Objetivos Secundários)
      objetivos_secundarios = CASE 
        WHEN p_dados ? 'objetivos_secundarios' AND jsonb_typeof(p_dados->'objetivos_secundarios') = 'array' 
        THEN ARRAY(SELECT jsonb_array_elements_text(p_dados->'objetivos_secundarios')) 
        ELSE objetivos_secundarios 
      END,
      
      kpis_meta = COALESCE((p_dados->>'kpis_meta')::JSONB, kpis_meta),
      estrategia = COALESCE((p_dados->>'estrategia')::TEXT, estrategia)
    WHERE id = p_campanha_id AND empresa_id = v_empresa_id;
    
    RETURN p_campanha_id;
  ELSE
    -- Criar nova campanha como rascunho
    INSERT INTO campanhas (
      empresa_id, titulo, descricao, orcamento, data_inicio, data_fim,
      status, is_rascunho, saldo_insuficiente, rascunho_salvo_em, atualizado_em,
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
