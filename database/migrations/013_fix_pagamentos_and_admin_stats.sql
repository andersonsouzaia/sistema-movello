-- ============================================
-- CORREÇÃO DE COLUNAS criado_em E FUNÇÃO get_admin_stats
-- Migração 013: Adicionar colunas criado_em se não existirem e criar função get_admin_stats
-- Data: 2024
-- ============================================

-- ============================================
-- 1. VERIFICAR E ADICIONAR criado_em EM pagamentos
-- ============================================
DO $$
BEGIN
    -- Adicionar coluna se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'pagamentos' AND column_name = 'criado_em'
    ) THEN
        ALTER TABLE pagamentos ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Atualizar registros existentes
        -- Tentar usar atualizado_em se existir, senão usar NOW()
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'pagamentos' AND column_name = 'atualizado_em'
        ) THEN
            EXECUTE 'UPDATE pagamentos SET criado_em = COALESCE(atualizado_em, NOW()) WHERE criado_em IS NULL';
        ELSE
            UPDATE pagamentos SET criado_em = NOW() WHERE criado_em IS NULL;
        END IF;
        
        RAISE NOTICE 'Coluna criado_em adicionada à tabela pagamentos';
    ELSE
        RAISE NOTICE 'Coluna criado_em já existe na tabela pagamentos';
    END IF;
END $$;

-- ============================================
-- 2. VERIFICAR E ADICIONAR criado_em EM repasses
-- ============================================
DO $$
BEGIN
    -- Adicionar coluna se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'repasses' AND column_name = 'criado_em'
    ) THEN
        ALTER TABLE repasses ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Atualizar registros existentes
        -- Tentar usar atualizado_em se existir, senão usar NOW()
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'repasses' AND column_name = 'atualizado_em'
        ) THEN
            EXECUTE 'UPDATE repasses SET criado_em = COALESCE(atualizado_em, NOW()) WHERE criado_em IS NULL';
        ELSE
            UPDATE repasses SET criado_em = NOW() WHERE criado_em IS NULL;
        END IF;
        
        RAISE NOTICE 'Coluna criado_em adicionada à tabela repasses';
    ELSE
        RAISE NOTICE 'Coluna criado_em já existe na tabela repasses';
    END IF;
END $$;

-- ============================================
-- 3. VERIFICAR E ADICIONAR criado_em EM transacoes
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transacoes' AND column_name = 'criado_em'
    ) THEN
        ALTER TABLE transacoes ADD COLUMN criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Atualizar registros existentes
        UPDATE transacoes SET criado_em = NOW() WHERE criado_em IS NULL;
        
        RAISE NOTICE 'Coluna criado_em adicionada à tabela transacoes';
    ELSE
        RAISE NOTICE 'Coluna criado_em já existe na tabela transacoes';
    END IF;
END $$;

-- ============================================
-- 4. CRIAR FUNÇÃO get_admin_stats SE NÃO EXISTIR
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

-- ============================================
-- 5. CONCEDER PERMISSÕES
-- ============================================
GRANT EXECUTE ON FUNCTION get_admin_stats () TO authenticated;

GRANT EXECUTE ON FUNCTION get_admin_stats () TO anon;

-- ============================================
-- 6. COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION get_admin_stats () IS 'Retorna estatísticas administrativas do sistema';