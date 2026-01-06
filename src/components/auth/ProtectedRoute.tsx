import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Spinner } from '@/components/ui/spinner'
import type { UserType } from '@/types/database'

interface ProtectedRouteProps {
  children: ReactNode
  requiredUserType?: UserType | UserType[]
  requireEmailVerified?: boolean
}

export const ProtectedRoute = ({
  children,
  requiredUserType,
  requireEmailVerified = false,
}: ProtectedRouteProps) => {
  const { user, profile, loading, initialized, userType } = useAuth()
  const location = useLocation()

  // Aguardar inicialização
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Se não está autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se não tem profile mas tem user, pode estar carregando ainda
  // Aguardar um pouco antes de redirecionar
  if (!profile && user) {
    // Se ainda está carregando, mostrar spinner
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      )
    }
    // Se não está carregando mas não tem profile, pode ser erro
    // Redirecionar para login após um delay
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Verificar se email está confirmado
  if (requireEmailVerified && !user.email_confirmed_at) {
    return <Navigate to="/confirmar-email" replace />
  }

  // Verificar tipo de usuário
  if (requiredUserType) {
    const allowedTypes = Array.isArray(requiredUserType) ? requiredUserType : [requiredUserType]

    if (!profile) {
      // Se não tem profile ainda, aguardar
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      )
    }

    if (!allowedTypes.includes(profile.tipo)) {
      // Redirecionar para dashboard correto baseado no tipo
      if (userType) {
        const redirectPath = `/${userType}/dashboard`
        return <Navigate to={redirectPath} replace />
      } else {
        // Se não tem userType, redirecionar para login
        return <Navigate to="/login" state={{ from: location }} replace />
      }
    }
  }

  return <>{children}</>
}

