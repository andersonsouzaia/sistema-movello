-- ============================================
-- SISTEMA DE TICKETS DE SUPORTE - MOVELLO
-- Migração 009: Sistema completo de tickets e tags
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Tabela de Tags (usada para tickets e campanhas)
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    tipo_recurso VARCHAR(50) NOT NULL CHECK (
        tipo_recurso IN (
            'tickets',
            'campanhas',
            'ambos'
        )
    ),
    criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (nome, tipo_recurso)
);

-- Tabela de Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    empresa_id UUID REFERENCES users (id) ON DELETE SET NULL,
    motorista_id UUID REFERENCES users (id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'aberto' CHECK (
        status IN (
            'aberto',
            'em_andamento',
            'resolvido',
            'fechado'
        )
    ),
    prioridade VARCHAR(50) NOT NULL DEFAULT 'media' CHECK (
        prioridade IN (
            'baixa',
            'media',
            'alta',
            'urgente'
        )
    ),
    atribuido_a UUID REFERENCES users (id) ON DELETE SET NULL,
    criado_por UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    resolvido_por UUID REFERENCES users (id) ON DELETE SET NULL,
    resolvido_em TIMESTAMP
    WITH
        TIME ZONE,
        tempo_resposta INTERVAL,
        tempo_resolucao INTERVAL,
        criado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        atualizado_em TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Comentários de Tickets
CREATE TABLE IF NOT EXISTS ticket_comentarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    anexos JSONB DEFAULT '[]'::jsonb,
    interno BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Relacionamento Ticket-Tag
CREATE TABLE IF NOT EXISTS ticket_tags (
    ticket_id UUID NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (ticket_id, tag_id)
);

-- ============================================
-- 2. CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_empresa ON tickets (empresa_id);

CREATE INDEX IF NOT EXISTS idx_tickets_motorista ON tickets (motorista_id);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);

CREATE INDEX IF NOT EXISTS idx_tickets_prioridade ON tickets (prioridade);

CREATE INDEX IF NOT EXISTS idx_tickets_atribuido ON tickets (atribuido_a);

CREATE INDEX IF NOT EXISTS idx_tickets_criado_por ON tickets (criado_por);

CREATE INDEX IF NOT EXISTS idx_tickets_criado_em ON tickets (criado_em);

CREATE INDEX IF NOT EXISTS idx_ticket_comentarios_ticket ON ticket_comentarios (ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_comentarios_user ON ticket_comentarios (user_id);

CREATE INDEX IF NOT EXISTS idx_ticket_comentarios_criado_em ON ticket_comentarios (criado_em);

CREATE INDEX IF NOT EXISTS idx_ticket_tags_ticket ON ticket_tags (ticket_id);

CREATE INDEX IF NOT EXISTS idx_ticket_tags_tag ON ticket_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_tags_tipo_recurso ON tags (tipo_recurso);

-- ============================================
-- 3. CRIAR TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at em tickets
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para calcular tempo de resposta (primeiro comentário de admin)
CREATE OR REPLACE FUNCTION calculate_ticket_response_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_first_admin_comment TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar primeiro comentário de admin
    SELECT MIN(tc.criado_em) INTO v_first_admin_comment
    FROM ticket_comentarios tc
    JOIN user_roles ur ON ur.user_id = tc.user_id
    JOIN roles r ON r.id = ur.role_id
    WHERE tc.ticket_id = NEW.id
    AND r.slug IN ('admin', 'super_admin', 'suporte');
    
    IF v_first_admin_comment IS NOT NULL AND NEW.tempo_resposta IS NULL THEN
        NEW.tempo_resposta = v_first_admin_comment - NEW.criado_em;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_response_time_on_comment
    AFTER INSERT ON ticket_comentarios
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ticket_response_time();

-- ============================================
-- 4. CRIAR FUNÇÕES SQL
-- ============================================

-- Função para atribuir ticket
CREATE OR REPLACE FUNCTION assign_ticket(
    p_ticket_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE tickets
    SET 
        status = CASE WHEN status = 'aberto' THEN 'em_andamento' ELSE status END,
        atribuido_a = p_admin_id,
        atualizado_em = NOW()
    WHERE id = p_ticket_id;
    
    RETURN FOUND;
END;
$$;

-- Função para resolver ticket
CREATE OR REPLACE FUNCTION resolve_ticket(
    p_ticket_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ticket_created TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT criado_em INTO v_ticket_created FROM tickets WHERE id = p_ticket_id;
    
    UPDATE tickets
    SET 
        status = 'resolvido',
        resolvido_por = p_admin_id,
        resolvido_em = NOW(),
        tempo_resolucao = NOW() - v_ticket_created,
        atualizado_em = NOW()
    WHERE id = p_ticket_id;
    
    RETURN FOUND;
END;
$$;

-- Função para fechar ticket
CREATE OR REPLACE FUNCTION close_ticket(
    p_ticket_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE tickets
    SET 
        status = 'fechado',
        atualizado_em = NOW()
    WHERE id = p_ticket_id AND status = 'resolvido';
    
    RETURN FOUND;
END;
$$;

-- Função para adicionar comentário
CREATE OR REPLACE FUNCTION add_ticket_comment(
    p_ticket_id UUID,
    p_user_id UUID,
    p_comentario TEXT,
    p_anexos JSONB DEFAULT '[]'::jsonb,
    p_interno BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    INSERT INTO ticket_comentarios (ticket_id, user_id, comentario, anexos, interno)
    VALUES (p_ticket_id, p_user_id, p_comentario, p_anexos, p_interno)
    RETURNING id INTO v_comment_id;
    
    -- Atualizar updated_at do ticket
    UPDATE tickets SET atualizado_em = NOW() WHERE id = p_ticket_id;
    
    RETURN v_comment_id;
END;
$$;

-- ============================================
-- 5. CONFIGURAR RLS (Row Level Security)
-- ============================================

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

ALTER TABLE ticket_comentarios ENABLE ROW LEVEL SECURITY;

ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;

-- Políticas para tags
CREATE POLICY "Todos autenticados podem ver tags" ON tags FOR
SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem gerenciar tags" ON tags FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN ('admin', 'super_admin')
    )
);

-- Políticas para tickets
CREATE POLICY "Admins podem ver todos os tickets" ON tickets FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
            WHERE
                ur.user_id = auth.uid ()
                AND r.slug IN (
                    'admin', 'super_admin', 'suporte'
                )
        )
    );

CREATE POLICY "Usuários podem ver seus próprios tickets" ON tickets FOR
SELECT TO authenticated USING (
        criado_por = auth.uid ()
        OR empresa_id = auth.uid ()
        OR motorista_id = auth.uid ()
    );

CREATE POLICY "Usuários podem criar tickets" ON tickets FOR
INSERT
    TO authenticated
WITH
    CHECK (criado_por = auth.uid ());

CREATE POLICY "Admins podem atualizar tickets" ON tickets FOR
UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN (
                'admin',
                'super_admin',
                'suporte'
            )
    )
);

-- Políticas para comentários
CREATE POLICY "Usuários podem ver comentários de seus tickets" ON ticket_comentarios FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM tickets t
            WHERE
                t.id = ticket_comentarios.ticket_id
                AND (
                    t.criado_por = auth.uid ()
                    OR t.empresa_id = auth.uid ()
                    OR t.motorista_id = auth.uid ()
                    OR EXISTS (
                        SELECT 1
                        FROM user_roles ur
                            JOIN roles r ON r.id = ur.role_id
                        WHERE
                            ur.user_id = auth.uid ()
                            AND r.slug IN (
                                'admin', 'super_admin', 'suporte'
                            )
                    )
                )
        )
    );

CREATE POLICY "Usuários podem criar comentários em seus tickets" ON ticket_comentarios FOR
INSERT
    TO authenticated
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM tickets t
            WHERE
                t.id = ticket_comentarios.ticket_id
                AND (
                    t.criado_por = auth.uid ()
                    OR t.empresa_id = auth.uid ()
                    OR t.motorista_id = auth.uid ()
                    OR EXISTS (
                        SELECT 1
                        FROM user_roles ur
                            JOIN roles r ON r.id = ur.role_id
                        WHERE
                            ur.user_id = auth.uid ()
                            AND r.slug IN (
                                'admin',
                                'super_admin',
                                'suporte'
                            )
                    )
                )
        )
    );

-- Políticas para ticket_tags
CREATE POLICY "Usuários podem ver tags de tickets que podem ver" ON ticket_tags FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM tickets t
            WHERE
                t.id = ticket_tags.ticket_id
                AND (
                    t.criado_por = auth.uid ()
                    OR t.empresa_id = auth.uid ()
                    OR t.motorista_id = auth.uid ()
                    OR EXISTS (
                        SELECT 1
                        FROM user_roles ur
                            JOIN roles r ON r.id = ur.role_id
                        WHERE
                            ur.user_id = auth.uid ()
                            AND r.slug IN (
                                'admin', 'super_admin', 'suporte'
                            )
                    )
                )
        )
    );

CREATE POLICY "Admins podem gerenciar tags de tickets" ON ticket_tags FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
        WHERE
            ur.user_id = auth.uid ()
            AND r.slug IN (
                'admin',
                'super_admin',
                'suporte'
            )
    )
);

-- ============================================
-- 6. CONCEDER PERMISSÕES
-- ============================================

GRANT EXECUTE ON FUNCTION assign_ticket(UUID, UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION resolve_ticket (UUID, UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION close_ticket (UUID, UUID) TO authenticated;

GRANT
EXECUTE ON FUNCTION add_ticket_comment (
    UUID,
    UUID,
    TEXT,
    JSONB,
    BOOLEAN
) TO authenticated;

-- ============================================
-- 7. POPULAR TAGS PADRÃO
-- ============================================

INSERT INTO
    tags (nome, cor, tipo_recurso)
VALUES ('Bug', '#EF4444', 'tickets'),
    (
        'Dúvida',
        '#3B82F6',
        'tickets'
    ),
    (
        'Financeiro',
        '#10B981',
        'tickets'
    ),
    (
        'Técnico',
        '#F59E0B',
        'tickets'
    ),
    (
        'Sugestão',
        '#8B5CF6',
        'tickets'
    ),
    (
        'Urgente',
        '#DC2626',
        'tickets'
    ) ON CONFLICT (nome, tipo_recurso) DO NOTHING;