-- ============================================
-- CORREÇÃO DA FUNÇÃO approve_empresa
-- Migração 014: Garantir que a função existe e está acessível
-- O PostgREST ordena parâmetros alfabeticamente, então precisamos garantir
-- que a função seja encontrada independentemente da ordem
-- Data: 2024
-- ============================================

-- Remover todas as versões existentes da função
DROP FUNCTION IF EXISTS approve_empresa (UUID, UUID) CASCADE;

DROP FUNCTION IF EXISTS approve_empresa (
    p_admin_id UUID,
    p_user_id UUID
) CASCADE;

DROP FUNCTION IF EXISTS approve_empresa (
    p_user_id UUID,
    p_admin_id UUID
) CASCADE;

-- Recriar função com parâmetros nomeados explicitamente
-- PostgREST pode ordenar alfabeticamente, então vamos garantir compatibilidade
CREATE OR REPLACE FUNCTION approve_empresa(
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

    -- Atualizar status da empresa para 'ativa'
    UPDATE empresas
    SET 
        status = 'ativa',
        aprovado_em = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Empresa não encontrada na tabela empresas';
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
        RAISE EXCEPTION 'Erro ao aprovar empresa: %', SQLERRM;
END;
$$;

-- Garantir permissões
GRANT
EXECUTE ON FUNCTION approve_empresa (UUID, UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION approve_empresa (UUID, UUID) TO anon;

-- Comentário
COMMENT ON FUNCTION approve_empresa (UUID, UUID) IS 'Aprova uma empresa, alterando seu status para ativa e do usuário para ativo.';

-- Verificar se a função foi criada corretamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'approve_empresa'
    ) THEN
        RAISE EXCEPTION 'Função approve_empresa não foi criada corretamente';
    ELSE
        RAISE NOTICE 'Função approve_empresa criada com sucesso';
    END IF;
END $$;