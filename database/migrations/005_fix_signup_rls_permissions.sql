-- ============================================
-- CORREÇÃO DE PERMISSÕES PARA FUNÇÕES DE SIGNUP
-- Execute este script se já executou a migração 005 anteriormente
-- Data: 2024
-- ============================================

-- Garantir que as funções sejam executáveis por authenticated e anon
GRANT EXECUTE ON FUNCTION create_user_after_signup TO authenticated, anon;
GRANT EXECUTE ON FUNCTION confirm_user_email TO authenticated, anon;

-- Verificar se as funções existem e têm SECURITY DEFINER
SELECT 
    p.proname as function_name,
    p.prosecdef as security_definer,
    CASE WHEN p.prosecdef THEN 'SIM' ELSE 'NÃO' END as tem_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('create_user_after_signup', 'confirm_user_email');

-- ============================================
-- FIM DO SCRIPT
-- ============================================

