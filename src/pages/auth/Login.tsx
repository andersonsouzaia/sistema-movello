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
import { AlertCircle, Lock, Mail, Eye, EyeOff } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  })

  // Redirecionar quando userType estiver disponível após login
  useEffect(() => {
    if (user && userType) {
      // Verificar se email está confirmado
      if (!user.email_confirmed_at) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:46',message:'Email not confirmed, redirecting to verification',data:{userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        navigate('/confirmar-email', { replace: true })
        return
      }

      const from = (location.state as { from?: { pathname: string } })?.from?.pathname
      const redirectPath = from || `/${userType}/dashboard`
      console.log('✅ [Login] Redirecionando após login:', { userType, redirectPath })
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:52',message:'Redirecting after login',data:{userType,redirectPath,emailConfirmed:!!user.email_confirmed_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      navigate(redirectPath, { replace: true })
    } else if (user && !userType) {
      // Se tem user mas não tem userType ainda, aguardar com timeout de 10 segundos
      console.log('⏳ [Login] Aguardando userType ser carregado...')
      
      // Timeout de 10 segundos para evitar espera infinita
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ [Login] Timeout aguardando userType após 10 segundos')
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:63',message:'userType timeout after login',data:{userId:user.id,hasEmailConfirmed:!!user.email_confirmed_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        console.warn('⚠️ [Login] userType não carregado após 10 segundos')
        // Se email não confirmado, redirecionar para confirmação
        if (!user.email_confirmed_at) {
          navigate('/confirmar-email', { replace: true })
        } else {
          // Mostrar erro específico
          setError('Erro ao carregar perfil. Tente fazer login novamente ou entre em contato com o suporte.')
          setLoading(false) // Resetar loading para permitir nova tentativa
        }
      }, 10000) // 10 segundos

      return () => clearTimeout(timeoutId)
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
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:69',message:'Login form submitted',data:{email:data.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const result = await signIn(data.email, data.senha)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:76',message:'signIn result received',data:{success:result.success,error:result.error,blocked:result.blocked},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (result.success) {
        toast.success('Login realizado com sucesso!')
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:95',message:'Login successful, waiting for userType',data:{currentUserType:userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // O redirecionamento será feito pelo useEffect que observa userType
        // Não precisa mais de polling - useEffect já observa mudanças reativas
        // Não resetar loading ainda - será resetado quando redirecionar ou após timeout
        // O loading será resetado pelo useEffect quando redirecionar ou pelo timeout
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
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-14 pr-12 h-12 rounded-xl border-2 focus:border-primary transition-all"
                        disabled={loading || blocked}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
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
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-center">
              <span>Ainda não tem conta?</span>
              <div className="flex items-center gap-3 justify-center">
                <Link to="/cadastro-empresa" className="text-primary hover:underline font-medium transition-colors">
                  Sou empresa
                </Link>
                <span className="text-muted-foreground">ou</span>
                <Link to="/cadastro-motorista" className="text-primary hover:underline font-medium transition-colors">
                  Sou motorista
                </Link>
              </div>
            </div>
          </motion.div>
        </form>
      </Form>
    </AuthLayout>
  )
}

