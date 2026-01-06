-- ============================================
-- CORREÇÃO DE COLUNAS criado_em
-- Migração 012: Adicionar coluna criado_em se não existir
-- Data: 2024
-- ============================================

-- Verificar e adicionar criado_em em campanhas se não existir
DO $$
BEGIN
    -- Adicionar coluna se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'campanhas' AND column_name = 'criado_em'
    ) THEN
        ALTER TABLE campanhas ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Atualizar registros existentes
        -- Tentar usar atualizado_em se existir, senão usar NOW()
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'campanhas' AND column_name = 'atualizado_em'
        ) THEN
            EXECUTE 'UPDATE campanhas SET criado_em = COALESCE(atualizado_em, NOW()) WHERE criado_em IS NULL';
        ELSE
            UPDATE campanhas SET criado_em = NOW() WHERE criado_em IS NULL;
        END IF;
    END IF;
END $$;

-- Verificar e adicionar criado_em em tickets se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'criado_em'
    ) THEN
        ALTER TABLE tickets ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Atualizar registros existentes (se houver created_at)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tickets' AND column_name = 'created_at'
        ) THEN
            UPDATE tickets SET criado_em = created_at WHERE criado_em IS NULL;
        ELSE
            UPDATE tickets SET criado_em = NOW() WHERE criado_em IS NULL;
        END IF;
    END IF;
END $$;

-- Verificar e adicionar criado_em em ticket_comentarios se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticket_comentarios' AND column_name = 'criado_em'
    ) THEN
        ALTER TABLE ticket_comentarios ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Atualizar registros existentes (se houver created_at)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'ticket_comentarios' AND column_name = 'created_at'
        ) THEN
            UPDATE ticket_comentarios SET criado_em = created_at WHERE criado_em IS NULL;
        ELSE
            UPDATE ticket_comentarios SET criado_em = NOW() WHERE criado_em IS NULL;
        END IF;
    END IF;
END $$;

-- Restaurar o order() nos serviços após executar esta migração
-- Os serviços foram temporariamente modificados para não usar .order('criado_em')
-- Após executar esta migração, você pode restaurar o .order() nos arquivos:
-- - src/services/campanhaService.ts
-- - src/services/ticketService.ts