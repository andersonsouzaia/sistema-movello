-- ============================================
-- FUNÇÕES SQL PARA AÇÕES ADMINISTRATIVAS
-- Migração 006: Funções para aprovar/bloquear empresas e motoristas
-- Data: 2024
-- ============================================

-- ============================================
-- 1. FUNÇÃO PARA APROVAR EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION approve_empresa(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe e é do tipo empresa
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_user_id AND tipo = 'empresa'
    ) THEN
        RAISE EXCEPTION 'Usuário não encontrado ou não é uma empresa';
    END IF;

    -- Verificar se o admin existe
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_admin_id AND tipo = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;

    -- Atualizar status da empresa para 'ativa'
    UPDATE empresas
    SET 
        status = 'ativa',
        aprovado_em = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Atualizar status do usuário para 'ativo'
    UPDATE users
    SET 
        status = 'ativo',
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao aprovar empresa: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION approve_empresa(UUID, UUID) TO authenticated;

-- ============================================
-- 2. FUNÇÃO PARA BLOQUEAR EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION block_empresa(
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe e é do tipo empresa
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_user_id AND tipo = 'empresa'
    ) THEN
        RAISE EXCEPTION 'Usuário não encontrado ou não é uma empresa';
    END IF;

    -- Verificar se o admin existe
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_admin_id AND tipo = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;

    -- Atualizar status da empresa para 'bloqueada'
    UPDATE empresas
    SET 
        status = 'bloqueada',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

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

GRANT EXECUTE ON FUNCTION block_empresa(UUID, UUID, TEXT) TO authenticated;

-- ============================================
-- 3. FUNÇÃO PARA SUSPENDER EMPRESA
-- ============================================

CREATE OR REPLACE FUNCTION suspend_empresa(
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe e é do tipo empresa
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_user_id AND tipo = 'empresa'
    ) THEN
        RAISE EXCEPTION 'Usuário não encontrado ou não é uma empresa';
    END IF;

    -- Verificar se o admin existe
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_admin_id AND tipo = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;

    -- Atualizar status da empresa para 'suspensa'
    UPDATE empresas
    SET 
        status = 'suspensa',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

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

GRANT EXECUTE ON FUNCTION suspend_empresa(UUID, UUID, TEXT) TO authenticated;

-- ============================================
-- 4. FUNÇÃO PARA APROVAR MOTORISTA
-- ============================================

CREATE OR REPLACE FUNCTION approve_motorista(
    p_user_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe e é do tipo motorista
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_user_id AND tipo = 'motorista'
    ) THEN
        RAISE EXCEPTION 'Usuário não encontrado ou não é um motorista';
    END IF;

    -- Verificar se o admin existe
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_admin_id AND tipo = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;

    -- Atualizar status do motorista para 'aprovado'
    UPDATE motoristas
    SET 
        status = 'aprovado',
        aprovado_por = p_admin_id,
        aprovado_em = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

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

GRANT EXECUTE ON FUNCTION approve_motorista(UUID, UUID) TO authenticated;

-- ============================================
-- 5. FUNÇÃO PARA BLOQUEAR MOTORISTA
-- ============================================

CREATE OR REPLACE FUNCTION block_motorista(
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe e é do tipo motorista
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_user_id AND tipo = 'motorista'
    ) THEN
        RAISE EXCEPTION 'Usuário não encontrado ou não é um motorista';
    END IF;

    -- Verificar se o admin existe
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_admin_id AND tipo = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;

    -- Atualizar status do motorista para 'bloqueado'
    UPDATE motoristas
    SET 
        status = 'bloqueado',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

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

GRANT EXECUTE ON FUNCTION block_motorista(UUID, UUID, TEXT) TO authenticated;

-- ============================================
-- 6. FUNÇÃO PARA SUSPENDER MOTORISTA
-- ============================================

CREATE OR REPLACE FUNCTION suspend_motorista(
    p_user_id UUID,
    p_admin_id UUID,
    p_motivo TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Verificar se o usuário existe e é do tipo motorista
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_user_id AND tipo = 'motorista'
    ) THEN
        RAISE EXCEPTION 'Usuário não encontrado ou não é um motorista';
    END IF;

    -- Verificar se o admin existe
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = p_admin_id AND tipo = 'admin'
    ) THEN
        RAISE EXCEPTION 'Admin não encontrado';
    END IF;

    -- Atualizar status do motorista para 'suspenso'
    UPDATE motoristas
    SET 
        status = 'suspenso',
        motivo_bloqueio = p_motivo,
        updated_at = NOW()
    WHERE id = p_user_id;

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

GRANT EXECUTE ON FUNCTION suspend_motorista(UUID, UUID, TEXT) TO authenticated;

-- ============================================
-- 7. FUNÇÃO PARA OBTER ESTATÍSTICAS DO ADMIN
-- ============================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    total_empresas BIGINT,
    empresas_ativas BIGINT,
    empresas_pendentes BIGINT,
    empresas_bloqueadas BIGINT,
    total_motoristas BIGINT,
    motoristas_aprovados BIGINT,
    motoristas_pendentes BIGINT,
    motoristas_bloqueados BIGINT,
    total_usuarios_ativos BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Empresas
        (SELECT COUNT(*) FROM empresas)::BIGINT as total_empresas,
        (SELECT COUNT(*) FROM empresas WHERE status = 'ativa')::BIGINT as empresas_ativas,
        (SELECT COUNT(*) FROM empresas WHERE status = 'aguardando_aprovacao')::BIGINT as empresas_pendentes,
        (SELECT COUNT(*) FROM empresas WHERE status IN ('bloqueada', 'suspensa'))::BIGINT as empresas_bloqueadas,
        -- Motoristas
        (SELECT COUNT(*) FROM motoristas)::BIGINT as total_motoristas,
        (SELECT COUNT(*) FROM motoristas WHERE status = 'aprovado')::BIGINT as motoristas_aprovados,
        (SELECT COUNT(*) FROM motoristas WHERE status = 'aguardando_aprovacao')::BIGINT as motoristas_pendentes,
        (SELECT COUNT(*) FROM motoristas WHERE status IN ('bloqueado', 'suspenso'))::BIGINT as motoristas_bloqueados,
        -- Usuários ativos
        (SELECT COUNT(*) FROM users WHERE status = 'ativo')::BIGINT as total_usuarios_ativos;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- ============================================
-- 8. COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION approve_empresa IS 'Aprova uma empresa, alterando seu status para ativa e do usuário para ativo.';
COMMENT ON FUNCTION block_empresa IS 'Bloqueia uma empresa, alterando seu status para bloqueada e do usuário para bloqueado.';
COMMENT ON FUNCTION suspend_empresa IS 'Suspende uma empresa, alterando seu status para suspensa e do usuário para suspenso.';
COMMENT ON FUNCTION approve_motorista IS 'Aprova um motorista, alterando seu status para aprovado e do usuário para ativo.';
COMMENT ON FUNCTION block_motorista IS 'Bloqueia um motorista, alterando seu status para bloqueado e do usuário para bloqueado.';
COMMENT ON FUNCTION suspend_motorista IS 'Suspende um motorista, alterando seu status para suspenso e do usuário para suspenso.';
COMMENT ON FUNCTION get_admin_stats IS 'Retorna estatísticas gerais do sistema para o dashboard administrativo.';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

