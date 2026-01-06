-- ============================================
-- MIGRAÇÃO: Tabela de Tentativas de Login
-- ============================================
-- Sistema de bloqueio progressivo após tentativas falhadas
-- Versão: 1.0
-- Data: 2024
-- ============================================

-- ============================================
-- TABELA: login_attempts
-- ============================================

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    tentativas INTEGER DEFAULT 0,
    ultima_tentativa TIMESTAMP
    WITH
        TIME ZONE,
        bloqueado_ate TIMESTAMP
    WITH
        TIME ZONE,
        nivel_bloqueio INTEGER DEFAULT 0,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id)
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts (user_id);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts (email);

CREATE INDEX IF NOT EXISTS idx_login_attempts_bloqueado ON login_attempts (bloqueado_ate);

-- ============================================
-- TRIGGER: updated_at
-- ============================================

CREATE TRIGGER update_login_attempts_updated_at 
    BEFORE UPDATE ON login_attempts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO: Calcular Tempo de Bloqueio Progressivo
-- ============================================

CREATE OR REPLACE FUNCTION calcular_tempo_bloqueio(nivel INTEGER)
RETURNS INTERVAL AS $$
BEGIN
  CASE nivel
    WHEN 1 THEN RETURN INTERVAL '1 minute';
    WHEN 2 THEN RETURN INTERVAL '2 minutes';
    WHEN 3 THEN RETURN INTERVAL '5 minutes';
    WHEN 4 THEN RETURN INTERVAL '10 minutes';
    ELSE RETURN INTERVAL '30 minutes';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Registrar Tentativa de Login
-- ============================================

CREATE OR REPLACE FUNCTION registrar_tentativa_login(
  p_email VARCHAR(255),
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_attempt login_attempts%ROWTYPE;
  v_bloqueado BOOLEAN := false;
  v_tempo_restante INTERVAL;
  v_minutos_restantes INTEGER;
BEGIN
  -- Buscar registro existente por email ou user_id
  SELECT * INTO v_attempt
  FROM login_attempts
  WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
     OR email = p_email
  LIMIT 1;

  -- Se não existe, criar novo registro
  IF NOT FOUND THEN
    INSERT INTO login_attempts (email, user_id, tentativas, ultima_tentativa, nivel_bloqueio)
    VALUES (p_email, p_user_id, 1, NOW(), 0)
    RETURNING * INTO v_attempt;
    
    RETURN jsonb_build_object(
      'bloqueado', false,
      'tentativas', 1,
      'tentativas_restantes', 2
    );
  END IF;

  -- Verificar se está bloqueado
  IF v_attempt.bloqueado_ate IS NOT NULL AND v_attempt.bloqueado_ate > NOW() THEN
    v_bloqueado := true;
    v_tempo_restante := v_attempt.bloqueado_ate - NOW();
    v_minutos_restantes := GREATEST(1, EXTRACT(EPOCH FROM v_tempo_restante)::INTEGER / 60);
    
    RETURN jsonb_build_object(
      'bloqueado', true,
      'tempo_restante_segundos', EXTRACT(EPOCH FROM v_tempo_restante)::INTEGER,
      'tempo_restante_minutos', v_minutos_restantes,
      'mensagem', 'Conta bloqueada. Tente novamente em ' || v_minutos_restantes || ' minuto(s).'
    );
  END IF;

  -- Se passou o tempo de bloqueio, resetar nível mas manter tentativas
  IF v_attempt.bloqueado_ate IS NOT NULL AND v_attempt.bloqueado_ate <= NOW() THEN
    v_attempt.nivel_bloqueio := 0;
    v_attempt.bloqueado_ate := NULL;
  END IF;

  -- Incrementar tentativas
  v_attempt.tentativas := v_attempt.tentativas + 1;
  v_attempt.ultima_tentativa := NOW();

  -- Se chegou a 3 tentativas, aplicar bloqueio progressivo
  IF v_attempt.tentativas >= 3 THEN
    v_attempt.nivel_bloqueio := v_attempt.nivel_bloqueio + 1;
    v_attempt.bloqueado_ate := NOW() + calcular_tempo_bloqueio(v_attempt.nivel_bloqueio);
    v_bloqueado := true;
    v_tempo_restante := calcular_tempo_bloqueio(v_attempt.nivel_bloqueio);
    v_minutos_restantes := EXTRACT(EPOCH FROM v_tempo_restante)::INTEGER / 60;
  END IF;

  -- Atualizar registro
  UPDATE login_attempts
  SET tentativas = v_attempt.tentativas,
      ultima_tentativa = v_attempt.ultima_tentativa,
      nivel_bloqueio = v_attempt.nivel_bloqueio,
      bloqueado_ate = v_attempt.bloqueado_ate,
      updated_at = NOW()
  WHERE id = v_attempt.id
  RETURNING * INTO v_attempt;

  -- Retornar resultado
  IF v_bloqueado THEN
    RETURN jsonb_build_object(
      'bloqueado', true,
      'tempo_restante_segundos', EXTRACT(EPOCH FROM v_tempo_restante)::INTEGER,
      'tempo_restante_minutos', v_minutos_restantes,
      'tentativas', v_attempt.tentativas,
      'nivel_bloqueio', v_attempt.nivel_bloqueio,
      'mensagem', 'Muitas tentativas falhadas. Conta bloqueada por ' || v_minutos_restantes || ' minuto(s).'
    );
  ELSE
    RETURN jsonb_build_object(
      'bloqueado', false,
      'tentativas', v_attempt.tentativas,
      'tentativas_restantes', GREATEST(0, 3 - v_attempt.tentativas)
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Resetar Tentativas Após Login Bem-Sucedido
-- ============================================

CREATE OR REPLACE FUNCTION resetar_tentativas_login(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE login_attempts
  SET tentativas = 0,
      nivel_bloqueio = 0,
      bloqueado_ate = NULL,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Política: Users podem ver suas próprias tentativas
CREATE POLICY "Users podem ver suas próprias tentativas" ON login_attempts FOR
SELECT USING (auth.uid () = user_id);

-- Política: Admins têm acesso total
CREATE POLICY "Admins têm acesso total a login_attempts" ON login_attempts FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM admins
        WHERE
            admins.id = auth.uid ()
            AND admins.ativo = true
    )
)
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM admins
            WHERE
                admins.id = auth.uid ()
                AND admins.ativo = true
        )
    );

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON
TABLE login_attempts IS 'Registro de tentativas de login e bloqueios progressivos';

COMMENT ON FUNCTION calcular_tempo_bloqueio IS 'Calcula tempo de bloqueio baseado no nível (progressivo)';

COMMENT ON FUNCTION registrar_tentativa_login IS 'Registra tentativa de login e aplica bloqueio se necessário';

COMMENT ON FUNCTION resetar_tentativas_login IS 'Reseta tentativas após login bem-sucedido';