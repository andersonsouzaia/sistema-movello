-- ==========================================
-- MIGRATION: Scalability Indexes
-- ==========================================

-- CAMPANHAS: Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_campanhas_status ON campanhas(status);
CREATE INDEX IF NOT EXISTS idx_campanhas_empresa_id ON campanhas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_data_inicio ON campanhas(data_inicio);
-- CREATE INDEX IF NOT EXISTS idx_campanhas_orcamento ON campanhas(orcamento);

-- AUDIT LOGS: Indexes for admin dashboard filters
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- USERS: Indexes for search
-- Note: 'nome' usually is inside a JSONB or separate table? 
-- Assuming 'users' table structure from codebase usage:
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- If 'users' has a 'nome' column:
CREATE INDEX IF NOT EXISTS idx_users_nome ON users(nome);

-- TRANSACOES: Indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa_id ON transacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_created_at ON transacoes(created_at DESC);
