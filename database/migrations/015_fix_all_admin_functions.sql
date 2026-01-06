-- ============================================
-- CORREÇÃO DE TODAS AS FUNÇÕES ADMINISTRATIVAS
-- Migração 015: Corrigir ordem de parâmetros para todas as funções admin
-- PostgREST ordena parâmetros alfabeticamente
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CORRIGIR block_empresa
-- ============================================

DROP FUNCTION IF EXISTS block_empresa (UUID, UUID, TEXT) CASCADE;

DROP FUNCTION IF EXISTS block_empresa (
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT
) CASCADE;

DROP FUNCTION IF EXISTS block_empresa (
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT
) CASCADE;

CREATE OR REPLACE FUNCTION block_empresa(
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_tipo TEXT;
    v_admin_tipo TEXT;
BEGIN
    -- Verificar se o usuário existe e é do tipo empresa
    SELECT tipo INTO v_user_tipo
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_tipo IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    IF v_user_tipo != 'empresa' THEN
        RAISE EXCEPTION 'Usuário não é uma empresa';
    END IF;

    -- Verificar se o admin existe
    SELECT tipo INTO v_admin_tipo
    FROM users
    WHERE id = p_admin_id;
    
    IF v_admin_tipo IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;
    
    IF v_admin_tipo != 'admin' THEN
        RAISE EXCEPTION 'Usuário não é um admin';
    END IF;

    -- Atualizar status da empresa para 'bloqueada'
    UPDATE empresas
    SET 
        status = 'bloqueada',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empresa não encontrada na tabela empresas';
    END IF;

    -- Atualizar status do usuário para 'bloqueado'
    UPDATE users
    SET 
        status = 'bloqueado',
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao bloquear empresa: %', SQLERRM;
END;
$$;

GRANT
EXECUTE ON FUNCTION block_empresa (UUID, UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION block_empresa (UUID, UUID, TEXT) TO anon;

-- ============================================
-- 2. CORRIGIR suspend_empresa
-- ============================================

DROP FUNCTION IF EXISTS suspend_empresa (UUID, UUID, TEXT) CASCADE;

DROP FUNCTION IF EXISTS suspend_empresa (
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT
) CASCADE;

DROP FUNCTION IF EXISTS suspend_empresa (
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT
) CASCADE;

CREATE OR REPLACE FUNCTION suspend_empresa(
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_tipo TEXT;
    v_admin_tipo TEXT;
BEGIN
    -- Verificar se o usuário existe e é do tipo empresa
    SELECT tipo INTO v_user_tipo
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_tipo IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    IF v_user_tipo != 'empresa' THEN
        RAISE EXCEPTION 'Usuário não é uma empresa';
    END IF;

    -- Verificar se o admin existe
    SELECT tipo INTO v_admin_tipo
    FROM users
    WHERE id = p_admin_id;
    
    IF v_admin_tipo IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;
    
    IF v_admin_tipo != 'admin' THEN
        RAISE EXCEPTION 'Usuário não é um admin';
    END IF;

    -- Atualizar status da empresa para 'suspensa'
    UPDATE empresas
    SET 
        status = 'suspensa',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empresa não encontrada na tabela empresas';
    END IF;

    -- Atualizar status do usuário para 'suspenso'
    UPDATE users
    SET 
        status = 'suspenso',
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao suspender empresa: %', SQLERRM;
END;
$$;

GRANT
EXECUTE ON FUNCTION suspend_empresa (UUID, UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION suspend_empresa (UUID, UUID, TEXT) TO anon;

-- ============================================
-- 3. CORRIGIR approve_motorista
-- ============================================

DROP FUNCTION IF EXISTS approve_motorista (UUID, UUID) CASCADE;

DROP FUNCTION IF EXISTS approve_motorista (
    p_admin_id UUID,
    p_user_id UUID
) CASCADE;

DROP FUNCTION IF EXISTS approve_motorista (
    p_user_id UUID,
    p_admin_id UUID
) CASCADE;

CREATE OR REPLACE FUNCTION approve_motorista(
    p_admin_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_tipo TEXT;
    v_admin_tipo TEXT;
BEGIN
    -- Verificar se o usuário existe e é do tipo motorista
    SELECT tipo INTO v_user_tipo
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_tipo IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    IF v_user_tipo != 'motorista' THEN
        RAISE EXCEPTION 'Usuário não é um motorista';
    END IF;

    -- Verificar se o admin existe
    SELECT tipo INTO v_admin_tipo
    FROM users
    WHERE id = p_admin_id;
    
    IF v_admin_tipo IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;
    
    IF v_admin_tipo != 'admin' THEN
        RAISE EXCEPTION 'Usuário não é um admin';
    END IF;

    -- Atualizar status do motorista para 'aprovado'
    UPDATE motoristas
    SET 
        status = 'aprovado',
        aprovado_por = p_admin_id,
        aprovado_em = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Motorista não encontrado na tabela motoristas';
    END IF;

    -- Atualizar status do usuário para 'ativo'
    UPDATE users
    SET 
        status = 'ativo',
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao aprovar motorista: %', SQLERRM;
END;
$$;

GRANT
EXECUTE ON FUNCTION approve_motorista (UUID, UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION approve_motorista (UUID, UUID) TO anon;

-- ============================================
-- 4. CORRIGIR block_motorista
-- ============================================

DROP FUNCTION IF EXISTS block_motorista (UUID, UUID, TEXT) CASCADE;

DROP FUNCTION IF EXISTS block_motorista (
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT
) CASCADE;

DROP FUNCTION IF EXISTS block_motorista (
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT
) CASCADE;

CREATE OR REPLACE FUNCTION block_motorista(
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_tipo TEXT;
    v_admin_tipo TEXT;
BEGIN
    -- Verificar se o usuário existe e é do tipo motorista
    SELECT tipo INTO v_user_tipo
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_tipo IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    IF v_user_tipo != 'motorista' THEN
        RAISE EXCEPTION 'Usuário não é um motorista';
    END IF;

    -- Verificar se o admin existe
    SELECT tipo INTO v_admin_tipo
    FROM users
    WHERE id = p_admin_id;
    
    IF v_admin_tipo IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;
    
    IF v_admin_tipo != 'admin' THEN
        RAISE EXCEPTION 'Usuário não é um admin';
    END IF;

    -- Atualizar status do motorista para 'bloqueado'
    UPDATE motoristas
    SET 
        status = 'bloqueado',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Motorista não encontrado na tabela motoristas';
    END IF;

    -- Atualizar status do usuário para 'bloqueado'
    UPDATE users
    SET 
        status = 'bloqueado',
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao bloquear motorista: %', SQLERRM;
END;
$$;

GRANT
EXECUTE ON FUNCTION block_motorista (UUID, UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION block_motorista (UUID, UUID, TEXT) TO anon;

-- ============================================
-- 5. CORRIGIR suspend_motorista
-- ============================================

DROP FUNCTION IF EXISTS suspend_motorista (UUID, UUID, TEXT) CASCADE;

DROP FUNCTION IF EXISTS suspend_motorista (
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT
) CASCADE;

DROP FUNCTION IF EXISTS suspend_motorista (
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT
) CASCADE;

CREATE OR REPLACE FUNCTION suspend_motorista(
    p_admin_id UUID,
    p_user_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_tipo TEXT;
    v_admin_tipo TEXT;
BEGIN
    -- Verificar se o usuário existe e é do tipo motorista
    SELECT tipo INTO v_user_tipo
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_tipo IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    IF v_user_tipo != 'motorista' THEN
        RAISE EXCEPTION 'Usuário não é um motorista';
    END IF;

    -- Verificar se o admin existe
    SELECT tipo INTO v_admin_tipo
    FROM users
    WHERE id = p_admin_id;
    
    IF v_admin_tipo IS NULL THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;
    
    IF v_admin_tipo != 'admin' THEN
        RAISE EXCEPTION 'Usuário não é um admin';
    END IF;

    -- Atualizar status do motorista para 'suspenso'
    UPDATE motoristas
    SET 
        status = 'suspenso',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Motorista não encontrado na tabela motoristas';
    END IF;

    -- Atualizar status do usuário para 'suspenso'
    UPDATE users
    SET 
        status = 'suspenso',
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao suspender motorista: %', SQLERRM;
END;
$$;

GRANT
EXECUTE ON FUNCTION suspend_motorista (UUID, UUID, TEXT) TO authenticated;

GRANT
EXECUTE ON FUNCTION suspend_motorista (UUID, UUID, TEXT) TO anon;

-- ============================================
-- 6. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION approve_empresa (UUID, UUID) IS 'Aprova uma empresa, alterando seu status para ativa e do usuário para ativo.';

COMMENT ON FUNCTION block_empresa (UUID, UUID, TEXT) IS 'Bloqueia uma empresa, alterando seu status para bloqueada e do usuário para bloqueado.';

COMMENT ON FUNCTION suspend_empresa (UUID, UUID, TEXT) IS 'Suspende uma empresa, alterando seu status para suspensa e do usuário para suspenso.';

COMMENT ON FUNCTION approve_motorista (UUID, UUID) IS 'Aprova um motorista, alterando seu status para aprovado e do usuário para ativo.';

COMMENT ON FUNCTION block_motorista (UUID, UUID, TEXT) IS 'Bloqueia um motorista, alterando seu status para bloqueado e do usuário para bloqueado.';

COMMENT ON FUNCTION suspend_motorista (UUID, UUID, TEXT) IS 'Suspende um motorista, alterando seu status para suspenso e do usuário para suspenso.';

-- ============================================
-- FIM DO SCRIPT
-- ============================================