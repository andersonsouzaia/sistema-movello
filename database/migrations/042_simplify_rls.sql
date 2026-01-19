-- ============================================
-- FIX RLS RECURSION FINAL
-- Migração 042: Simplifica RLS de users e usa SECURITY DEFINER para evitar loops
-- ============================================

-- 1. Criar função segura para verificar admin (Bypass RLS)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verifica direto na tabela admins se o ID existe
  -- Como é SECURITY DEFINER, ignora as policies da tabela admins
  RETURN EXISTS (
    SELECT 1 
    FROM admins 
    WHERE id = auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_is_admin TO authenticated;

-- 2. Resetar Políticas da Tabela Users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
-- Drop any other legacy policies just in case (wildcard drop not possible in SQL standard, rely on explicit names or Disable RLS)
DROP POLICY IF EXISTS "users_read_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;

-- 3. Recriar Políticas Simplificadas

-- Leitura: Próprio usuário OR Admin
CREATE POLICY "users_read_policy" ON users
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  check_is_admin()
);

-- Atualização: Próprio usuário
CREATE POLICY "users_update_policy" ON users
FOR UPDATE
USING (auth.uid() = id);

-- Inserção: Authenticated (Trigger lida com criação automática via Auth, mas permitimos insert explícito se necessário)
CREATE POLICY "users_insert_policy" ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Re-habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Garantir performance no RPC get_user_profile
-- (Já feito no 039, mas reforçando que ele também é Security Definer)
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
