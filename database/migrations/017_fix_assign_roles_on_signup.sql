-- ============================================
-- CORREÇÃO: ATRIBUIR ROLES AUTOMATICAMENTE NO SIGNUP
-- Migração 017: Modificar funções de signup para atribuir roles automaticamente
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CORRIGIR FUNÇÃO create_empresa_after_signup
-- ============================================

DROP FUNCTION IF EXISTS create_empresa_after_signup (
    p_user_id UUID,
    p_cnpj VARCHAR,
    p_razao_social VARCHAR,
    p_nome_fantasia VARCHAR,
    p_instagram VARCHAR,
    p_status VARCHAR
) CASCADE;

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
DECLARE
    v_role_id UUID;
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

    -- Atribuir role 'empresa' automaticamente
    SELECT id INTO v_role_id
    FROM roles
    WHERE slug = 'empresa';
    
    IF v_role_id IS NOT NULL THEN
        -- Remover primary de outros roles do usuário (se houver)
        UPDATE user_roles
        SET is_primary = false
        WHERE user_id = p_user_id;
        
        -- Inserir role 'empresa' como primary
        INSERT INTO user_roles (user_id, role_id, is_primary)
        VALUES (p_user_id, v_role_id, true)
        ON CONFLICT (user_id, role_id)
        DO UPDATE SET is_primary = true;
    ELSE
        RAISE WARNING 'Role "empresa" não encontrada. Usuário criado mas sem role atribuída.';
    END IF;

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
-- 2. CORRIGIR FUNÇÃO create_motorista_after_signup
-- ============================================

DROP FUNCTION IF EXISTS create_motorista_after_signup (
    p_user_id UUID,
    p_cpf VARCHAR,
    p_telefone VARCHAR,
    p_veiculo VARCHAR,
    p_placa VARCHAR,
    p_status VARCHAR
) CASCADE;

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
DECLARE
    v_role_id UUID;
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

    -- Atribuir role 'motorista' automaticamente
    SELECT id INTO v_role_id
    FROM roles
    WHERE slug = 'motorista';
    
    IF v_role_id IS NOT NULL THEN
        -- Remover primary de outros roles do usuário (se houver)
        UPDATE user_roles
        SET is_primary = false
        WHERE user_id = p_user_id;
        
        -- Inserir role 'motorista' como primary
        INSERT INTO user_roles (user_id, role_id, is_primary)
        VALUES (p_user_id, v_role_id, true)
        ON CONFLICT (user_id, role_id)
        DO UPDATE SET is_primary = true;
    ELSE
        RAISE WARNING 'Role "motorista" não encontrada. Usuário criado mas sem role atribuída.';
    END IF;

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
-- 3. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION create_empresa_after_signup IS 'Cria uma empresa após signup e atribui automaticamente a role "empresa" como primary';

COMMENT ON FUNCTION create_motorista_after_signup IS 'Cria um motorista após signup e atribui automaticamente a role "motorista" como primary';

-- ============================================
-- FIM DO SCRIPT
-- ============================================