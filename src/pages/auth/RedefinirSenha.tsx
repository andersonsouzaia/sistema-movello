import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { AlertCircle, Lock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { validatePassword } from '@/lib/utils/validations'

const redefinirSchema = z
  .object({
    senha: z.string().min(1, 'Senha é obrigatória'),
    confirmar_senha: z.string(),
  })
  .refine((data) => data.senha === data.confirmar_senha, {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha'],
  })
  .refine((data) => {
    const validation = validatePassword(data.senha)
    return validation.isValid
  }, (data) => {
    const validation = validatePassword(data.senha)
    return {
      message: validation.error || 'Senha inválida',
      path: ['senha'],
    }
  })

type RedefinirFormData = z.infer<typeof redefinirSchema>

export default function RedefinirSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { updatePassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const form = useForm<RedefinirFormData>({
    resolver: zodResolver(redefinirSchema),
    defaultValues: {
      senha: '',
      confirmar_senha: '',
    },
  })

  useEffect(() => {
    // Tentar obter token da URL
    const tokenFromUrl = searchParams.get('token') || searchParams.get('access_token')
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
    } else {
      setError('Link inválido ou expirado. Solicite um novo link de recuperação.')
    }
  }, [searchParams])

  const onSubmit = async (data: RedefinirFormData) => {
    if (!token) {
      setError('Token inválido. Solicite um novo link de recuperação.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await updatePassword(token, data.senha)

      if (result.success) {
        setSuccess(true)
        toast.success('Senha redefinida com sucesso!')
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 2000)
      } else {
        setError(result.error || 'Erro ao redefinir senha')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Senha Redefinida"
        subtitle="Sua senha foi alterada com sucesso"
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
                Sua senha foi redefinida com sucesso! Você será redirecionado para a página de login.
              </AlertDescription>
            </Alert>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Button asChild variant="hero" className="w-full" size="lg">
              <Link to="/login">Ir para login</Link>
            </Button>
          </motion.div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Redefinir Senha"
      subtitle="Digite sua nova senha"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Nova Senha</FormLabel>
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
                        disabled={loading || !token}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-sm text-muted-foreground">
                    Mínimo 8 caracteres com pelo menos uma letra maiúscula
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <FormField
              control={form.control}
              name="confirmar_senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Confirmar Nova Senha</FormLabel>
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
                        disabled={loading || !token}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Button
              type="submit"
              variant="hero"
              className="w-full"
              size="lg"
              disabled={loading || !token}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir senha'
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-center text-sm text-muted-foreground"
          >
            <Link to="/login" className="text-primary hover:underline font-medium transition-colors">
              Voltar para login
            </Link>
          </motion.div>
        </form>
      </Form>
    </AuthLayout>
  )
}

