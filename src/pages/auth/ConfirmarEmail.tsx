import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useEmailVerification } from '@/hooks/useEmailVerification'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { AlertCircle, CheckCircle2, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function ConfirmarEmail() {
  const navigate = useNavigate()
  const { user, userType, loading, initialized, checkSession } = useAuth()
  const { verifyCode, resendCode, loading: verificationLoading, error, timeRemaining, canResend } = useEmailVerification()
  const [code, setCode] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  // Buscar email de múltiplas fontes ao montar
  useEffect(() => {
    const getEmail = async () => {
      console.log('🔵 [ConfirmarEmail] Buscando email...')
      let emailToUse = user?.email
      
      if (!emailToUse) {
        const { data: { session } } = await supabase.auth.getSession()
        emailToUse = session?.user?.email || null
      }
      
      if (!emailToUse) {
        emailToUse = localStorage.getItem('pending_email_verification')
      }
      
      if (emailToUse) {
        console.log('✅ [ConfirmarEmail] Email encontrado:', emailToUse)
        setEmail(emailToUse)
      } else {
        console.warn('⚠️ [ConfirmarEmail] Email não encontrado')
      }
    }
    
    getEmail()
    checkSession()
  }, [user, checkSession])

  // Redirecionar se não houver usuário ou se email já estiver confirmado
  useEffect(() => {
    // Não redirecionar se ainda está carregando
    if (loading || !initialized) {
      return
    }

    console.log('🔵 [ConfirmarEmail] Verificando estado do usuário...', { 
      hasUser: !!user, 
      emailConfirmed: !!user?.email_confirmed_at,
      userType,
      loading,
      initialized
    })
    
    // Se não tem usuário, redirecionar para login (não para home)
    if (!user) {
      console.log('⚠️ [ConfirmarEmail] Usuário não encontrado, redirecionando para login')
      navigate('/login', { replace: true })
      return
    }
    
    // Se email já confirmado e tem userType, redirecionar
    if (user?.email_confirmed_at && userType) {
      console.log('✅ [ConfirmarEmail] Email já confirmado, redirecionando...', { userType })
      if (userType === 'empresa') {
        navigate('/empresa/dashboard', { replace: true })
      } else if (userType === 'motorista') {
        navigate('/motorista/dashboard', { replace: true })
      } else if (userType === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        // Se não tem userType mas email confirmado, aguardar ou mostrar erro
        console.warn('⚠️ [ConfirmarEmail] Email confirmado mas userType não encontrado')
      }
    }
  }, [user, userType, navigate, loading, initialized])

  const handleVerify = async () => {
    if (code.length !== 8) {
      toast.error('Digite o código completo de 8 dígitos')
      return
    }

    console.log('🔵 [ConfirmarEmail] Verificando código...', { 
      codeLength: code.length,
      userEmail: user?.email 
    })

    const result = await verifyCode(code)
    console.log('🔵 [ConfirmarEmail] Resultado da verificação:', result)

    if (result.success) {
      setSuccess(true)
      toast.success('Email confirmado com sucesso!')
      
      // Aguardar o userType ser carregado antes de redirecionar
      let attempts = 0
      const maxAttempts = 50 // 5 segundos (50 * 100ms)
      
      const checkUserType = setInterval(() => {
        attempts++
        console.log('🔵 [ConfirmarEmail] Verificando userType...', { userType, attempt: attempts })
        
        // Verificar userType atualizado do contexto
        const currentUserType = userType
        
        if (currentUserType) {
          clearInterval(checkUserType)
          console.log('✅ [ConfirmarEmail] userType carregado, redirecionando...', { userType: currentUserType })
          if (currentUserType === 'empresa') {
            navigate('/empresa/dashboard', { replace: true })
          } else if (currentUserType === 'motorista') {
            navigate('/motorista/dashboard', { replace: true })
          } else if (currentUserType === 'admin') {
            navigate('/admin/dashboard', { replace: true })
          } else {
            // Se userType não reconhecido, aguardar mais ou redirecionar para login
            console.warn('⚠️ [ConfirmarEmail] userType não reconhecido:', currentUserType)
            navigate('/login', { replace: true })
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkUserType)
          console.warn('⚠️ [ConfirmarEmail] userType não carregado após 5 segundos, redirecionando para login')
          navigate('/login', { replace: true })
        }
      }, 100) // Verificar a cada 100ms
    } else {
      console.error('❌ [ConfirmarEmail] Erro na verificação:', result.error)
      setCode('') // Limpar código em caso de erro
      toast.error(result.error || 'Erro ao verificar código')
    }
  }

  const handleResend = async () => {
    const result = await resendCode()
    if (result.success) {
      toast.success('Código reenviado! Verifique seu email.')
      setCode('')
    } else {
      toast.error(result.error || 'Erro ao reenviar código')
    }
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (success) {
    return (
      <AuthLayout
        title="Email Confirmado"
        subtitle="Sua conta foi verificada com sucesso"
      >
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Alert className="border-primary/20 bg-primary/5">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <AlertDescription>
                Seu email foi confirmado! Você será redirecionado para o dashboard.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Confirmar Email"
      subtitle="Digite o código de 8 dígitos enviado para seu email"
    >
      <div className="space-y-6">
        {error && (
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex justify-center">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
              <InputOTP
                maxLength={8}
                value={code}
                onChange={setCode}
                disabled={loading || success}
              >
                <InputOTPGroup>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {timeRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <p className="text-sm text-muted-foreground">
                  Código expira em:{' '}
                  <span className="font-semibold text-foreground">
                    {formatTime(timeRemaining)}
                  </span>
                </p>
              </div>
            </motion.div>
          )}

          {timeRemaining === 0 && (
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
                  O código expirou. Solicite um novo código.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Button
            onClick={handleVerify}
            variant="hero"
            className="w-full"
            size="lg"
            disabled={loading || code.length !== 8 || success || timeRemaining === 0}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Verificando...
              </>
            ) : (
              'Verificar código'
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-2"
        >
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={!canResend || loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {canResend ? 'Reenviar código' : `Aguarde ${Math.ceil(timeRemaining / 60)} minuto(s)`}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Não recebeu o código? Verifique sua caixa de entrada e spam.
            </p>
          </div>
        </motion.div>

        {email && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-center text-sm"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Código enviado para:{' '}
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  )
}

