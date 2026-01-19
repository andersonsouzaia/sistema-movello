-- ============================================
-- FIX get_user_profile PERFORMANCE
-- Migração 039: Recria o RPC get_user_profile usando return type seguro
-- ============================================

-- Drop versão antiga para evitar conflitos de assinatura
DROP FUNCTION IF EXISTS get_user_profile(uuid);

-- Criar versão robusta que retorna SETOF users
-- Isso garante correspondência exata com a tabela, evitando erros de "structure mismatch"
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM users
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;

-- Garantir que a tabela users tenha os índices necessários
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-- Comentário
COMMENT ON FUNCTION get_user_profile IS 'Retorna o perfil do usuário pelo ID, bypassando RLS via Security Definer. Retorna um registro da tabela users.';
