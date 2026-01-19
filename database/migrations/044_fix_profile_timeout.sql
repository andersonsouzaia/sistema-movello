-- ============================================
-- FIX PROFILE TIMEOUT (RLS RECURSION)
-- Migração 044: Simplifica radicalmente RLS de users para evitar timeouts
-- ============================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE
-- Isso para imediatamente qualquer deadlock ou loop de recursão
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. GARANTIR FUNÇÃO ADMIN SEGURA (Bypass RLS)
-- Esta função checa se é admin SEM passar pelas policies da tabela admins
CREATE OR REPLACE FUNCTION public.check_is_admin_secure()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica direto na tabela admins se o ID existe
  RETURN EXISTS (
    SELECT 1 
    FROM admins 
    WHERE id = auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_is_admin_secure TO authenticated;

-- 3. REMOVER TODAS AS POLICIES ANTIGAS
-- Limpeza completa para evitar qualquer resquício de recursão
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;

-- 4. RECRIAR POLICIES SIMPLIFICADAS (SEM RECURSÃO)

-- Leitura: O próprio usuário pode ler SEU registro.
-- Admins podem ler qualquer registro (usando a função segura).
CREATE POLICY "users_read_policy_v2" ON users
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  check_is_admin_secure()
);

-- Atualização: Apenas o próprio usuário pode atualizar
CREATE POLICY "users_update_policy_v2" ON users
FOR UPDATE
USING (auth.uid() = id);

-- Inserção: O próprio usuário (ao se cadastrar)
CREATE POLICY "users_insert_policy_v2" ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. RE-HABILITAR RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. OTIMIZAR RPC DE PERFIL
-- Garante que o RPC também seja SECURITY DEFINER para performance máxima
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Busca direta pela Primary Key (Index Scan)
    RETURN QUERY
    SELECT *
    FROM users
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;
