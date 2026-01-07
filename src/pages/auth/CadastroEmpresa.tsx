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
import { AlertCircle, Building2, FileText, Instagram, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { validateCNPJ, validatePassword, validateEmail } from '@/lib/utils/validations'
import { formatCNPJ } from '@/lib/utils/formatters'

const cadastroSchema = z
  .object({
    cnpj: z.string().min(1, 'CNPJ é obrigatório'),
    razao_social: z.string().min(1, 'Razão social é obrigatória'),
    nome_fantasia: z.string().optional(),
    instagram: z.string().optional(),
    email: z.string().email('Email inválido'),
    confirmar_email: z.string(),
    senha: z.string().min(1, 'Senha é obrigatória'),
    confirmar_senha: z.string(),
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
    const validation = validateCNPJ(data.cnpj)
    return validation.isValid
  }, {
    message: 'CNPJ inválido',
    path: ['cnpj'],
  })

type CadastroFormData = z.infer<typeof cadastroSchema>

export default function CadastroEmpresa() {
  const navigate = useNavigate()
  const { signUpEmpresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      cnpj: '',
      razao_social: '',
      nome_fantasia: '',
      instagram: '',
      email: '',
      confirmar_email: '',
      senha: '',
      confirmar_senha: '',
      aceitar_termos: false,
    },
  })

  const onSubmit = async (data: CadastroFormData) => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔵 [CadastroEmpresa] Enviando dados do formulário:', {
        email: data.email,
        cnpj: data.cnpj,
        razao_social: data.razao_social,
      })
      
      const result = await signUpEmpresa(data)
      console.log('🔵 [CadastroEmpresa] Resultado do signUpEmpresa:', result)

      if (result.success) {
        console.log('✅ [CadastroEmpresa] Cadastro bem-sucedido, redirecionando...')
        toast.success('Cadastro realizado com sucesso! Verifique seu email.')
        navigate('/confirmar-email', { replace: true })
      } else {
        console.error('❌ [CadastroEmpresa] Erro no cadastro:', result.error)
        setError(result.error || 'Erro ao realizar cadastro')
      }
    } catch (err) {
      console.error('❌ [CadastroEmpresa] Erro catch no onSubmit:', err)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Formatar CNPJ enquanto digita
  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value)
    form.setValue('cnpj', formatted, { shouldValidate: true })
  }

  return (
    <AuthLayout
      title="Cadastro de Empresa"
      subtitle="Crie sua conta e comece a anunciar"
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

          {/* CNPJ */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">CNPJ</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <Input
                        {...field}
                        placeholder="00.000.000/0000-00"
                        onChange={(e) => handleCNPJChange(e.target.value)}
                        disabled={loading}
                        className="pl-14 h-12 rounded-xl border-2 focus:border-primary transition-all"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          {/* Razão Social */}
          <FormField
            control={form.control}
            name="razao_social"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Razão Social</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome da empresa" disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nome Fantasia */}
          <FormField
            control={form.control}
            name="nome_fantasia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Fantasia (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome comercial" disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Instagram */}
          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="@suaempresa" disabled={loading} />
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

          {/* Aceitar Termos */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
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
            transition={{ duration: 0.4, delay: 0.55 }}
          >
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Criando conta...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Criar conta
                </>
              )}
            </Button>
          </motion.div>

          {/* Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
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

