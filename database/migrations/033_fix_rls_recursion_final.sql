-- ============================================
-- CORREÇÃO DE RECURSÃO RLS - FINAL
-- Migração 033: Resolve timeout no login causado por recursão RLS
-- ============================================

-- 1. CLASSIFICAR FUNÇÃO HELPER DE SEGURANÇA
-- Esta função verifica se um usuário é admin SEM disparar checagens RLS recursivas
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND tipo = 'admin'
  );
$$;

-- Grant execute to everyone (it returns boolean, safe)
GRANT EXECUTE ON FUNCTION public.is_admin TO public, anon, authenticated;


-- 2. SUBSTITUIR POLÍTICAS NA TABELA USERS
-- O problema principal: "users_select_admin" consultava "users" dentro da política
-- Agora usamos a função is_admin() que é SECURITY DEFINER

DROP POLICY IF EXISTS "users_select_admin" ON users;
CREATE POLICY "users_select_admin" ON users
FOR SELECT
TO authenticated
USING (
    public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "users_update_admin" ON users;
CREATE POLICY "users_update_admin" ON users
FOR UPDATE
TO authenticated
USING (
    public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin" ON users
FOR DELETE
TO authenticated
USING (
    public.is_admin(auth.uid())
);


-- 3. SUBSTITUIR POLÍTICAS EM OUTRAS TABELAS (Prevenção)
-- Aplicar a mesma lógica para Empresas e Motoristas

-- Empresas
DROP POLICY IF EXISTS "empresas_select_admin" ON empresas;
CREATE POLICY "empresas_select_admin" ON empresas
FOR SELECT
TO authenticated
USING (
    public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "empresas_update_admin" ON empresas;
CREATE POLICY "empresas_update_admin" ON empresas
FOR UPDATE
TO authenticated
USING (
    public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "empresas_delete_admin" ON empresas;
CREATE POLICY "empresas_delete_admin" ON empresas
FOR DELETE
TO authenticated
USING (
    public.is_admin(auth.uid())
);

-- Motoristas
DROP POLICY IF EXISTS "motoristas_select_admin" ON motoristas;
CREATE POLICY "motoristas_select_admin" ON motoristas
FOR SELECT
TO authenticated
USING (
    public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "motoristas_update_admin" ON motoristas;
CREATE POLICY "motoristas_update_admin" ON motoristas
FOR UPDATE
TO authenticated
USING (
    public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "motoristas_delete_admin" ON motoristas;
CREATE POLICY "motoristas_delete_admin" ON motoristas
FOR DELETE
TO authenticated
USING (
    public.is_admin(auth.uid())
);


-- 4. REFORÇO DA FUNÇÃO RPC (Apenas para garantir)
CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    tipo VARCHAR,
    email VARCHAR,
    nome VARCHAR,
    telefone VARCHAR,
    avatar_url VARCHAR,
    status VARCHAR,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.tipo,
        u.email,
        u.nome,
        u.telefone,
        u.avatar_url,
        u.status,
        u.ultimo_acesso,
        u.created_at,
        u.updated_at
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$;
