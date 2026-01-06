import { auditService } from '@/services/auditService'

/**
 * Captura o IP do usuário (aproximado via headers)
 */
export const getClientIP = (): string | null => {
  // Em produção, isso viria dos headers da requisição
  // Por enquanto retornamos null, mas pode ser implementado no backend
  return null
}

/**
 * Captura o User Agent do navegador
 */
export const getUserAgent = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent
  }
  return null
}

/**
 * Formata detalhes para o audit log
 */
export const formatAuditDetails = (details: Record<string, any>): Record<string, any> => {
  // Remove senhas e dados sensíveis
  const sanitized = { ...details }
  if (sanitized.password) delete sanitized.password
  if (sanitized.senha) delete sanitized.senha
  if (sanitized.confirmar_senha) delete sanitized.confirmar_senha
  
  return sanitized
}

/**
 * Helper para log automático de ações
 */
export const logAction = async (
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  details?: Record<string, any>
): Promise<void> => {
  try {
    await auditService.logAction({
      userId,
      action,
      resourceType,
      resourceId,
      details: details ? formatAuditDetails(details) : null,
      ipAddress: getClientIP(),
      userAgent: getUserAgent(),
    })
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error)
    // Não lançar erro para não quebrar o fluxo principal
  }
}

