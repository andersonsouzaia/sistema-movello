-- ============================================
-- FIX RLS RECURSION - BREAK LOCKS - V3
-- Migração 038: Reset radical das policies de users para quebrar loop infinito
-- Versão corrigida V3: Remove index de empresa_id (coluna inexistente) e usa 'tipo'
-- ============================================

-- Primeiro, desabilitar RLS temporariamente para recuperar o controle
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Derrubar TODAS as policies existentes da tabela users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Admin view all" ON users;
DROP POLICY IF EXISTS "User view own" ON users;
DROP POLICY IF EXISTS "Allow individual update own profile" ON users;
DROP POLICY IF EXISTS "Allow public read for login" ON users;
DROP POLICY IF EXISTS "Empresas podem ver seus membros" ON users;
-- Hard reset
DO $$ 
DECLARE 
    pol record; 
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'users' 
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname); 
    END LOOP; 
END $$;

-- Recriar função segura para check de admin (sem recursão na tabela users)
-- Corrigido: checa coluna 'tipo' e não role
CREATE OR REPLACE FUNCTION is_admin_bypassing_rls(user_uid UUID) 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
    -- Consulta direta simples, sem joins complexos
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_uid 
        AND tipo IN ('admin', 'super_admin')
    );
END;
$$;

-- Política 1: O próprio usuário pode ver seu perfil
CREATE POLICY "user_view_own_absolute" 
ON users 
FOR SELECT 
USING (id = auth.uid());

-- Política 2: O próprio usuário pode atualizar seu perfil
CREATE POLICY "user_update_own_absolute" 
ON users 
FOR UPDATE 
USING (id = auth.uid());

-- Política 3: Admin pode ver tudo (Usando função Security Definer)
CREATE POLICY "admin_view_all_secure" 
ON users 
FOR SELECT 
USING (is_admin_bypassing_rls(auth.uid()));

-- Política 4: Permitir insert durante signup
CREATE POLICY "allow_insert_during_auth" 
ON users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Reabilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Index corrigido para 'tipo' (removido index invalido de empresa_id)
CREATE INDEX IF NOT EXISTS idx_users_tipo ON users(tipo);
