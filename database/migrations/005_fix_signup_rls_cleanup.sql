-- ============================================
-- LIMPEZA DE FUNÇÕES ANTIGAS
-- Execute este script ANTES de executar 005_fix_signup_rls.sql
-- se você receber erro de "function name is not unique"
-- ============================================

-- Remover todas as versões da função create_user_after_signup
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

-- Remover todas as versões da função create_admin_after_signup
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

-- Remover todas as versões da função confirm_user_email
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

-- ============================================
-- FIM DO SCRIPT DE LIMPEZA
-- ============================================