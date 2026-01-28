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

  // Se não tem profile mas tem user, pode estar carregando ainda ou falhou
  // Tentar recuperar automaticamente antes de mostrar erro
  useEffect(() => {
    let mounted = true

    const tryRecoverProfile = async () => {
      if (user && !profile && !loading && initialized) {
        console.log('🔄 [ProtectedRoute] Perfil faltando, tentando recuperação automática...')
        // Pequeno delay para garantir que não é apenas um lag de estado
        await new Promise(r => setTimeout(r, 1000))
        if (!mounted) return

        // Se ainda estiver sem perfil, tentar refresh force
        if (!profile && !loading) {
          // Usar a função checkSession ou acessar o refreshUser do contexto se disponível
          // Como refreshUser não está desestruturado, vamos assumir que o fluxo de auth cuidará ou recarregaremos
          // Mas para ser proativo:
          window.location.reload() // Refresh simples como última tentativa automática
        }
      }
    }

    // Apenas executar se estiver nessa estado "limbo" por mais de 2s
    let timeout: NodeJS.Timeout
    if (user && !profile && !loading && initialized) {
      timeout = setTimeout(() => {
        // Auto-reload da página uma vez se travar aqui?
        // Melhor mostrar o botão de tentar novamente para não criar loop infinito de F5
        tryRecoverProfile()
      }, 2000)
    }

    return () => {
      mounted = false
      if (timeout) clearTimeout(timeout)
    }
  }, [user, profile, loading, initialized])

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
              // Forçar logout limpo e ir para login
              localStorage.removeItem('supabase.auth.token')
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

