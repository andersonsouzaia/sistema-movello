-- ============================================
-- SISTEMA DE ROLES E PERMISSÕES - MOVELLO
-- Migração 004: Sistema completo de roles e permissões
-- Data: 2024
-- ============================================

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Tabela de Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Permissões
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Tabela de Relacionamento User-Role
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id, role_id)
);

-- Tabela de Relacionamento Role-Permission
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions (id) ON DELETE CASCADE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- 2. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_primary ON user_roles (user_id, is_primary)
WHERE
    is_primary = true;

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);

CREATE INDEX IF NOT EXISTS idx_permissions_slug ON permissions (slug);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions (resource);

CREATE INDEX IF NOT EXISTS idx_roles_slug ON roles (slug);

-- ============================================
-- 3. TRIGGERS PARA updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. POPULAR ROLES PADRÃO
-- ============================================

INSERT INTO
    roles (
        name,
        slug,
        description,
        is_system
    )
VALUES (
        'Super Admin',
        'super_admin',
        'Acesso total ao sistema',
        true
    ),
    (
        'Admin',
        'admin',
        'Administração geral do sistema',
        true
    ),
    (
        'Suporte',
        'suporte',
        'Acesso de suporte e visualização',
        true
    ),
    (
        'Empresa',
        'empresa',
        'Empresa anunciante',
        true
    ),
    (
        'Motorista',
        'motorista',
        'Motorista parceiro',
        true
    ) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. POPULAR PERMISSÕES PADRÃO
-- ============================================

-- Permissões de Usuários
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Criar Usuários',
        'users.create',
        'users',
        'create',
        'Criar novos usuários'
    ),
    (
        'Ler Usuários',
        'users.read',
        'users',
        'read',
        'Visualizar usuários'
    ),
    (
        'Atualizar Usuários',
        'users.update',
        'users',
        'update',
        'Editar usuários'
    ),
    (
        'Deletar Usuários',
        'users.delete',
        'users',
        'delete',
        'Remover usuários'
    ),
    (
        'Gerenciar Roles',
        'users.manage_roles',
        'users',
        'manage_roles',
        'Gerenciar roles e permissões de usuários'
    ) ON CONFLICT (slug) DO NOTHING;

-- Permissões de Empresas
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Criar Empresas',
        'empresas.create',
        'empresas',
        'create',
        'Criar novas empresas'
    ),
    (
        'Ler Empresas',
        'empresas.read',
        'empresas',
        'read',
        'Visualizar empresas'
    ),
    (
        'Atualizar Empresas',
        'empresas.update',
        'empresas',
        'update',
        'Editar empresas'
    ),
    (
        'Deletar Empresas',
        'empresas.delete',
        'empresas',
        'delete',
        'Remover empresas'
    ),
    (
        'Aprovar Empresas',
        'empresas.approve',
        'empresas',
        'approve',
        'Aprovar empresas'
    ),
    (
        'Bloquear Empresas',
        'empresas.block',
        'empresas',
        'block',
        'Bloquear empresas'
    ) ON CONFLICT (slug) DO NOTHING;

-- Permissões de Motoristas
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Criar Motoristas',
        'motoristas.create',
        'motoristas',
        'create',
        'Criar novos motoristas'
    ),
    (
        'Ler Motoristas',
        'motoristas.read',
        'motoristas',
        'read',
        'Visualizar motoristas'
    ),
    (
        'Atualizar Motoristas',
        'motoristas.update',
        'motoristas',
        'update',
        'Editar motoristas'
    ),
    (
        'Deletar Motoristas',
        'motoristas.delete',
        'motoristas',
        'delete',
        'Remover motoristas'
    ),
    (
        'Aprovar Motoristas',
        'motoristas.approve',
        'motoristas',
        'approve',
        'Aprovar motoristas'
    ),
    (
        'Bloquear Motoristas',
        'motoristas.block',
        'motoristas',
        'block',
        'Bloquear motoristas'
    ) ON CONFLICT (slug) DO NOTHING;

-- Permissões de Campanhas
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Criar Campanhas',
        'campanhas.create',
        'campanhas',
        'create',
        'Criar novas campanhas'
    ),
    (
        'Ler Campanhas',
        'campanhas.read',
        'campanhas',
        'read',
        'Visualizar campanhas'
    ),
    (
        'Atualizar Campanhas',
        'campanhas.update',
        'campanhas',
        'update',
        'Editar campanhas'
    ),
    (
        'Deletar Campanhas',
        'campanhas.delete',
        'campanhas',
        'delete',
        'Remover campanhas'
    ),
    (
        'Aprovar Campanhas',
        'campanhas.approve',
        'campanhas',
        'approve',
        'Aprovar campanhas'
    ),
    (
        'Pausar Campanhas',
        'campanhas.pause',
        'campanhas',
        'pause',
        'Pausar campanhas'
    ) ON CONFLICT (slug) DO NOTHING;

-- Permissões de Pagamentos
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Criar Pagamentos',
        'pagamentos.create',
        'pagamentos',
        'create',
        'Criar novos pagamentos'
    ),
    (
        'Ler Pagamentos',
        'pagamentos.read',
        'pagamentos',
        'read',
        'Visualizar pagamentos'
    ),
    (
        'Atualizar Pagamentos',
        'pagamentos.update',
        'pagamentos',
        'update',
        'Editar pagamentos'
    ),
    (
        'Processar Pagamentos',
        'pagamentos.process',
        'pagamentos',
        'process',
        'Processar pagamentos'
    ) ON CONFLICT (slug) DO NOTHING;

-- Permissões de Repasses
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Criar Repasses',
        'repasses.create',
        'repasses',
        'create',
        'Criar novos repasses'
    ),
    (
        'Ler Repasses',
        'repasses.read',
        'repasses',
        'read',
        'Visualizar repasses'
    ),
    (
        'Atualizar Repasses',
        'repasses.update',
        'repasses',
        'update',
        'Editar repasses'
    ),
    (
        'Processar Repasses',
        'repasses.process',
        'repasses',
        'process',
        'Processar repasses'
    ) ON CONFLICT (slug) DO NOTHING;

-- Permissões de Suporte
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Criar Tickets',
        'suporte.create',
        'suporte',
        'create',
        'Criar tickets de suporte'
    ),
    (
        'Ler Tickets',
        'suporte.read',
        'suporte',
        'read',
        'Visualizar tickets'
    ),
    (
        'Atualizar Tickets',
        'suporte.update',
        'suporte',
        'update',
        'Editar tickets'
    ),
    (
        'Atribuir Tickets',
        'suporte.assign',
        'suporte',
        'assign',
        'Atribuir tickets'
    ),
    (
        'Resolver Tickets',
        'suporte.resolve',
        'suporte',
        'resolve',
        'Resolver tickets'
    ) ON CONFLICT (slug) DO NOTHING;

-- Permissões de Configurações
INSERT INTO
    permissions (
        name,
        slug,
        resource,
        action,
        description
    )
VALUES (
        'Ler Configurações',
        'configuracoes.read',
        'configuracoes',
        'read',
        'Visualizar configurações'
    ),
    (
        'Atualizar Configurações',
        'configuracoes.update',
        'configuracoes',
        'update',
        'Editar configurações'
    ) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 6. ATRIBUIR PERMISSÕES AOS ROLES
-- ============================================

-- Super Admin: Todas as permissões
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.slug = 'super_admin' ON CONFLICT DO NOTHING;

-- Admin: Todas exceto manage_roles (apenas super_admin)
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.slug = 'admin'
    AND p.slug != 'users.manage_roles' ON CONFLICT DO NOTHING;

-- Suporte: Ler e atualizar tickets, ler empresas/motoristas
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.slug = 'suporte'
    AND (
        p.slug LIKE 'suporte.%'
        OR p.slug = 'empresas.read'
        OR p.slug = 'motoristas.read'
        OR p.slug = 'campanhas.read'
        OR p.slug = 'users.read'
    ) ON CONFLICT DO NOTHING;

-- Empresa: Criar/ler/atualizar próprias campanhas, ler próprios dados
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.slug = 'empresa'
    AND (
        p.slug LIKE 'campanhas.%'
        OR p.slug = 'empresas.read'
        OR p.slug = 'empresas.update'
        OR p.slug = 'pagamentos.read'
        OR p.slug = 'suporte.create'
        OR p.slug = 'suporte.read'
    ) ON CONFLICT DO NOTHING;

-- Motorista: Ler próprios dados, ler ganhos, criar tickets
INSERT INTO
    role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
    CROSS JOIN permissions p
WHERE
    r.slug = 'motorista'
    AND (
        p.slug = 'motoristas.read'
        OR p.slug = 'motoristas.update'
        OR p.slug = 'repasses.read'
        OR p.slug = 'suporte.create'
        OR p.slug = 'suporte.read'
    ) ON CONFLICT DO NOTHING;

-- ============================================
-- 7. FUNÇÕES SQL DE GERENCIAMENTO
-- ============================================

-- Função: Verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION has_permission(
    p_user_id UUID,
    p_permission_slug VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
        INNER JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
            AND p.slug = p_permission_slug
    ) INTO v_has_permission;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$;

-- Função: Obter roles do usuário
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE (
    role_id UUID,
    role_name VARCHAR,
    role_slug VARCHAR,
    is_primary BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.slug,
        ur.is_primary
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
    ORDER BY ur.is_primary DESC, r.name;
END;
$$;

-- Função: Obter permissões do usuário
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
    permission_slug VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.slug
    FROM user_roles ur
    INNER JOIN role_permissions rp ON ur.role_id = rp.role_id
    INNER JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
    ORDER BY p.slug;
END;
$$;

-- Função: Atribuir role a usuário
CREATE OR REPLACE FUNCTION assign_role_to_user(
    p_user_id UUID,
    p_role_slug VARCHAR,
    p_is_primary BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- Buscar ID do role
    SELECT id INTO v_role_id
    FROM roles
    WHERE slug = p_role_slug;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role não encontrada: %', p_role_slug;
    END IF;
    
    -- Se for primary, remover primary de outros roles do usuário
    IF p_is_primary THEN
        UPDATE user_roles
        SET is_primary = false
        WHERE user_id = p_user_id;
    END IF;
    
    -- Inserir ou atualizar role
    INSERT INTO user_roles (user_id, role_id, is_primary)
    VALUES (p_user_id, v_role_id, p_is_primary)
    ON CONFLICT (user_id, role_id)
    DO UPDATE SET is_primary = p_is_primary;
    
    RETURN true;
END;
$$;

-- Função: Remover role de usuário
CREATE OR REPLACE FUNCTION remove_role_from_user(
    p_user_id UUID,
    p_role_slug VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role_id UUID;
BEGIN
    -- Buscar ID do role
    SELECT id INTO v_role_id
    FROM roles
    WHERE slug = p_role_slug;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role não encontrada: %', p_role_slug;
    END IF;
    
    -- Remover role
    DELETE FROM user_roles
    WHERE user_id = p_user_id
        AND role_id = v_role_id;
    
    RETURN true;
END;
$$;

-- Função: Criar primeiro admin (apenas se não existir admin)
CREATE OR REPLACE FUNCTION create_first_admin(
    p_email VARCHAR,
    p_password VARCHAR,
    p_nome VARCHAR
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_admin_count INTEGER;
    v_role_id UUID;
BEGIN
    -- Verificar se já existe algum admin
    SELECT COUNT(*) INTO v_admin_count
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE r.slug IN ('admin', 'super_admin');
    
    IF v_admin_count > 0 THEN
        RAISE EXCEPTION 'Já existe pelo menos um admin no sistema';
    END IF;
    
    -- Criar usuário no Supabase Auth (via service role seria necessário)
    -- Por enquanto, assumimos que o usuário já foi criado no auth
    -- e precisamos apenas criar o registro em users e atribuir role
    
    -- Buscar usuário existente por email ou criar novo
    -- NOTA: Esta função assume que o usuário já existe em auth.users
    -- O frontend deve criar o usuário primeiro no Supabase Auth
    
    -- Buscar ID do role super_admin
    SELECT id INTO v_role_id
    FROM roles
    WHERE slug = 'super_admin';
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role super_admin não encontrada';
    END IF;
    
    -- Retornar role_id para uso no frontend
    RETURN v_role_id;
END;
$$;

-- Função auxiliar: Verificar se existe admin
CREATE OR REPLACE FUNCTION has_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE r.slug IN ('admin', 'super_admin');
    
    RETURN v_count > 0;
END;
$$;

-- ============================================
-- 8. MIGRAR DADOS EXISTENTES
-- ============================================

-- Migrar users.tipo para user_roles
INSERT INTO
    user_roles (user_id, role_id, is_primary)
SELECT u.id, r.id, true
FROM users u
    INNER JOIN roles r ON r.slug = u.tipo
WHERE
    NOT EXISTS (
        SELECT 1
        FROM user_roles ur
        WHERE
            ur.user_id = u.id
            AND ur.role_id = r.id
    ) ON CONFLICT DO NOTHING;

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para roles
CREATE POLICY "roles_select_all" ON roles FOR
SELECT TO authenticated USING (true);

-- Políticas para permissions
CREATE POLICY "permissions_select_all" ON permissions FOR
SELECT TO authenticated USING (true);

-- Políticas para user_roles
-- Usuários podem ver seus próprios roles
CREATE POLICY "user_roles_select_own" ON user_roles FOR
SELECT TO authenticated USING (user_id = auth.uid ());

-- Admins podem ver todos os roles
CREATE POLICY "user_roles_select_admin" ON user_roles FOR
SELECT TO authenticated USING (is_user_admin ());

-- Políticas para role_permissions
CREATE POLICY "role_permissions_select_all" ON role_permissions FOR
SELECT TO authenticated USING (true);

-- ============================================
-- 10. COMENTÁRIOS
-- ============================================

COMMENT ON
TABLE roles IS 'Roles do sistema (super_admin, admin, suporte, empresa, motorista)';

COMMENT ON TABLE permissions IS 'Permissões granulares do sistema';

COMMENT ON
TABLE user_roles IS 'Relacionamento entre usuários e roles';

COMMENT ON
TABLE role_permissions IS 'Relacionamento entre roles e permissões';

COMMENT ON FUNCTION has_permission IS 'Verifica se um usuário tem uma permissão específica';

COMMENT ON FUNCTION get_user_roles IS 'Retorna todos os roles de um usuário';

COMMENT ON FUNCTION get_user_permissions IS 'Retorna todas as permissões de um usuário';

COMMENT ON FUNCTION assign_role_to_user IS 'Atribui um role a um usuário';

COMMENT ON FUNCTION remove_role_from_user IS 'Remove um role de um usuário';

COMMENT ON FUNCTION create_first_admin IS 'Cria o primeiro admin do sistema (apenas se não existir)';

COMMENT ON FUNCTION has_admin IS 'Verifica se existe pelo menos um admin no sistema';

-- ============================================
-- FIM DO SCRIPT
-- ============================================