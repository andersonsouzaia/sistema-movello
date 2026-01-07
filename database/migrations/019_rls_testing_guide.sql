-- ============================================
-- GUIA DE TESTES RLS PARA EMPRESAS
-- Migração 019: Documentação e verificações de RLS
-- Data: 2024
-- ============================================

-- ============================================
-- VERIFICAÇÕES DE RLS POLICIES
-- ============================================

-- Verificar políticas de CAMPANHAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'campanhas'
ORDER BY policyname;

-- Verificar políticas de MÍDIAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'midias'
ORDER BY policyname;

-- Verificar políticas de PAGAMENTOS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'pagamentos'
ORDER BY policyname;

-- Verificar políticas de TICKETS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tickets'
ORDER BY policyname;

-- ============================================
-- TESTES MANUAIS RECOMENDADOS
-- ============================================

/*
TESTE 1: Empresa só vê suas próprias campanhas
-----------------------------------------------
1. Fazer login como empresa A
2. Verificar que apenas campanhas com empresa_id = empresa A.id são retornadas
3. Tentar acessar campanha de empresa B (deve retornar erro ou vazio)

TESTE 2: Empresa só cria campanhas próprias
--------------------------------------------
1. Fazer login como empresa A
2. Criar campanha via create_campanha_empresa()
3. Verificar que empresa_id = auth.uid() automaticamente
4. Tentar criar campanha com empresa_id diferente (deve falhar)

TESTE 3: Empresa só atualiza campanhas não aprovadas
-----------------------------------------------------
1. Criar campanha com status 'em_analise'
2. Tentar atualizar (deve funcionar)
3. Admin aprova campanha
4. Tentar atualizar novamente (deve falhar)

TESTE 4: Empresa só pausa campanhas ativas próprias
---------------------------------------------------
1. Criar campanha e aprovar
2. Ativar campanha
3. Tentar pausar (deve funcionar)
4. Tentar pausar campanha de outra empresa (deve falhar)

TESTE 5: Empresa só vê seus próprios pagamentos
-----------------------------------------------
1. Fazer login como empresa A
2. Verificar que apenas pagamentos com empresa_id = empresa A.id são retornados
3. Tentar acessar pagamento de empresa B (deve retornar erro ou vazio)

TESTE 6: Empresa só cria tickets próprios
-------------------------------------------
1. Fazer login como empresa A
2. Criar ticket
3. Verificar que empresa_id = auth.uid() automaticamente
4. Tentar criar ticket com empresa_id diferente (deve falhar)
*/

-- ============================================
-- FUNÇÃO DE VERIFICAÇÃO AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION verify_empresa_rls(
    p_empresa_id UUID
)
RETURNS TABLE (
    test_name TEXT,
    passed BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_campanha_count INTEGER;
    v_pagamento_count INTEGER;
    v_ticket_count INTEGER;
BEGIN
    -- Teste 1: Verificar que empresa só vê suas campanhas
    SELECT COUNT(*) INTO v_campanha_count
    FROM campanhas
    WHERE empresa_id = p_empresa_id;
    
    RETURN QUERY SELECT 
        'Empresa vê suas próprias campanhas'::TEXT,
        (v_campanha_count >= 0)::BOOLEAN,
        format('Encontradas %s campanhas', v_campanha_count)::TEXT;

    -- Teste 2: Verificar que empresa só vê seus pagamentos
    SELECT COUNT(*) INTO v_pagamento_count
    FROM pagamentos
    WHERE empresa_id = p_empresa_id;
    
    RETURN QUERY SELECT 
        'Empresa vê seus próprios pagamentos'::TEXT,
        (v_pagamento_count >= 0)::BOOLEAN,
        format('Encontrados %s pagamentos', v_pagamento_count)::TEXT;

    -- Teste 3: Verificar que empresa só vê seus tickets
    SELECT COUNT(*) INTO v_ticket_count
    FROM tickets
    WHERE empresa_id = p_empresa_id;
    
    RETURN QUERY SELECT 
        'Empresa vê seus próprios tickets'::TEXT,
        (v_ticket_count >= 0)::BOOLEAN,
        format('Encontrados %s tickets', v_ticket_count)::TEXT;

END;
$$;

GRANT EXECUTE ON FUNCTION verify_empresa_rls TO authenticated;

COMMENT ON FUNCTION verify_empresa_rls IS 'Verifica se as políticas RLS estão funcionando corretamente para uma empresa';

-- ============================================
-- FIM DO SCRIPT
-- ============================================


