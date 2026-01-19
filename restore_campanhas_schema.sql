-- ============================================
-- SISTEMA DE CAMPANHAS - MOVELLO
-- Script de Restauração e Otimização
-- Inclui criação de tabelas (se não existirem) e índices de performance
-- ============================================

-- 1. CRIAR TABELAS (Recuperação de Schema)
CREATE TABLE IF NOT EXISTS campanhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    empresa_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    orcamento DECIMAL(10, 2) NOT NULL DEFAULT 0,
    orcamento_utilizado DECIMAL(10, 2) NOT NULL DEFAULT 0,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'em_analise' CHECK (
        status IN (
            'em_analise',
            'aprovada',
            'reprovada',
            'ativa',
            'pausada',
            'finalizada',
            'cancelada'
        )
    ),
    aprovado_por UUID REFERENCES users (id) ON DELETE SET NULL,
    aprovado_em TIMESTAMP WITH TIME ZONE,
    motivo_reprovacao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GARANTIR QUE A COLUNA ORCAMENTO EXISTA (Caso a tabela já existisse sem ela)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campanhas' AND column_name = 'orcamento') THEN
        ALTER TABLE campanhas ADD COLUMN orcamento DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campanhas' AND column_name = 'orcamento_utilizado') THEN
        ALTER TABLE campanhas ADD COLUMN orcamento_utilizado DECIMAL(10, 2) NOT NULL DEFAULT 0;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS midias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    campanha_id UUID NOT NULL REFERENCES campanhas (id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('imagem', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'em_analise' CHECK (
        status IN (
            'em_analise',
            'aprovada',
            'reprovada'
        )
    ),
    aprovado_por UUID REFERENCES users (id) ON DELETE SET NULL,
    aprovado_em TIMESTAMP WITH TIME ZONE,
    motivo_reprovacao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campanha_metricas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    campanha_id UUID NOT NULL REFERENCES campanhas (id) ON DELETE CASCADE,
    data DATE NOT NULL,
    visualizacoes INTEGER NOT NULL DEFAULT 0,
    cliques INTEGER NOT NULL DEFAULT 0,
    conversoes INTEGER NOT NULL DEFAULT 0,
    valor_gasto DECIMAL(10, 2) NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (campanha_id, data)
);

-- 2. ÍNDICES DE PERFORMANCE (Scalability)

-- Campanhas
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas(status);
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa_id ON campanhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_data_inicio ON campanhas(data_inicio);
CREATE INDEX IF NOT EXISTS idx_campanhas_orcamento ON campanhas(orcamento);
CREATE INDEX IF NOT EXISTS idx_campanhas_data_fim ON campanhas (data_fim);
CREATE INDEX IF NOT EXISTS idx_campanhas_aprovado_por ON campanhas (aprovado_por);

-- Midias
CREATE INDEX IF NOT EXISTS idx_midias_campanha ON midias (campanha_id);
CREATE INDEX IF NOT EXISTS idx_midias_status ON midias (status);
CREATE INDEX IF NOT EXISTS idx_midias_ordem ON midias (campanha_id, ordem);

-- Metricas
CREATE INDEX IF NOT EXISTS idx_campanha_metricas_campanha ON campanha_metricas (campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanha_metricas_data ON campanha_metricas (data);

-- Audit Logs (Se a tabela existir)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
