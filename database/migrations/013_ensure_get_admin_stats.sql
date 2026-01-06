-- ============================================
-- GARANTIR QUE get_admin_stats EXISTE
-- Migração 013: Recriar função get_admin_stats se não existir
-- Data: 2024
-- ============================================

-- Recriar função get_admin_stats
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
    total_usuarios_ativos BIGINT,
    campanhas_ativas BIGINT
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
        (SELECT COUNT(*) FROM users WHERE status = 'ativo')::BIGINT as total_usuarios_ativos,
        -- Campanhas ativas
        COALESCE((SELECT COUNT(*) FROM campanhas WHERE status = 'ativa')::BIGINT, 0) as campanhas_ativas;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

COMMENT ON FUNCTION get_admin_stats IS 'Retorna estatísticas gerais do sistema para o dashboard administrativo.';

