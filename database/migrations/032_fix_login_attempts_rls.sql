-- ============================================
-- CORRIGIR: Função registrar_tentativa_login para usar SECURITY DEFINER
-- ============================================
-- Esta migração atualiza a função para bypassar RLS durante login
-- Versão: 1.0
-- Data: 2024
-- NOTA: Esta migração assume que a tabela login_attempts já existe.
-- Se não existir, execute a migração 001_login_attempts.sql primeiro.
-- ============================================

-- ============================================
-- ATUALIZAR FUNÇÃO: registrar_tentativa_login
-- ============================================

-- Criar função apenas se a tabela login_attempts existir
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'login_attempts'
    ) THEN
        -- Remover função antiga (se existir)
        DROP FUNCTION IF EXISTS registrar_tentativa_login(VARCHAR, UUID);

        -- Recriar função com SECURITY DEFINER para bypassar RLS
        EXECUTE '
        CREATE OR REPLACE FUNCTION registrar_tentativa_login(
          p_email VARCHAR(255),
          p_user_id UUID DEFAULT NULL
        )
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, auth
        AS $func$
        DECLARE
          v_attempt login_attempts%ROWTYPE;
          v_bloqueado BOOLEAN := false;
          v_tempo_restante INTERVAL;
          v_minutos_restantes INTEGER;
        BEGIN
          -- Buscar registro existente por email ou user_id
          SELECT * INTO v_attempt
          FROM public.login_attempts
          WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
             OR email = p_email
          LIMIT 1;

          -- Se não existe, criar novo registro
          IF NOT FOUND THEN
            INSERT INTO public.login_attempts (email, user_id, tentativas, ultima_tentativa, nivel_bloqueio)
            VALUES (p_email, p_user_id, 1, NOW(), 0)
            RETURNING * INTO v_attempt;
            
            RETURN jsonb_build_object(
              ''bloqueado'', false,
              ''tentativas'', 1,
              ''tentativas_restantes'', 2
            );
          END IF;

          -- Verificar se está bloqueado
          IF v_attempt.bloqueado_ate IS NOT NULL AND v_attempt.bloqueado_ate > NOW() THEN
            v_bloqueado := true;
            v_tempo_restante := v_attempt.bloqueado_ate - NOW();
            v_minutos_restantes := GREATEST(1, EXTRACT(EPOCH FROM v_tempo_restante)::INTEGER / 60);
            
            RETURN jsonb_build_object(
              ''bloqueado'', true,
              ''tempo_restante_segundos'', EXTRACT(EPOCH FROM v_tempo_restante)::INTEGER,
              ''tempo_restante_minutos'', v_minutos_restantes,
              ''mensagem'', ''Conta bloqueada. Tente novamente em '' || v_minutos_restantes || '' minuto(s).''
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
          UPDATE public.login_attempts
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
              ''bloqueado'', true,
              ''tempo_restante_segundos'', EXTRACT(EPOCH FROM v_tempo_restante)::INTEGER,
              ''tempo_restante_minutos'', v_minutos_restantes,
              ''tentativas'', v_attempt.tentativas,
              ''nivel_bloqueio'', v_attempt.nivel_bloqueio,
              ''mensagem'', ''Muitas tentativas falhadas. Conta bloqueada por '' || v_minutos_restantes || '' minuto(s).''
            );
          ELSE
            RETURN jsonb_build_object(
              ''bloqueado'', false,
              ''tentativas'', v_attempt.tentativas,
              ''tentativas_restantes'', GREATEST(0, 3 - v_attempt.tentativas)
            );
          END IF;
        END;
        $func$;
        ';
        
        -- Garantir permissões
        GRANT EXECUTE ON FUNCTION registrar_tentativa_login(VARCHAR, UUID) TO authenticated, anon;
    ELSE
        RAISE NOTICE 'Tabela login_attempts não existe. Pulando atualização da função registrar_tentativa_login. Execute a migração 001_login_attempts.sql primeiro.';
    END IF;
END $$;

-- ============================================
-- ATUALIZAR FUNÇÃO: resetar_tentativas_login
-- ============================================

-- Criar função apenas se a tabela login_attempts existir
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'login_attempts'
    ) THEN
        -- Remover função antiga (se existir)
        DROP FUNCTION IF EXISTS resetar_tentativas_login(UUID);

        -- Recriar função com SECURITY DEFINER
        EXECUTE '
        CREATE OR REPLACE FUNCTION resetar_tentativas_login(p_user_id UUID)
        RETURNS VOID
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public, auth
        AS $func$
        BEGIN
          UPDATE public.login_attempts
          SET tentativas = 0,
              nivel_bloqueio = 0,
              bloqueado_ate = NULL,
              updated_at = NOW()
          WHERE user_id = p_user_id;
        END;
        $func$;
        ';
        
        -- Garantir permissões
        GRANT EXECUTE ON FUNCTION resetar_tentativas_login(UUID) TO authenticated, anon;
    ELSE
        RAISE NOTICE 'Tabela login_attempts não existe. Pulando atualização da função resetar_tentativas_login. Execute a migração 001_login_attempts.sql primeiro.';
    END IF;
END $$;

-- ============================================
-- COMENTÁRIOS (se as funções foram criadas)
-- ============================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'registrar_tentativa_login'
    ) THEN
        COMMENT ON FUNCTION registrar_tentativa_login IS 'Registra tentativa de login e aplica bloqueio se necessário. Usa SECURITY DEFINER para bypassar RLS durante login (quando usuário ainda não está autenticado).';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'resetar_tentativas_login'
    ) THEN
        COMMENT ON FUNCTION resetar_tentativas_login IS 'Reseta tentativas após login bem-sucedido. Usa SECURITY DEFINER para bypassar RLS.';
    END IF;
END $$;