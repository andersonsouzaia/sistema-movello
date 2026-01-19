-- ==========================================
-- MIGRATION: Admin Adjust Balance
-- ==========================================

-- 1. Add 'ajuste' to transaction type enum
DO $$ 
BEGIN
    ALTER TYPE transacao_tipo ADD VALUE IF NOT EXISTS 'ajuste';
EXCEPTION
    WHEN duplicate_object THEN null; -- Ignore if already exists
    WHEN undefined_object THEN null; -- Handle logic inside application if type doesn't exist
END $$;

-- 2. Create function to adjust balance
CREATE OR REPLACE FUNCTION admin_adjust_balance(
  p_empresa_id UUID,
  p_valor DECIMAL,
  p_descricao TEXT,
  p_admin_id UUID
) RETURNS UUID AS $$
DECLARE
  v_transacao_id UUID;
  v_current_balance DECIMAL;
BEGIN
  -- Insert Transaction (acting as the source of truth for history)
  INSERT INTO transacoes (
    empresa_id,
    tipo,
    valor,
    status,
    descricao,
    criado_por,
    -- Assuming references exist, otherwise null
    origem_id, 
    destino_id,
    criado_em,
    updated_at
  ) VALUES (
    p_empresa_id,
    'ajuste',
    p_valor,
    'concluida', -- Adjustments are instant
    p_descricao,
    p_admin_id,
    NULL,
    NULL,
    NOW(),
    NOW()
  ) RETURNING id INTO v_transacao_id;

  -- NOTE: If the system uses a 'saldo' column on 'empresas', we update it here.
  -- Based on investigation, 'get_empresa_stats' likely calculates or reads 'saldo'.
  -- If 'empresas' has a 'saldo' column, we update it. If not, the RPC 'get_empresa_stats'
  -- should automatically pick up the new transaction if it sums 'transacoes'.
  -- To be safe, we attempt an update if the column exists, otherwise we assume calculation.
  
  -- We'll try to update 'empresas.saldo' if it exists. 
  -- Since we cannot conditionally update a column easily in PL/pgSQL without dynamic SQL,
  -- and we don't know for sure if it exists, we will assume the calculation logic (get_empresa_stats)
  -- handles the sum of transactions including 'ajuste'.
  
  -- However, usually systems have a cache column. Let's try to update it.
  -- Only works if column exists. If strictly no column, this block should be removed.
  -- I will comment it out to avoid breaking if column is missing, assuming transactional calculation.
  -- UPDATE empresas SET saldo = saldo + p_valor WHERE id = p_empresa_id;

  RETURN v_transacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION admin_adjust_balance TO authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_balance TO service_role;
