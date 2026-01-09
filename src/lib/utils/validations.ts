import { cpf, cnpj } from 'cpf-cnpj-validator'

// ============================================
// VALIDAÇÃO DE SENHA
// ============================================

export interface PasswordValidationResult {
  isValid: boolean
  error?: string
}

export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      error: 'A senha deve ter no mínimo 8 caracteres',
    }
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'A senha deve conter pelo menos uma letra maiúscula',
    }
  }

  return { isValid: true }
}

// ============================================
// VALIDAÇÃO DE CPF
// ============================================

export interface CPFValidationResult {
  isValid: boolean
  error?: string
  cleaned?: string
}

export const validateCPF = (cpfValue: string): CPFValidationResult => {
  if (!cpfValue) {
    return {
      isValid: false,
      error: 'CPF é obrigatório',
    }
  }

  const cleaned = cpfValue.replace(/\D/g, '')

  if (cleaned.length !== 11) {
    return {
      isValid: false,
      error: 'CPF deve conter 11 dígitos',
      cleaned,
    }
  }

  if (!cpf.isValid(cleaned)) {
    return {
      isValid: false,
      error: 'CPF inválido',
      cleaned,
    }
  }

  return {
    isValid: true,
    cleaned,
  }
}

// ============================================
// VALIDAÇÃO DE CNPJ
// ============================================

export interface CNPJValidationResult {
  isValid: boolean
  error?: string
  cleaned?: string
}

export const validateCNPJ = (cnpjValue: string): CNPJValidationResult => {
  if (!cnpjValue) {
    return {
      isValid: false,
      error: 'CNPJ é obrigatório',
    }
  }

  const cleaned = cnpjValue.replace(/\D/g, '')

  if (cleaned.length !== 14) {
    return {
      isValid: false,
      error: 'CNPJ deve conter 14 dígitos',
      cleaned,
    }
  }

  if (!cnpj.isValid(cleaned)) {
    return {
      isValid: false,
      error: 'CNPJ inválido',
      cleaned,
    }
  }

  return {
    isValid: true,
    cleaned,
  }
}

// ============================================
// VALIDAÇÃO DE EMAIL
// ============================================

export interface EmailValidationResult {
  isValid: boolean
  error?: string
}

export const validateEmail = (email: string): EmailValidationResult => {
  if (!email) {
    return {
      isValid: false,
      error: 'Email é obrigatório',
    }
  }

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!regex.test(email)) {
    return {
      isValid: false,
      error: 'Email inválido',
    }
  }

  return { isValid: true }
}

// ============================================
// VALIDAÇÃO DE TELEFONE
// ============================================

export interface PhoneValidationResult {
  isValid: boolean
  error?: string
  cleaned?: string
}

export const validatePhone = (phone: string): PhoneValidationResult => {
  if (!phone) {
    return {
      isValid: false,
      error: 'Telefone é obrigatório',
    }
  }

  const cleaned = phone.replace(/\D/g, '')

  // Aceita telefone com DDD (10 ou 11 dígitos)
  if (cleaned.length < 10 || cleaned.length > 11) {
    return {
      isValid: false,
      error: 'Telefone deve conter 10 ou 11 dígitos (com DDD)',
      cleaned,
    }
  }

  return {
    isValid: true,
    cleaned,
  }
}

// ============================================
// VALIDAÇÃO DE PLACA
// ============================================

export interface PlacaValidationResult {
  isValid: boolean
  error?: string
  cleaned?: string
}

export const validatePlaca = (placa: string): PlacaValidationResult => {
  if (!placa) {
    return {
      isValid: false,
      error: 'Placa é obrigatória',
    }
  }

  // Remove espaços, hífens e converte para maiúsculo
  const cleaned = placa.replace(/\s|-/g, '').toUpperCase()

  // Formato antigo: ABC1234 (7 caracteres)
  // Formato Mercosul: ABC1D23 (7 caracteres)
  const regex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/

  if (cleaned.length !== 7) {
    return {
      isValid: false,
      error: 'Placa deve conter 7 caracteres',
      cleaned,
    }
  }

  if (!regex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Formato de placa inválido',
      cleaned,
    }
  }

  return {
    isValid: true,
    cleaned,
  }
}

