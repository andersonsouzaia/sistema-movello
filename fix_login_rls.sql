-- Habilitar RLS na tabela login_attempts (caso não esteja)
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Remover política antiga se existir (para evitar duplicatas)
DROP POLICY IF EXISTS "Permitir inserção de tentativas de login" ON login_attempts;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON login_attempts;

-- Criar política permitindo inserção para todos (anônimos e autenticados)
-- Isso é necessário porque as tentativas são registradas ANTES do login
CREATE POLICY "Permitir inserção de tentativas de login"
ON login_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
