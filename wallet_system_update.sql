-- ==========================================
-- SISTEMA DE CARTEIRA (WALLET) - MOVELLO
-- Script de Atualização Completa
-- ==========================================

-- 1. ADICIONAR TIPO 'ajuste' E GARANTIR CONSTRAINTS
DO $$ 
BEGIN
    ALTER TYPE transacao_tipo ADD VALUE IF NOT EXISTS 'ajuste';
EXCEPTION
    WHEN undefined_object THEN 
        ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;
        ALTER TABLE transacoes ADD CONSTRAINT transacoes_tipo_check CHECK (tipo IN ('pagamento', 'repasse', 'ajuste'));
END $$;

-- 2. RPC: admin_adjust_balance
-- Permite ao admin ajustar o saldo de uma empresa manualmente
CREATE OR REPLACE FUNCTION admin_adjust_balance(
  p_empresa_id UUID,
  p_valor DECIMAL,
  p_descricao TEXT,
  p_admin_id UUID
) RETURNS UUID AS $$
DECLARE
  v_transacao_id UUID;
BEGIN
  INSERT INTO transacoes (
    destino_id,
    tipo,
    valor,
    status,
    descricao,
    criado_em
  ) VALUES (
    p_empresa_id,
    'ajuste',
    p_valor,
    'concluida',
    p_descricao,
    NOW()
  ) RETURNING id INTO v_transacao_id;

  RETURN v_transacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: get_empresa_stats
-- Calcula o saldo disponível: (Créditos Totais) - (Orçamentos Alocados)
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
    v_empresa_id := COALESCE(p_empresa_id, auth.uid());
    
    IF v_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Créditos: Pagamentos pagos + Ajustes positivos/negativos
    SELECT COALESCE(SUM(valor), 0) INTO v_total_creditos
    FROM transacoes
    WHERE (origem_id = v_empresa_id OR destino_id = v_empresa_id)
      AND status IN ('pago', 'concluida');

    -- Alocado: Orçamento de campanhas ativas ou gasto de campanhas finalizadas
    SELECT COALESCE(SUM(
        CASE 
            WHEN status IN ('ativa', 'pausada', 'em_analise', 'aprovada') THEN orcamento
            ELSE COALESCE(orcamento_utilizado, 0)
        END
    ), 0) INTO v_total_alocado
    FROM campanhas
    WHERE empresa_id = v_empresa_id
      AND status != 'rascunho';

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

-- 4. RPC: get_empresa_pagamentos
-- Histórico unificado de transações (Pagamentos + Ajustes)
CREATE OR REPLACE FUNCTION get_empresa_pagamentos(
    p_empresa_id UUID DEFAULT NULL,
    p_status VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    empresa_id UUID,
    valor DECIMAL(10,2),
    metodo_pagamento VARCHAR(50),
    status VARCHAR(50),
    criado_em TIMESTAMP WITH TIME ZONE,
    processado_em TIMESTAMP WITH TIME ZONE,
    descricao TEXT,
    tipo VARCHAR(50)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_empresa_id UUID;
BEGIN
    v_empresa_id := COALESCE(p_empresa_id, auth.uid());
    
    RETURN QUERY
    SELECT
        t.id,
        v_empresa_id as empresa_id,
        t.valor,
        CASE 
            WHEN t.tipo = 'ajuste' THEN 'Ajuste Admin'
            WHEN t.referencia_pagamento IS NOT NULL THEN (SELECT p.metodo_pagamento FROM pagamentos p WHERE p.id = t.referencia_pagamento)
            ELSE 'Diverso'
        END as metodo_pagamento,
        CASE 
            WHEN t.status = 'concluida' THEN 'pago'
            ELSE t.status
        END as status,
        t.criado_em,
        CASE 
            WHEN t.status = 'concluida' THEN t.criado_em 
            ELSE NULL 
        END as processado_em,
        t.descricao,
        t.tipo
    FROM transacoes t
    WHERE (t.origem_id = v_empresa_id OR t.destino_id = v_empresa_id)
    AND (
        p_status IS NULL 
        OR (p_status = 'pago' AND t.status = 'concluida')
        OR t.status = p_status
    )
    ORDER BY t.criado_em DESC;
END;
$$;

-- PERMISSÕES
GRANT EXECUTE ON FUNCTION admin_adjust_balance TO authenticated;
GRANT EXECUTE ON FUNCTION get_empresa_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_empresa_pagamentos TO authenticated;
