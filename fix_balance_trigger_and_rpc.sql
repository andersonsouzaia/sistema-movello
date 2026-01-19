-- ==========================================
-- UPDATE: Admin Adjust Balance & Transactions
-- ==========================================

-- 1. Garante que 'ajuste' seja um tipo válido na constraint
-- Nota: Se for um ENUM, usamos ALTER TYPE. Se for CHECK constraint, precisamos recriar.
DO $$ 
BEGIN
    -- Se for VARCHAR com CHECK constraint, o drop/create abaixo resolve.
    -- Se for ENUM, tentamos adicionar o valor.
    ALTER TYPE transacao_tipo ADD VALUE IF NOT EXISTS 'ajuste';
EXCEPTION
    WHEN undefined_object THEN 
        -- Se não for ENUM, assumimos que é constraint na tabela
        ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_tipo_check;
        ALTER TABLE transacoes ADD CONSTRAINT transacoes_tipo_check CHECK (tipo IN ('pagamento', 'repasse', 'ajuste'));
END $$;

-- 2. Recriar função de ajuste de saldo com colunas corretas
CREATE OR REPLACE FUNCTION admin_adjust_balance(
  p_empresa_id UUID,
  p_valor DECIMAL,
  p_descricao TEXT,
  p_admin_id UUID
) RETURNS UUID AS $$
DECLARE
  v_transacao_id UUID;
BEGIN
  -- Inserir na tabela de transações seguindo o padrão de 010_pagamentos_system_fix_complete
  INSERT INTO transacoes (
    destino_id,     -- No caso de ajuste para empresa, ela é o destino do crédito
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

  -- O saldo real será calculado dinamicamente em get_empresa_stats
  -- Mas registramos no log de auditoria via aplicação ou trigger se necessário.

  RETURN v_transacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_adjust_balance TO authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_balance TO service_role;
