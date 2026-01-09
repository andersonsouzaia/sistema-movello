import { cpf, cnpj } from 'cpf-cnpj-validator'

// ============================================
// FORMATAÇÃO DE CPF
// ============================================

export const formatCPF = (value: string): string => {
  if (!value) return ''
  
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length !== 11) return value
  
  try {
    return cpf.format(cleaned)
  } catch {
    return value
  }
}

export const cleanCPF = (value: string): string => {
  return value.replace(/\D/g, '')
}

// ============================================
// FORMATAÇÃO DE CNPJ
// ============================================

export const formatCNPJ = (value: string): string => {
  if (!value) return ''
  
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length !== 14) return value
  
  try {
    return cnpj.format(cleaned)
  } catch {
    return value
  }
}

export const cleanCNPJ = (value: string): string => {
  return value.replace(/\D/g, '')
}

// ============================================
// FORMATAÇÃO DE TELEFONE
// ============================================

export const formatPhone = (value: string): string => {
  if (!value) return ''
  
  const cleaned = value.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    // Celular: (00) 00000-0000
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  if (cleaned.length === 10) {
    // Fixo: (00) 0000-0000
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return value
}

export const cleanPhone = (value: string): string => {
  return value.replace(/\D/g, '')
}

// ============================================
// FORMATAÇÃO DE PLACA
// ============================================

export const formatPlaca = (value: string): string => {
  if (!value) return ''
  
  // Remove espaços e converte para maiúsculo
  const cleaned = value.replace(/\s/g, '').toUpperCase()
  
  if (cleaned.length === 7) {
    // Formato: ABC-1234 ou ABC1D23
    return cleaned.slice(0, 3) + '-' + cleaned.slice(3)
  }
  
  return cleaned
}

export const cleanPlaca = (value: string): string => {
  // Remove espaços, hífens e converte para maiúsculo
  return value.replace(/\s|-/g, '').toUpperCase()
}

// ============================================
// FORMATAÇÃO DE MOEDA
// ============================================

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

// ============================================
// FORMATAÇÃO DE DATA
// ============================================

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

