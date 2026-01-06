-- ============================================
-- SISTEMA DE CONFIGURAÇÕES - MOVELLO
-- Migração 011: Sistema completo de configurações, templates e automações
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    chave VARCHAR(255) PRIMARY KEY,
    valor JSONB NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (
        tipo IN (
            'string',
            'number',
            'boolean',
            'json'
        )
    ),
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL DEFAULT 'geral',
    editavel BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Templates de Email
CREATE TABLE IF NOT EXISTS templates_email (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL UNIQUE,
    assunto VARCHAR(255) NOT NULL,
    corpo_html TEXT NOT NULL,
    corpo_texto TEXT,
    variaveis JSONB DEFAULT '[]'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Automações
CREATE TABLE IF NOT EXISTS automatizacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    trigger_evento VARCHAR(100) NOT NULL,
    condicoes JSONB DEFAULT '{}'::jsonb,
    acoes JSONB NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON configuracoes (categoria);

CREATE INDEX IF NOT EXISTS idx_configuracoes_editavel ON configuracoes (editavel);

CREATE INDEX IF NOT EXISTS idx_templates_email_ativo ON templates_email (ativo);

CREATE INDEX IF NOT EXISTS idx_templates_email_nome ON templates_email (nome);

CREATE INDEX IF NOT EXISTS idx_automatizacoes_ativo ON automatizacoes (ativo);

CREATE INDEX IF NOT EXISTS idx_automatizacoes_trigger ON automatizacoes (trigger_evento);

-- ============================================
-- 3. CRIAR TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em configuracoes
CREATE TRIGGER update_configuracoes_updated_at
    BEFORE UPDATE ON configuracoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em templates_email
CREATE TRIGGER update_templates_email_updated_at
    BEFORE UPDATE ON templates_email
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar updated_at em automatizacoes
CREATE TRIGGER update_automatizacoes_updated_at
    BEFORE UPDATE ON automatizacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. POPULAR CONFIGURAÇÕES PADRÃO
-- ============================================

INSERT INTO
    configuracoes (
        chave,
        valor,
        tipo,
        descricao,
        categoria,
        editavel
    )
VALUES (
        'sistema.nome',
        '"Movello"',
        'string',
        'Nome do sistema',
        'geral',
        true
    ),
    (
        'sistema.timezone',
        '"America/Sao_Paulo"',
        'string',
        'Timezone padrão',
        'geral',
        true
    ),
    (
        'sistema.idioma',
        '"pt-BR"',
        'string',
        'Idioma padrão',
        'geral',
        true
    ),
    (
        'sistema.manutencao',
        'false',
        'boolean',
        'Modo manutenção ativo',
        'geral',
        true
    ),
    (
        'campanhas.taxa_comissao_padrao',
        '10',
        'number',
        'Taxa de comissão padrão (%)',
        'campanhas',
        true
    ),
    (
        'campanhas.valor_minimo',
        '100',
        'number',
        'Valor mínimo de campanha (R$)',
        'campanhas',
        true
    ),
    (
        'campanhas.valor_maximo',
        '100000',
        'number',
        'Valor máximo de campanha (R$)',
        'campanhas',
        true
    ),
    (
        'campanhas.tempo_aprovacao_horas',
        '24',
        'number',
        'Tempo padrão para aprovação (horas)',
        'campanhas',
        true
    ),
    (
        'campanhas.formatos_midia_aceitos',
        '["image/jpeg", "image/png", "image/webp", "video/mp4"]',
        'json',
        'Formatos de mídia aceitos',
        'campanhas',
        true
    ),
    (
        'financeiro.taxa_comissao_plataforma',
        '15',
        'number',
        'Taxa de comissão da plataforma (%)',
        'financeiro',
        true
    ),
    (
        'financeiro.dias_para_repasse',
        '7',
        'number',
        'Dias para processar repasse',
        'financeiro',
        true
    ),
    (
        'financeiro.metodos_pagamento_aceitos',
        '["pix", "cartao", "boleto"]',
        'json',
        'Métodos de pagamento aceitos',
        'financeiro',
        true
    ),
    (
        'notificacoes.email_ativo',
        'true',
        'boolean',
        'Enviar notificações por email',
        'notificacoes',
        true
    ),
    (
        'notificacoes.sms_ativo',
        'false',
        'boolean',
        'Enviar notificações por SMS',
        'notificacoes',
        true
    ),
    (
        'seguranca.senha_minima_caracteres',
        '8',
        'number',
        'Mínimo de caracteres na senha',
        'seguranca',
        true
    ),
    (
        'seguranca.2fa_obrigatorio_admin',
        'true',
        'boolean',
        '2FA obrigatório para admins',
        'seguranca',
        true
    ),
    (
        'seguranca.sessao_timeout_minutos',
        '60',
        'number',
        'Timeout de sessão (minutos)',
        'seguranca',
        true
    ) ON CONFLICT (chave) DO NOTHING;

-- ============================================
-- 5. POPULAR TEMPLATES DE EMAIL PADRÃO
-- ============================================

INSERT INTO templates_email (nome, assunto, corpo_html, corpo_texto, variaveis, ativo) VALUES
    (
        'campanha_aprovada',
        'Sua campanha foi aprovada!',
        '<h1>Campanha Aprovada</h1><p>Olá {{nome_empresa}},</p><p>Sua campanha "{{titulo_campanha}}" foi aprovada e está ativa!</p>',
        'Campanha Aprovada\n\nOlá {{nome_empresa}},\n\nSua campanha "{{titulo_campanha}}" foi aprovada e está ativa!',
        '["nome_empresa", "titulo_campanha"]'::jsonb,
        true
    ),
    (
        'campanha_reprovada',
        'Campanha reprovada',
        '<h1>Campanha Reprovada</h1><p>Olá {{nome_empresa}},</p><p>Sua campanha "{{titulo_campanha}}" foi reprovada.</p><p>Motivo: {{motivo}}</p>',
        'Campanha Reprovada\n\nOlá {{nome_empresa}},\n\nSua campanha "{{titulo_campanha}}" foi reprovada.\n\nMotivo: {{motivo}}',
        '["nome_empresa", "titulo_campanha", "motivo"]'::jsonb,
        true
    ),
    (
        'ticket_criado',
        'Novo ticket de suporte criado',
        '<h1>Ticket Criado</h1><p>Seu ticket #{{ticket_id}} foi criado com sucesso.</p><p>Assunto: {{titulo}}</p>',
        'Ticket Criado\n\nSeu ticket #{{ticket_id}} foi criado com sucesso.\n\nAssunto: {{titulo}}',
        '["ticket_id", "titulo"]'::jsonb,
        true
    ),
    (
        'ticket_resolvido',
        'Seu ticket foi resolvido',
        '<h1>Ticket Resolvido</h1><p>Seu ticket #{{ticket_id}} foi resolvido.</p>',
        'Ticket Resolvido\n\nSeu ticket #{{ticket_id}} foi resolvido.',
        '["ticket_id"]'::jsonb,
        true
    ),
    (
        'pagamento_processado',
        'Pagamento processado',
        '<h1>Pagamento Processado</h1><p>Seu pagamento de R$ {{valor}} foi processado com sucesso.</p>',
        'Pagamento Processado\n\nSeu pagamento de R$ {{valor}} foi processado com sucesso.',
        '["valor"]'::jsonb,
        true
    ),
    (
        'repasse_processado',
        'Repasse processado',
        '<h1>Repasse Processado</h1><p>Seu repasse de R$ {{valor}} foi processado e está disponível.</p>',
        'Repasse Processado\n\nSeu repasse de R$ {{valor}} foi processado e está disponível.',
        '["valor"]'::jsonb,
        true
    )
ON CONFLICT (nome) DO NOTHING;

-- ============================================
-- 6. CONFIGURAR RLS (Row Level Security)
-- ============================================

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

ALTER TABLE templates_email ENABLE ROW LEVEL SECURITY;

ALTER TABLE automatizacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações
CREATE POLICY "Admins podem ver todas as configurações" ON configuracoes FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
            WHERE
                ur.user_id = auth.uid ()
                AND r.slug IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins podem atualizar configurações editáveis" ON configuracoes FOR
UPDATE TO authenticated USING (
    editavel = true
    AND EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN ('admin', 'super_admin')
    )
);

-- Políticas para templates_email
CREATE POLICY "Admins podem gerenciar templates" ON templates_email FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN ('admin', 'super_admin')
    )
);

-- Políticas para automatizacoes
CREATE POLICY "Admins podem gerenciar automações" ON automatizacoes FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN ('admin', 'super_admin')
    )
);