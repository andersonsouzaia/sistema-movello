-- ============================================
-- FIX CAMPANHA HORARIOS
-- Migração 041: Relaxa constraint NOT NULL de horario_inicio e horario_fim
-- ============================================

DO $$
BEGIN
    -- 1. Horário Início
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'horario_inicio' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN horario_inicio DROP NOT NULL;
    END IF;

    -- 2. Horário Fim
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campanhas' AND column_name = 'horario_fim' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE campanhas ALTER COLUMN horario_fim DROP NOT NULL;
    END IF;

END $$;
