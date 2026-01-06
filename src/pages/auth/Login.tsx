import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, user, userType } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  })

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user && userType) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      const redirectPath = from || `/${userType}/dashboard`
      navigate(redirectPath, { replace: true })
    }
  }, [user, userType, navigate, location])

  // Timer de bloqueio
  useEffect(() => {
    if (!blocked || !timeRemaining) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          setBlocked(false)
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [blocked, timeRemaining])

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    setBlocked(false)
    setTimeRemaining(null)

    try {
      const result = await signIn(data.email, data.senha)

      if (result.success) {
        toast.success('Login realizado com sucesso!')
        
        // Aguardar userType ser carregado antes de redirecionar
        let attempts = 0
        const maxAttempts = 50 // 5 segundos (50 * 100ms)
        
        const checkUserType = setInterval(() => {
          attempts++
          // Pegar userType atualizado do contexto (será atualizado pelo AuthContext após signIn)
          // Usar um pequeno delay para garantir que o contexto foi atualizado
          
          if (attempts >= maxAttempts) {
            clearInterval(checkUserType)
            console.warn('⚠️ [Login] userType não carregado após 5 segundos')
            // Verificar se email está confirmado
            if (user?.email_confirmed_at) {
              navigate('/confirmar-email', { replace: true })
            } else {
              navigate('/confirmar-email', { replace: true })
            }
          }
        }, 100)

        // Aguardar um pouco para o contexto atualizar
        setTimeout(() => {
          clearInterval(checkUserType)
          
          // Verificar userType novamente após delay
          if (userType) {
            if (userType === 'empresa') {
              navigate('/empresa/dashboard', { replace: true })
            } else if (userType === 'motorista') {
              navigate('/motorista/dashboard', { replace: true })
            } else if (userType === 'admin') {
              navigate('/admin/dashboard', { replace: true })
            } else {
              navigate('/confirmar-email', { replace: true })
            }
          } else {
            // Se ainda não tem userType, aguardar mais ou redirecionar para confirmar email
            navigate('/confirmar-email', { replace: true })
          }
        }, 500)
      } else {
        if (result.blocked && result.timeRemaining) {
          setBlocked(true)
          setTimeRemaining(result.timeRemaining)
          setError(result.error || 'Conta bloqueada temporariamente')
        } else {
          setError(result.error || 'Erro ao fazer login')
        }
        setLoading(false)
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  const formatTimeRemaining = (seconds: number | null): string => {
    if (!seconds) return ''
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para continuar"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Erro de bloqueio */}
          {blocked && timeRemaining && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive" className="border-destructive/50">
                <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <AlertDescription>
                  {error}
                  <br />
                  <span className="font-semibold">
                    Tempo restante: {formatTimeRemaining(timeRemaining)}
                  </span>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Erro geral */}
          {error && !blocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive" className="border-destructive/50">
                <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Email</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-14 h-12 rounded-xl border-2 focus:border-primary transition-all"
                        disabled={loading || blocked}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Senha */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Senha</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="pl-14 h-12 rounded-xl border-2 focus:border-primary transition-all"
                        disabled={loading || blocked}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Esqueci minha senha */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-right"
          >
            <Link
              to="/recuperar-senha"
              className="text-sm text-primary hover:underline font-medium transition-colors"
            >
              Esqueci minha senha
            </Link>
          </motion.div>

          {/* Botão Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              size="lg"
              disabled={loading || blocked}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </motion.div>

          {/* Cadastre-se */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="text-center text-sm text-muted-foreground"
          >
            Ainda não tem conta?{' '}
            <Link to="/cadastro-empresa" className="text-primary hover:underline font-medium transition-colors">
              Cadastre-se aqui
            </Link>
          </motion.div>
        </form>
      </Form>
    </AuthLayout>
  )
}

