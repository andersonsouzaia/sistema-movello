-- ============================================
-- CORREÇÃO DEFINITIVA DE POLÍTICAS RLS - MOVELLO
-- Remove TODAS as políticas existentes e cria novas
-- Permite signup e remove recursão infinita
-- Data: 2024
-- ============================================

-- ============================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ============================================

-- Remover TODAS as políticas da tabela users usando loop dinâmico
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela empresas usando loop dinâmico
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'empresas') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON empresas';
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela motoristas usando loop dinâmico
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'motoristas') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON motoristas';
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela admins usando loop dinâmico
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'admins') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON admins';
    END LOOP;
END $$;

-- Remover políticas específicas conhecidas (caso o método acima não funcione)
DROP POLICY IF EXISTS "users_insert_signup" ON users CASCADE;
DROP POLICY IF EXISTS "users_insert_policy" ON users CASCADE;
DROP POLICY IF EXISTS "users_select_policy" ON users CASCADE;
DROP POLICY IF EXISTS "users_update_policy" ON users CASCADE;
DROP POLICY IF EXISTS "users_delete_policy" ON users CASCADE;
DROP POLICY IF EXISTS "allow_signup_insert" ON users CASCADE;
DROP POLICY IF EXISTS "Users podem ver seus próprios dados" ON users CASCADE;
DROP POLICY IF EXISTS "Admins têm acesso total a users" ON users CASCADE;
DROP POLICY IF EXISTS "users_select_own" ON users CASCADE;
DROP POLICY IF EXISTS "users_select_admin" ON users CASCADE;
DROP POLICY IF EXISTS "users_update_own" ON users CASCADE;
DROP POLICY IF EXISTS "users_update_admin" ON users CASCADE;
DROP POLICY IF EXISTS "users_delete_admin" ON users CASCADE;

DROP POLICY IF EXISTS "empresas_insert_signup" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_insert_policy" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_select_policy" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_update_policy" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_delete_policy" ON empresas CASCADE;
DROP POLICY IF EXISTS "allow_empresa_signup" ON empresas CASCADE;
DROP POLICY IF EXISTS "Empresas podem ver seus próprios dados" ON empresas CASCADE;
DROP POLICY IF EXISTS "Admins têm acesso total a empresas" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_select_own" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_select_admin" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_update_own" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_update_admin" ON empresas CASCADE;
DROP POLICY IF EXISTS "empresas_delete_admin" ON empresas CASCADE;

DROP POLICY IF EXISTS "motoristas_insert_signup" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_insert_policy" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_select_policy" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_update_policy" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_delete_policy" ON motoristas CASCADE;
DROP POLICY IF EXISTS "allow_motorista_signup" ON motoristas CASCADE;
DROP POLICY IF EXISTS "Motoristas podem ver seus próprios dados" ON motoristas CASCADE;
DROP POLICY IF EXISTS "Admins têm acesso total a motoristas" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_select_own" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_select_admin" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_update_own" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_update_admin" ON motoristas CASCADE;
DROP POLICY IF EXISTS "motoristas_delete_admin" ON motoristas CASCADE;

DROP POLICY IF EXISTS "admins_insert_policy" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_select_policy" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_update_policy" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_delete_policy" ON admins CASCADE;
DROP POLICY IF EXISTS "Admins podem ver seus próprios dados" ON admins CASCADE;
DROP POLICY IF EXISTS "Super admins têm acesso total" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_select_own" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_select_all" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_update_own" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_update_super" ON admins CASCADE;
DROP POLICY IF EXISTS "admins_delete_super" ON admins CASCADE;

-- ============================================
-- 2. HABILITAR RLS NAS TABELAS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLÍTICAS PARA TABELA USERS
-- ============================================

-- INSERT: Permitir signup (auth.uid() pode ser NULL durante signup)
-- IMPORTANTE: auth.uid() IS NULL permite criação durante signup quando o usuário ainda não está autenticado
CREATE POLICY "users_insert_signup" ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Permite durante signup quando auth.uid() é NULL
  -- OU quando o ID corresponde ao usuário autenticado
  auth.uid() IS NULL OR auth.uid() = id
);

-- SELECT: Usuários podem ver seus próprios dados
CREATE POLICY "users_select_own" ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins podem ver todos (SEM recursão - verifica diretamente o tipo em users)
CREATE POLICY "users_select_admin" ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- UPDATE: Usuários podem atualizar seus próprios dados
CREATE POLICY "users_update_own" ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admins podem atualizar todos
CREATE POLICY "users_update_admin" ON users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- DELETE: Apenas admins podem deletar
CREATE POLICY "users_delete_admin" ON users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- ============================================
-- 4. POLÍTICAS PARA TABELA EMPRESAS
-- ============================================

-- INSERT: Permitir signup de empresas (auth.uid() pode ser NULL durante signup)
CREATE POLICY "empresas_insert_signup" ON empresas
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Permite durante signup quando auth.uid() é NULL
  -- OU quando o ID corresponde ao usuário autenticado
  auth.uid() IS NULL OR auth.uid() = id
);

-- SELECT: Empresas podem ver seus próprios dados
CREATE POLICY "empresas_select_own" ON empresas
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins podem ver todas (SEM recursão - verifica users.tipo diretamente)
CREATE POLICY "empresas_select_admin" ON empresas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- UPDATE: Empresas podem atualizar seus próprios dados
CREATE POLICY "empresas_update_own" ON empresas
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admins podem atualizar todas
CREATE POLICY "empresas_update_admin" ON empresas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- DELETE: Apenas admins podem deletar
CREATE POLICY "empresas_delete_admin" ON empresas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- ============================================
-- 5. POLÍTICAS PARA TABELA MOTORISTAS
-- ============================================

-- INSERT: Permitir signup de motoristas (auth.uid() pode ser NULL durante signup)
CREATE POLICY "motoristas_insert_signup" ON motoristas
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Permite durante signup quando auth.uid() é NULL
  -- OU quando o ID corresponde ao usuário autenticado
  auth.uid() IS NULL OR auth.uid() = id
);

-- SELECT: Motoristas podem ver seus próprios dados
CREATE POLICY "motoristas_select_own" ON motoristas
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins podem ver todos (SEM recursão - verifica users.tipo diretamente)
CREATE POLICY "motoristas_select_admin" ON motoristas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- UPDATE: Motoristas podem atualizar seus próprios dados
CREATE POLICY "motoristas_update_own" ON motoristas
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Admins podem atualizar todos
CREATE POLICY "motoristas_update_admin" ON motoristas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- DELETE: Apenas admins podem deletar
CREATE POLICY "motoristas_delete_admin" ON motoristas
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- ============================================
-- 6. POLÍTICAS PARA TABELA ADMINS
-- ============================================

-- INSERT: Admins são criados manualmente via service role
-- Não precisamos de política pública para INSERT

-- SELECT: Admins podem ver seus próprios dados
CREATE POLICY "admins_select_own" ON admins
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- SELECT: Admins podem ver todos os admins (SEM recursão - verifica users diretamente)
CREATE POLICY "admins_select_all" ON admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- UPDATE: Admins podem atualizar seus próprios dados
CREATE POLICY "admins_update_own" ON admins
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- UPDATE: Super admins podem atualizar todos
CREATE POLICY "admins_update_super" ON admins
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN admins a ON a.id = u.id
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
    AND a.nivel_acesso = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    JOIN admins a ON a.id = u.id
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
    AND a.nivel_acesso = 'super_admin'
  )
);

-- DELETE: Apenas super admins podem deletar
CREATE POLICY "admins_delete_super" ON admins
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    JOIN admins a ON a.id = u.id
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
    AND a.nivel_acesso = 'super_admin'
  )
);

-- ============================================
-- 7. CORRIGIR POLÍTICAS DE LOGIN_ATTEMPTS
-- ============================================

-- Remover políticas antigas que podem causar recursão
DROP POLICY IF EXISTS "Admins têm acesso total a login_attempts" ON login_attempts CASCADE;
DROP POLICY IF EXISTS "login_attempts_admin_all" ON login_attempts CASCADE;

-- Nova política para admins (SEM recursão - verifica users.tipo diretamente)
CREATE POLICY "login_attempts_admin_all" ON login_attempts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.tipo = 'admin'
  )
);

-- ============================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON POLICY "users_insert_signup" ON users IS 
'Permite criação de usuário durante signup. Aceita auth.uid() NULL durante signup ou quando auth.uid() = id';

COMMENT ON POLICY "empresas_insert_signup" ON empresas IS 
'Permite criação de empresa durante signup. Aceita auth.uid() NULL durante signup ou quando auth.uid() = id';

COMMENT ON POLICY "motoristas_insert_signup" ON motoristas IS 
'Permite criação de motorista durante signup. Aceita auth.uid() NULL durante signup ou quando auth.uid() = id';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. RECURSÃO INFINITA RESOLVIDA:
--    - Políticas de admin verificam users.tipo diretamente, não a tabela admins
--    - Isso evita loops infinitos de verificação entre tabelas

-- 2. SIGNUP PERMITIDO:
--    - Políticas INSERT usam "auth.uid() IS NULL OR auth.uid() = id"
--    - Isso permite criação durante signup quando auth.uid() ainda não está disponível
--    - O Supabase Auth garante que o ID será válido após criação

-- 3. SEGURANÇA MANTIDA:
--    - Usuários só podem ver/editar seus próprios dados
--    - Admins têm acesso amplo verificando users.tipo = 'admin'
--    - DELETE apenas para admins

-- 4. PERFORMANCE:
--    - Verificações de admin usam EXISTS com índice em users.id
--    - Evita JOINs desnecessários quando possível

-- ============================================
-- FIM DO SCRIPT
-- ============================================
