import { AuthError } from '@supabase/supabase-js'

// ============================================
// MAPEAMENTO DE ERROS SUPABASE
// ============================================

export interface ErrorMessage {
  message: string
  code?: string
  userFriendly: boolean
}

export const handleSupabaseError = (error: unknown): ErrorMessage => {
  // Se não for erro do Supabase, retornar erro genérico
  if (!(error instanceof Error)) {
    return {
      message: 'Ocorreu um erro inesperado. Tente novamente.',
      userFriendly: true,
    }
  }

  // Se for AuthError do Supabase
  if (error instanceof AuthError) {
    return handleAuthError(error)
  }

  // Verificar se é erro de rede
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return {
      message: 'Erro de conexão. Verifique sua internet e tente novamente.',
      code: 'NETWORK_ERROR',
      userFriendly: true,
    }
  }

  // Erro genérico
  return {
    message: error.message || 'Ocorreu um erro inesperado. Tente novamente.',
    userFriendly: false,
  }
}

// ============================================
// TRATAMENTO DE ERROS DE AUTENTICAÇÃO
// ============================================

const handleAuthError = (error: AuthError): ErrorMessage => {
  const code = error.status?.toString() || error.message

  // Mapear códigos de erro comuns
  const errorMap: Record<string, ErrorMessage> = {
    // Credenciais inválidas
    '400': {
      message: 'Email ou senha incorretos. Verifique suas credenciais.',
      code: 'INVALID_CREDENTIALS',
      userFriendly: true,
    },
    '401': {
      message: 'Email ou senha incorretos. Verifique suas credenciais.',
      code: 'INVALID_CREDENTIALS',
      userFriendly: true,
    },
    'invalid_credentials': {
      message: 'Email ou senha incorretos. Verifique suas credenciais.',
      code: 'INVALID_CREDENTIALS',
      userFriendly: true,
    },
    'Invalid login credentials': {
      message: 'Email ou senha incorretos. Verifique suas credenciais.',
      code: 'INVALID_CREDENTIALS',
      userFriendly: true,
    },

    // Email não confirmado
    'email_not_confirmed': {
      message: 'Por favor, confirme seu email antes de fazer login.',
      code: 'EMAIL_NOT_CONFIRMED',
      userFriendly: true,
    },
    'Email not confirmed': {
      message: 'Por favor, confirme seu email antes de fazer login.',
      code: 'EMAIL_NOT_CONFIRMED',
      userFriendly: true,
    },

    // Email já existe
    'signup_disabled': {
      message: 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.',
      code: 'SIGNUP_DISABLED',
      userFriendly: true,
    },
    'User already registered': {
      message: 'Este email já está cadastrado. Tente fazer login.',
      code: 'USER_EXISTS',
      userFriendly: true,
    },

    // Token inválido/expirado
    'token_expired': {
      message: 'O link de recuperação expirou. Solicite um novo.',
      code: 'TOKEN_EXPIRED',
      userFriendly: true,
    },
    'invalid_token': {
      message: 'Link inválido ou expirado. Solicite um novo.',
      code: 'INVALID_TOKEN',
      userFriendly: true,
    },

    // Código de verificação
    'invalid_otp': {
      message: 'Código inválido ou expirado. Verifique e tente novamente.',
      code: 'INVALID_OTP',
      userFriendly: true,
    },
    'otp_expired': {
      message: 'Código expirado. Solicite um novo código.',
      code: 'OTP_EXPIRED',
      userFriendly: true,
    },

    // Rate limiting
    'too_many_requests': {
      message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
      code: 'RATE_LIMIT',
      userFriendly: true,
    },
    'email rate limit exceeded': {
      message: 'Muitas tentativas de envio. Aguarde alguns minutos antes de tentar novamente.',
      code: 'RATE_LIMIT',
      userFriendly: true,
    },
  }

  // Buscar erro mapeado
  const mappedError = errorMap[code] || errorMap[error.message]

  if (mappedError) {
    return mappedError
  }

  // Se não encontrou mapeamento, retornar mensagem genérica mas amigável
  return {
    message: `Erro: ${error.message || 'Erro desconhecido'} (Código: ${code})`, // DEBUG: Show actual error
    code: code,
    userFriendly: true,
  }
}

// ============================================
// TRATAMENTO DE ERROS DE BANCO DE DADOS
// ============================================

export const handleDatabaseError = (error: unknown): ErrorMessage => {
  if (!(error instanceof Error)) {
    return {
      message: 'Erro ao acessar o banco de dados. Tente novamente.',
      userFriendly: true,
    }
  }

  const message = error.message.toLowerCase()

  // Erros comuns do PostgreSQL/Supabase
  if (message.includes('unique constraint') || message.includes('duplicate')) {
    return {
      message: 'Este registro já existe no sistema.',
      code: 'DUPLICATE_ENTRY',
      userFriendly: true,
    }
  }

  if (message.includes('foreign key') || message.includes('violates foreign key')) {
    return {
      message: 'Erro de referência. Verifique os dados informados.',
      code: 'FOREIGN_KEY_ERROR',
      userFriendly: true,
    }
  }

  if (message.includes('not null') || message.includes('null value')) {
    return {
      message: 'Campos obrigatórios não preenchidos.',
      code: 'NULL_VALUE',
      userFriendly: true,
    }
  }

  if (message.includes('permission denied') || message.includes('row-level security')) {
    return {
      message: 'Você não tem permissão para realizar esta ação.',
      code: 'PERMISSION_DENIED',
      userFriendly: true,
    }
  }

  return {
    message: 'Erro ao processar dados. Tente novamente.',
    code: 'DATABASE_ERROR',
    userFriendly: true,
  }
}

// ============================================
// FUNÇÃO PRINCIPAL DE TRATAMENTO
// ============================================

export const handleError = (error: unknown, context?: 'auth' | 'database'): ErrorMessage => {
  if (context === 'auth') {
    return handleSupabaseError(error)
  }

  if (context === 'database') {
    return handleDatabaseError(error)
  }

  // Tentar detectar automaticamente
  if (error instanceof AuthError) {
    return handleAuthError(error)
  }

  return handleSupabaseError(error)
}

