-- ============================================
-- FIX CAMPANHAS DRAFT CONSTRAINT
-- Migração 040: Remove constraint NOT NULL de campos de localização para permitir rascunhos
-- ============================================

DO $$
BEGIN
    -- 1. Região (Causa do erro atual)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'regiao' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN regiao DROP NOT NULL;
    END IF;

    -- 2. Estado (Prevenção)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'estado' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN estado DROP NOT NULL;
    END IF;

    -- 3. Cidade (Prevenção)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'cidade' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN cidade DROP NOT NULL;
    END IF;

    -- 4. Bairro (Prevenção)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'bairro' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN bairro DROP NOT NULL;
    END IF;

    -- 5. Endereço (Prevenção)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'endereco' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN endereco DROP NOT NULL;
    END IF;

END $$;
