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
import { AlertCircle, Car, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { validateCPF, validatePassword, validatePhone, validatePlaca } from '@/lib/utils/validations'
import { formatCPF, formatPhone, formatPlaca, cleanCPF, cleanPhone, cleanPlaca } from '@/lib/utils/formatters'
import type { CadastroMotoristaFormData } from '@/types/database'

const cadastroSchema = z
  .object({
    cpf: z
      .string()
      .min(1, 'CPF é obrigatório')
      .refine((val) => {
        if (!val) return true
        const validation = validateCPF(val)
        return validation.isValid
      }, (val) => {
        if (!val) return { message: 'CPF é obrigatório' }
        const validation = validateCPF(val)
        return { message: validation.error || 'CPF inválido' }
      }),
    nome: z.string().min(1, 'Nome completo é obrigatório'),
    telefone: z
      .string()
      .min(1, 'Telefone é obrigatório')
      .refine((val) => {
        if (!val) return true
        const validation = validatePhone(val)
        return validation.isValid
      }, (val) => {
        if (!val) return { message: 'Telefone é obrigatório' }
        const validation = validatePhone(val)
        return { message: validation.error || 'Telefone inválido' }
      }),
    email: z.string().email('Email inválido'),
    confirmar_email: z.string().min(1, 'Confirmação de email é obrigatória'),
    senha: z
      .string()
      .min(1, 'Senha é obrigatória')
      .refine((val) => {
        if (!val) return true
        const validation = validatePassword(val)
        return validation.isValid
      }, (val) => {
        if (!val) return { message: 'Senha é obrigatória' }
        const validation = validatePassword(val)
        return { message: validation.error || 'Senha inválida' }
      }),
    confirmar_senha: z.string().min(1, 'Confirmação de senha é obrigatória'),
    veiculo: z.string().min(1, 'Veículo é obrigatório'),
    placa: z
      .string()
      .min(1, 'Placa é obrigatória')
      .refine((val) => {
        // Se vazio, deixa a validação básica (.min) tratar
        if (!val || val.trim().length === 0) return true
        
        // Remove formatação (hífen, espaços) e converte para maiúsculo
        // Isso garante que "FSN-8659" vira "FSN8659" antes de validar
        const placaLimpa = cleanPlaca(val)
        
        // Durante a digitação, permite valores parciais (menos de 7 caracteres)
        // Só valida quando a placa estiver completa (exatamente 7 caracteres limpos)
        if (placaLimpa.length < 7) return true
        
        // Se tiver mais de 7 caracteres limpos, é inválido
        if (placaLimpa.length > 7) return false
        
        // Valida apenas quando tiver exatamente 7 caracteres limpos
        const validation = validatePlaca(placaLimpa)
        return validation.isValid
      }, {
        message: 'Placa inválida. Use o formato ABC1234 ou ABC1D23',
      }),
    aceitar_termos: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos de uso',
    }),
  })
  .refine((data) => {
    if (!data.email || !data.confirmar_email) return true
    return data.email === data.confirmar_email
  }, {
    message: 'Os emails não coincidem',
    path: ['confirmar_email'],
  })
  .refine((data) => {
    if (!data.senha || !data.confirmar_senha) return true
    return data.senha === data.confirmar_senha
  }, {
    message: 'As senhas não coincidem',
    path: ['confirmar_senha'],
  })

type CadastroFormData = z.infer<typeof cadastroSchema>

export default function CadastroMotorista() {
  const navigate = useNavigate()
  const { signUpMotorista } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadastroMotorista.tsx:133',message:'Driver signup form submitted',data:{email:data.email,cpf:data.cpf,nome:data.nome},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log('🔵 [CadastroMotorista] Enviando dados do formulário:', {
        email: data.email,
        cpf: data.cpf,
        nome: data.nome,
      })
      
      // Preparar dados para envio (limpar formatação)
      const dadosParaEnvio: CadastroMotoristaFormData = {
        ...data,
        cpf: cleanCPF(data.cpf),
        telefone: cleanPhone(data.telefone),
        placa: cleanPlaca(data.placa),
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadastroMotorista.tsx:152',message:'Calling signUpMotorista',data:{cleanedCPF:dadosParaEnvio.cpf,cleanedPhone:dadosParaEnvio.telefone,cleanedPlaca:dadosParaEnvio.placa},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const result = await signUpMotorista(dadosParaEnvio)
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadastroMotorista.tsx:154',message:'signUpMotorista result received',data:{success:result.success,error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log('🔵 [CadastroMotorista] Resultado do signUpMotorista:', result)

      if (result.success) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadastroMotorista.tsx:157',message:'Driver signup successful, navigating to email verification',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.log('✅ [CadastroMotorista] Cadastro bem-sucedido, redirecionando...')
        toast.success('Cadastro realizado com sucesso! Verifique seu email.')
        navigate('/confirmar-email', { replace: true })
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadastroMotorista.tsx:162',message:'Driver signup failed',data:{error:result.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('❌ [CadastroMotorista] Erro no cadastro:', result.error)
        setError(result.error || 'Erro ao realizar cadastro')
      }
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/30e3f810-e32f-4652-aa52-6ee6d50e3d85',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadastroMotorista.tsx:167',message:'Driver signup exception',data:{error:err instanceof Error?err.message:'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('❌ [CadastroMotorista] Erro catch no onSubmit:', err)
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const onError = (errors: any) => {
    console.error('❌ [CadastroMotorista] Erros de validação:', errors)
    
    // Buscar o primeiro erro com mensagem válida
    const errorEntries = Object.entries(errors)
    
    // Prioridade: buscar erros específicos primeiro
    const priorityFields = ['placa', 'cpf', 'telefone', 'senha', 'email', 'confirmar_email', 'confirmar_senha', 'nome', 'veiculo', 'aceitar_termos']
    
    for (const field of priorityFields) {
      if (errors[field]?.message) {
        const message = errors[field].message
        if (message && message !== 'Invalid input') {
          setError(message)
          return
        }
      }
    }
    
    // Se não encontrou, buscar em qualquer campo
    for (const [key, error] of errorEntries) {
      const err = error as any
      if (err?.message && err.message !== 'Invalid input') {
        setError(err.message)
        return
      }
    }
    
    // Se ainda não encontrou, mostrar erro genérico
    setError('Por favor, verifique os campos do formulário.')
  }

  return (
    <AuthLayout
      title="Cadastro de Motorista"
      subtitle="Seja um motorista parceiro e ganhe renda extra"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-5">
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
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value)
                      field.onChange(formatted)
                    }}
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
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
                      field.onChange(formatted)
                    }}
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
                  <div className="relative">
                    <Input 
                      {...field} 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      disabled={loading}
                      className="pr-12"
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
                  <div className="relative">
                    <Input 
                      {...field} 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      disabled={loading}
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
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
                    onChange={(e) => {
                      const formatted = formatPlaca(e.target.value)
                      field.onChange(formatted)
                    }}
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
