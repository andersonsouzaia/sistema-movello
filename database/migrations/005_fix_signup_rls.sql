-- ============================================
-- CORREÇÃO DE RLS PARA SIGNUP E CRIAÇÃO DE ADMIN
-- Migração 005: Permite criação de usuários durante signup
-- Data: 2024
-- ============================================

-- ============================================
-- 0. REMOVER FUNÇÕES ANTIGAS (SE EXISTIREM)
-- ============================================

-- Remover todas as versões da função create_user_after_signup dinamicamente
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'create_user_after_signup'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Remover todas as versões da função create_admin_after_signup dinamicamente
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'create_admin_after_signup'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Remover todas as versões da função confirm_user_email dinamicamente
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'confirm_user_email'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Remover todas as versões da função create_empresa_after_signup dinamicamente
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'create_empresa_after_signup'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Remover todas as versões da função create_motorista_after_signup dinamicamente
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'create_motorista_after_signup'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- Remover todas as versões da função get_user_profile dinamicamente
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'get_user_profile'
    ) 
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

-- ============================================
-- 1. FUNÇÃO PARA CRIAR USUÁRIO APÓS SIGNUP
-- ============================================

-- Função com SECURITY DEFINER para permitir criação de usuário após signup
CREATE OR REPLACE FUNCTION create_user_after_signup(
    p_user_id UUID,
    p_email VARCHAR,
    p_nome VARCHAR,
    p_tipo VARCHAR,
    p_status VARCHAR DEFAULT 'ativo',
    p_telefone VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe em auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado em auth.users';
    END IF;

    -- Verificar se já existe registro em public.users
    IF EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        -- Se já existe, atualizar telefone se fornecido
        IF p_telefone IS NOT NULL THEN
            UPDATE public.users
            SET telefone = p_telefone, updated_at = NOW()
            WHERE id = p_user_id;
        END IF;
        RETURN TRUE;
    END IF;

    -- Inserir em public.users
    INSERT INTO public.users (id, email, nome, tipo, status, telefone)
    VALUES (p_user_id, p_email, p_nome, p_tipo, p_status, p_telefone);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar usuário: %', SQLERRM;
END;
$$;

-- Garantir que a função seja executável por authenticated e anon
GRANT
EXECUTE ON FUNCTION create_user_after_signup TO authenticated,
anon;

-- ============================================
-- 1.2. FUNÇÃO PARA CRIAR ADMIN APÓS SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION create_admin_after_signup(
    p_user_id UUID,
    p_nivel_acesso VARCHAR DEFAULT 'super_admin',
    p_ativo BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe em auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado em auth.users';
    END IF;

    -- Verificar se já existe registro em public.admins
    IF EXISTS (SELECT 1 FROM public.admins WHERE id = p_user_id) THEN
        -- Se já existe, apenas retornar sucesso (idempotente)
        RETURN TRUE;
    END IF;

    -- Inserir em public.admins
    INSERT INTO public.admins (id, nivel_acesso, ativo)
    VALUES (p_user_id, p_nivel_acesso, p_ativo);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar admin: %', SQLERRM;
END;
$$;

-- Garantir que a função seja executável por authenticated e anon
GRANT
EXECUTE ON FUNCTION create_admin_after_signup TO authenticated,
anon;

-- ============================================
-- 1.3. FUNÇÃO PARA CRIAR EMPRESA APÓS SIGNUP
-- ============================================

-- Função com SECURITY DEFINER para permitir criação de empresa após signup
-- Bypassa RLS para permitir inserção durante o processo de cadastro
CREATE OR REPLACE FUNCTION create_empresa_after_signup(
    p_user_id UUID,
    p_cnpj VARCHAR,
    p_razao_social VARCHAR,
    p_nome_fantasia VARCHAR DEFAULT NULL,
    p_instagram VARCHAR DEFAULT NULL,
    p_status VARCHAR DEFAULT 'aguardando_aprovacao'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe em auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado em auth.users';
    END IF;

    -- Verificar se já existe registro em public.empresas (idempotente)
    IF EXISTS (SELECT 1 FROM public.empresas WHERE id = p_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Inserir em public.empresas
    INSERT INTO public.empresas (id, cnpj, razao_social, nome_fantasia, instagram, status)
    VALUES (p_user_id, p_cnpj, p_razao_social, p_nome_fantasia, p_instagram, p_status);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar empresa: %', SQLERRM;
END;
$$;

-- Garantir que a função seja executável por authenticated e anon
GRANT
EXECUTE ON FUNCTION create_empresa_after_signup TO authenticated,
anon;

-- ============================================
-- 1.4. FUNÇÃO PARA CRIAR MOTORISTA APÓS SIGNUP
-- ============================================

-- Função com SECURITY DEFINER para permitir criação de motorista após signup
-- Bypassa RLS para permitir inserção durante o processo de cadastro
CREATE OR REPLACE FUNCTION create_motorista_after_signup(
    p_user_id UUID,
    p_cpf VARCHAR,
    p_telefone VARCHAR,
    p_veiculo VARCHAR,
    p_placa VARCHAR,
    p_status VARCHAR DEFAULT 'aguardando_aprovacao'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe em auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado em auth.users';
    END IF;

    -- Verificar se já existe registro em public.motoristas (idempotente)
    IF EXISTS (SELECT 1 FROM public.motoristas WHERE id = p_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Inserir em public.motoristas
    INSERT INTO public.motoristas (id, cpf, telefone, veiculo, placa, status)
    VALUES (p_user_id, p_cpf, p_telefone, p_veiculo, p_placa, p_status);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar motorista: %', SQLERRM;
END;
$$;

-- Garantir que a função seja executável por authenticated e anon
GRANT
EXECUTE ON FUNCTION create_motorista_after_signup TO authenticated,
anon;

-- ============================================
-- 1.5. FUNÇÃO PARA BUSCAR PERFIL DO USUÁRIO (BYPASS RLS)
-- ============================================

-- Função com SECURITY DEFINER para buscar perfil do usuário bypassando RLS
-- Necessária quando a sessão ainda não está completa após signup
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

-- Garantir que a função seja executável por authenticated e anon
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated, anon;

-- ============================================
-- 2. ATUALIZAR POLÍTICA RLS PARA USERS
-- ============================================

-- Remover política antiga
DROP POLICY IF EXISTS "users_insert_signup" ON users CASCADE;

-- Nova política: Permite INSERT quando:
-- 1. auth.uid() é NULL (signup anônimo)
-- 2. auth.uid() = id (usuário criando seu próprio registro)
-- 3. O ID existe em auth.users mas não em public.users (signup recém-criado)
CREATE POLICY "users_insert_signup" ON users FOR
INSERT
    TO anon,
    authenticated
WITH
    CHECK (
        -- Permite durante signup quando auth.uid() é NULL
        auth.uid () IS NULL
        -- OU quando o ID corresponde ao usuário autenticado
        OR auth.uid () = id
        -- OU quando o ID existe em auth.users (signup recém-criado)
        OR EXISTS (
            SELECT 1
            FROM auth.users au
            WHERE
                au.id = id
        )
    );

-- ============================================
-- 3. ATUALIZAR POLÍTICA RLS PARA EMPRESAS
-- ============================================

DROP POLICY IF EXISTS "empresas_insert_signup" ON empresas CASCADE;

CREATE POLICY "empresas_insert_signup" ON empresas FOR
INSERT
    TO anon,
    authenticated
WITH
    CHECK (
        auth.uid () IS NULL
        OR auth.uid () = id
        OR EXISTS (
            SELECT 1
            FROM auth.users au
            WHERE
                au.id = id
        )
    );

-- ============================================
-- 4. ATUALIZAR POLÍTICA RLS PARA MOTORISTAS
-- ============================================

DROP POLICY IF EXISTS "motoristas_insert_signup" ON motoristas CASCADE;

CREATE POLICY "motoristas_insert_signup" ON motoristas FOR
INSERT
    TO anon,
    authenticated
WITH
    CHECK (
        auth.uid () IS NULL
        OR auth.uid () = id
        OR EXISTS (
            SELECT 1
            FROM auth.users au
            WHERE
                au.id = id
        )
    );

-- ============================================
-- 5. ATUALIZAR POLÍTICA RLS PARA ADMINS
-- ============================================

DROP POLICY IF EXISTS "admins_insert_policy" ON admins CASCADE;

CREATE POLICY "admins_insert_policy" ON admins FOR
INSERT
    TO anon,
    authenticated
WITH
    CHECK (
        auth.uid () IS NULL
        OR auth.uid () = id
        OR EXISTS (
            SELECT 1
            FROM auth.users au
            WHERE
                au.id = id
        )
    );

-- ============================================
-- 6. FUNÇÃO PARA CONFIRMAR EMAIL AUTOMATICAMENTE
-- ============================================

-- Função para confirmar email de um usuário (apenas para admins criados via setup)
-- CORRIGIDO: Remove tentativa de atualizar email_confirmed_at em public.users (coluna não existe)
CREATE OR REPLACE FUNCTION confirm_user_email(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Atualizar email_confirmed_at apenas em auth.users
    UPDATE auth.users
    SET email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Atualizar updated_at em public.users (se existir registro)
    UPDATE public.users
    SET updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao confirmar email: %', SQLERRM;
END;
$$;

-- Garantir que a função seja executável por authenticated e anon
GRANT EXECUTE ON FUNCTION confirm_user_email TO authenticated, anon;

-- ============================================
-- 7. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION create_user_after_signup IS 'Cria registro em public.users após signup. Usa SECURITY DEFINER para bypass RLS.';

COMMENT ON FUNCTION create_admin_after_signup IS 'Cria registro em public.admins após signup. Usa SECURITY DEFINER para bypass RLS.';

COMMENT ON FUNCTION create_empresa_after_signup IS 'Cria registro em public.empresas após signup. Usa SECURITY DEFINER para bypass RLS. Permite inserção durante cadastro mesmo quando RLS bloqueia.';

COMMENT ON FUNCTION create_motorista_after_signup IS 'Cria registro em public.motoristas após signup. Usa SECURITY DEFINER para bypass RLS. Permite inserção durante cadastro mesmo quando RLS bloqueia.';

COMMENT ON FUNCTION get_user_profile IS 'Busca perfil do usuário bypassando RLS. Usa SECURITY DEFINER para permitir acesso mesmo quando sessão não está completa após signup.';

COMMENT ON FUNCTION confirm_user_email IS 'Confirma o email de um usuário automaticamente. Atualiza apenas auth.users.email_confirmed_at.';

COMMENT ON POLICY "users_insert_signup" ON users IS 'Permite criação de usuário durante signup. Aceita auth.uid() NULL, auth.uid() = id, ou ID existente em auth.users.';

-- ============================================
-- FIM DO SCRIPT
-- ============================================