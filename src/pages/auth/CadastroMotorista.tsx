import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { AlertCircle, Car, User, Phone, Mail, Lock, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { validateCPF, validatePassword, validatePhone, validatePlaca } from '@/lib/utils/validations'
import { formatCPF, formatPhone, formatPlaca } from '@/lib/utils/formatters'

const cadastroSchema = z
  .object({
    cpf: z.string().min(1, 'CPF é obrigatório'),
    nome: z.string().min(1, 'Nome completo é obrigatório'),
    telefone: z.string().min(1, 'Telefone é obrigatório'),
    email: z.string().email('Email inválido'),
    confirmar_email: z.string(),
    senha: z.string().min(1, 'Senha é obrigatória'),
    confirmar_senha: z.string(),
    veiculo: z.string().min(1, 'Veículo é obrigatório'),
    placa: z.string().min(1, 'Placa é obrigatória'),
    aceitar_termos: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
  })
  .refine((data) => data.email === data.confirmar_email, {
    message: 'Os emails não coincidem',
    path: ['confirmar_email'],
  })
  .refine((data) => data.senha === data.confirmar_senha, {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha'],
  })
  .refine((data) => {
    const validation = validatePassword(data.senha)
    return validation.isValid
  }, {
    message: 'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números',
    path: ['senha'],
  })
  .refine((data) => {
    const validation = validateCPF(data.cpf)
    return validation.isValid
  }, {
    message: 'CPF inválido',
    path: ['cpf'],
  })
  .refine((data) => {
    const validation = validatePhone(data.telefone)
    return validation.isValid
  }, {
    message: 'Telefone inválido',
    path: ['telefone'],
  })
  .refine((data) => {
    const validation = validatePlaca(data.placa)
    return validation.isValid
  }, {
    message: 'Placa inválida',
    path: ['placa'],
  })

type CadastroFormData = z.infer<typeof cadastroSchema>

export default function CadastroMotorista() {
  const navigate = useNavigate()
  const { signUpMotorista } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      cpf: '',
      nome: '',
      telefone: '',
      email: '',
      confirmar_email: '',
      senha: '',
      confirmar_senha: '',
      veiculo: '',
      placa: '',
      aceitar_termos: false,
    },
  })

  const onSubmit = async (data: CadastroFormData) => {
    setLoading(true)
    setError(null)

    try {
      const result = await signUpMotorista(data)

      if (result.success) {
        toast.success('Cadastro realizado com sucesso! Verifique seu email.')
        navigate('/confirmar-email', { replace: true })
      } else {
        setError(result.error || 'Erro ao realizar cadastro')
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Formatação enquanto digita
  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    form.setValue('cpf', formatted, { shouldValidate: true })
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value)
    form.setValue('telefone', formatted, { shouldValidate: true })
  }

  const handlePlacaChange = (value: string) => {
    const formatted = formatPlaca(value)
    form.setValue('placa', formatted.toUpperCase(), { shouldValidate: true })
  }

  return (
    <AuthLayout
      title="Cadastro de Motorista"
      subtitle="Seja um motorista parceiro e ganhe renda extra"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

          {/* CPF */}
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="000.000.000-00"
                    onChange={(e) => handleCPFChange(e.target.value)}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome */}
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Seu nome completo" disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Telefone */}
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="(00) 00000-0000"
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="seu@email.com" disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirmar Email */}
          <FormField
            control={form.control}
            name="confirmar_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="seu@email.com" disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Senha */}
          <FormField
            control={form.control}
            name="senha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="••••••••" disabled={loading} />
                </FormControl>
                <FormDescription>
                  Mínimo 8 caracteres com pelo menos uma letra maiúscula
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirmar Senha */}
          <FormField
            control={form.control}
            name="confirmar_senha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Senha</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="••••••••" disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Veículo */}
          <FormField
            control={form.control}
            name="veiculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ex: Honda Civic" disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Placa */}
          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="ABC1234"
                    onChange={(e) => handlePlacaChange(e.target.value)}
                    disabled={loading}
                    className="uppercase"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Aceitar Termos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <FormField
              control={form.control}
              name="aceitar_termos"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                      className="mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Aceito os{' '}
                      <Link to="/termos" className="text-primary hover:underline font-medium transition-colors" target="_blank">
                        termos de uso
                      </Link>{' '}
                      e{' '}
                      <Link to="/privacidade" className="text-primary hover:underline font-medium transition-colors" target="_blank">
                        política de privacidade
                      </Link>
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </motion.div>

          {/* Botão Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Criando conta...
                </>
              ) : (
                <>
                  <Car className="mr-2 h-4 w-4" />
                  Criar conta
                </>
              )}
            </Button>
          </motion.div>

          {/* Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            className="text-center text-sm text-muted-foreground"
          >
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium transition-colors">
              Fazer login
            </Link>
          </motion.div>
        </form>
      </Form>
    </AuthLayout>
  )
}

