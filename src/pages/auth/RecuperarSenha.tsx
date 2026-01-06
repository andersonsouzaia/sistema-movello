import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { toast } from 'sonner'

const recuperarSchema = z.object({
  email: z.string().email('Email inválido'),
})

type RecuperarFormData = z.infer<typeof recuperarSchema>

export default function RecuperarSenha() {
  const { resetPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<RecuperarFormData>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: RecuperarFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await resetPassword(data.email)

      if (result.success) {
        setSuccess(true)
        toast.success('Email de recuperação enviado!')
      } else {
        // Não revelar se o email existe ou não por segurança
        setError('Se o email existir, você receberá um link de recuperação.')
      }
    } catch (err) {
      setError('Erro ao processar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Email Enviado"
        subtitle="Verifique sua caixa de entrada"
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
                Se o email informado estiver cadastrado, você receberá um link para redefinir sua senha.
                Verifique sua caixa de entrada e spam.
              </AlertDescription>
            </Alert>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-center space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setSuccess(false)
                  form.reset()
                }}
                variant="outline"
                className="w-full"
              >
                Tentar outro email
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">Voltar para login</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recuperar Senha"
      subtitle="Digite seu email para receber o link de recuperação"
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
                        disabled={loading}
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
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-center text-sm text-muted-foreground"
          >
            Lembrou sua senha?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium transition-colors">
              Fazer login
            </Link>
          </motion.div>
        </form>
      </Form>
    </AuthLayout>
  )
}

