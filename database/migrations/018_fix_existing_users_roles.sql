-- ============================================
-- CORREÇÃO: ATRIBUIR ROLES PARA USUÁRIOS JÁ EXISTENTES
-- Migração 018: Corrigir usuários que foram cadastrados antes da migração 017
-- Data: 2024
-- ============================================

-- ============================================
-- 1. ATRIBUIR ROLE 'empresa' PARA EMPRESAS SEM ROLE
-- ============================================

DO $$
DECLARE
    v_role_empresa_id UUID;
    v_user_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Buscar ID da role 'empresa'
    SELECT id INTO v_role_empresa_id
    FROM roles
    WHERE slug = 'empresa';
    
    IF v_role_empresa_id IS NULL THEN
        RAISE WARNING 'Role "empresa" não encontrada. Pulando correção de empresas.';
    ELSE
        -- Para cada empresa que não tem a role 'empresa' atribuída
        FOR v_user_id IN 
            SELECT e.id
            FROM empresas e
            WHERE NOT EXISTS (
                SELECT 1 
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = e.id 
                AND r.slug = 'empresa'
            )
        LOOP
            -- Remover primary de outros roles (se houver)
            UPDATE user_roles
            SET is_primary = false
            WHERE user_id = v_user_id;
            
            -- Inserir role 'empresa' como primary
            INSERT INTO user_roles (user_id, role_id, is_primary)
            VALUES (v_user_id, v_role_empresa_id, true)
            ON CONFLICT (user_id, role_id)
            DO UPDATE SET is_primary = true;
            
            v_count := v_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Corrigidas % empresas sem role atribuída.', v_count;
    END IF;
END $$;

-- ============================================
-- 2. ATRIBUIR ROLE 'motorista' PARA MOTORISTAS SEM ROLE
-- ============================================

DO $$
DECLARE
    v_role_motorista_id UUID;
    v_user_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Buscar ID da role 'motorista'
    SELECT id INTO v_role_motorista_id
    FROM roles
    WHERE slug = 'motorista';
    
    IF v_role_motorista_id IS NULL THEN
        RAISE WARNING 'Role "motorista" não encontrada. Pulando correção de motoristas.';
    ELSE
        -- Para cada motorista que não tem a role 'motorista' atribuída
        FOR v_user_id IN 
            SELECT m.id
            FROM motoristas m
            WHERE NOT EXISTS (
                SELECT 1 
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = m.id 
                AND r.slug = 'motorista'
            )
        LOOP
            -- Remover primary de outros roles (se houver)
            UPDATE user_roles
            SET is_primary = false
            WHERE user_id = v_user_id;
            
            -- Inserir role 'motorista' como primary
            INSERT INTO user_roles (user_id, role_id, is_primary)
            VALUES (v_user_id, v_role_motorista_id, true)
            ON CONFLICT (user_id, role_id)
            DO UPDATE SET is_primary = true;
            
            v_count := v_count + 1;
        END LOOP;
        
        RAISE NOTICE 'Corrigidos % motoristas sem role atribuída.', v_count;
    END IF;
END $$;

-- ============================================
-- 3. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar quantas empresas ainda não têm role
SELECT 
    COUNT(*) as empresas_sem_role
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = e.id 
    AND r.slug = 'empresa'
);

-- Verificar quantos motoristas ainda não têm role
SELECT 
    COUNT(*) as motoristas_sem_role
FROM motoristas m
WHERE NOT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = m.id 
    AND r.slug = 'motorista'
);

-- ============================================
-- FIM DO SCRIPT
-- ============================================

