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
    // Em vez de redirecionar imediatamente (que causa loop), mostrar erro e opção de retry
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-4">
          <Spinner className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">Erro ao carregar perfil</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          Não foi possível carregar seus dados de perfil. Isso pode ocorrer por falha de conexão.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => {
              // Forçar logout limpo
              localStorage.clear()
              window.location.href = '/login'
            }}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Voltar para Login
          </button>
        </div>
      </div>
    )
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

