import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook para verificar permissões do usuário atual
 */
export const usePermissions = () => {
  const { permissions } = useAuth()

  /**
   * Verifica se o usuário tem uma permissão específica
   */
  const hasPermission = useMemo(() => {
    return (permissionSlug: string): boolean => {
      if (!permissions || permissions.length === 0) {
        return false
      }
      return permissions.includes(permissionSlug)
    }
  }, [permissions])

  /**
   * Verifica se o usuário tem pelo menos uma das permissões fornecidas
   */
  const hasAnyPermission = useMemo(() => {
    return (permissionSlugs: string[]): boolean => {
      if (!permissions || permissions.length === 0) {
        return false
      }
      return permissionSlugs.some((slug) => permissions.includes(slug))
    }
  }, [permissions])

  /**
   * Verifica se o usuário tem todas as permissões fornecidas
   */
  const hasAllPermissions = useMemo(() => {
    return (permissionSlugs: string[]): boolean => {
      if (!permissions || permissions.length === 0) {
        return false
      }
      return permissionSlugs.every((slug) => permissions.includes(slug))
    }
  }, [permissions])

  /**
   * Verifica se o usuário tem permissão para um recurso e ação específicos
   */
  const hasResourcePermission = useMemo(() => {
    return (resource: string, action: string): boolean => {
      if (!permissions || permissions.length === 0) {
        return false
      }
      const permissionSlug = `${resource}.${action}`
      return permissions.includes(permissionSlug)
    }
  }, [permissions])

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourcePermission,
    permissions,
  }
}

