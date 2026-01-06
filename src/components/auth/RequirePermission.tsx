import { ReactNode } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface RequirePermissionProps {
  children: ReactNode
  permission: string | string[]
  fallback?: ReactNode
  showError?: boolean
}

/**
 * Componente wrapper para proteger conteúdo baseado em permissões
 * 
 * @example
 * <RequirePermission permission="empresas.approve">
 *   <Button>Aprovar Empresa</Button>
 * </RequirePermission>
 * 
 * @example
 * <RequirePermission permission={["empresas.approve", "empresas.block"]} showError>
 *   <Button>Ações</Button>
 * </RequirePermission>
 */
export const RequirePermission = ({
  children,
  permission,
  fallback = null,
  showError = false,
}: RequirePermissionProps) => {
  const { hasPermission, hasAnyPermission } = usePermissions()

  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission)

  if (hasAccess) {
    return <>{children}</>
  }

  if (showError) {
    return (
      <Alert variant="destructive" className="border-destructive/50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar este conteúdo.
        </AlertDescription>
      </Alert>
    )
  }

  return <>{fallback}</>
}

