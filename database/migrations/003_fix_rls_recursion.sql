-- ============================================
-- CORREÇÃO DA RECURSÃO INFINITA EM RLS
-- Criar função helper que bypassa RLS para verificar tipo de usuário
-- Data: 2024
-- ============================================

-- ============================================
-- FUNÇÃO HELPER PARA VERIFICAR SE É ADMIN
-- ============================================

-- Função que verifica se o usuário atual é admin (bypassa RLS)
-- SECURITY DEFINER permite que a função execute com privilégios do criador,
-- bypassando RLS e evitando recursão infinita
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_tipo TEXT;
BEGIN
  -- Buscar tipo do usuário diretamente, bypassando RLS
  SELECT tipo INTO user_tipo
  FROM users
  WHERE id = auth.uid();
  
  RETURN user_tipo = 'admin';
END;
$$;

-- ============================================
-- COMENTÁRIO DA FUNÇÃO
-- ============================================

COMMENT ON FUNCTION is_user_admin() IS 
'Verifica se o usuário atual é admin. Usa SECURITY DEFINER para bypassar RLS e evitar recursão infinita nas políticas.';

-- ============================================
-- CORRIGIR POLÍTICAS DE SELECT
-- ============================================

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "users_select_admin" ON users;

-- Nova política usando a função (SEM recursão)
CREATE POLICY "users_select_admin" ON users
FOR SELECT
TO authenticated
USING (is_user_admin());

-- Aplicar a mesma correção para outras políticas que verificam admin
DROP POLICY IF EXISTS "empresas_select_admin" ON empresas;
CREATE POLICY "empresas_select_admin" ON empresas
FOR SELECT
TO authenticated
USING (is_user_admin());

DROP POLICY IF EXISTS "motoristas_select_admin" ON motoristas;
CREATE POLICY "motoristas_select_admin" ON motoristas
FOR SELECT
TO authenticated
USING (is_user_admin());

DROP POLICY IF EXISTS "admins_select_all" ON admins;
CREATE POLICY "admins_select_all" ON admins
FOR SELECT
TO authenticated
USING (is_user_admin());

DROP POLICY IF EXISTS "login_attempts_admin_all" ON login_attempts;
CREATE POLICY "login_attempts_admin_all" ON login_attempts
FOR ALL
TO authenticated
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- ============================================
-- CORRIGIR POLÍTICAS DE UPDATE
-- ============================================

DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users
FOR UPDATE
TO authenticated
USING (is_user_admin())
WITH CHECK (is_user_admin());

DROP POLICY IF EXISTS "empresas_update_admin" ON empresas;
CREATE POLICY "empresas_update_admin" ON empresas
FOR UPDATE
TO authenticated
USING (is_user_admin())
WITH CHECK (is_user_admin());

DROP POLICY IF EXISTS "motoristas_update_admin" ON motoristas;
CREATE POLICY "motoristas_update_admin" ON motoristas
FOR UPDATE
TO authenticated
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- ============================================
-- CORRIGIR POLÍTICAS DE DELETE
-- ============================================

DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin" ON users
FOR DELETE
TO authenticated
USING (is_user_admin());

DROP POLICY IF EXISTS "empresas_delete_admin" ON empresas;
CREATE POLICY "empresas_delete_admin" ON empresas
FOR DELETE
TO authenticated
USING (is_user_admin());

DROP POLICY IF EXISTS "motoristas_delete_admin" ON motoristas;
CREATE POLICY "motoristas_delete_admin" ON motoristas
FOR DELETE
TO authenticated
USING (is_user_admin());

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. RECURSÃO RESOLVIDA:
--    - A função is_user_admin() usa SECURITY DEFINER para bypassar RLS
--    - Isso evita que a verificação de admin cause recursão infinita
--    - A função executa com privilégios do criador, não do usuário atual

-- 2. SEGURANÇA:
--    - A função ainda verifica auth.uid() para garantir que só verifica o usuário atual
--    - SECURITY DEFINER é necessário para bypassar RLS, mas a função é segura

-- 3. PERFORMANCE:
--    - A função é marcada como STABLE, permitindo otimizações pelo PostgreSQL
--    - Evita múltiplas queries desnecessárias

-- ============================================
-- FIM DO SCRIPT
-- ============================================

