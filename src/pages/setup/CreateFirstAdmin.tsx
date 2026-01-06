import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { AuthLayout } from '@/components/layouts/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/utils/errorHandler'
import { validatePassword } from '@/lib/utils/validations'
import { toast } from 'sonner'

const createAdminSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  confirmar_senha: z.string(),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
}).refine((data) => {
  const validation = validatePassword(data.senha)
  return validation.isValid
}, (data) => {
  const validation = validatePassword(data.senha)
  return {
    message: validation.error || 'Senha inválida',
    path: ['senha'],
  }
}).refine((data) => data.senha === data.confirmar_senha, {
  message: 'As senhas não coincidem',
  path: ['confirmar_senha'],
})

type CreateAdminFormData = z.infer<typeof createAdminSchema>

export default function CreateFirstAdmin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasAdmin, setHasAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      email: '',
      senha: '',
      confirmar_senha: '',
      nome: '',
    },
  })

  // Verificar se já existe admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.rpc('has_admin')

        if (error) {
          console.error('Erro ao verificar admin:', error)
          setChecking(false)
          return
        }

        if (data) {
          setHasAdmin(true)
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 2000)
        }

        setChecking(false)
      } catch (err) {
        console.error('Erro ao verificar admin:', err)
        setChecking(false)
      }
    }

    checkAdmin()
  }, [navigate])

  const onSubmit = async (data: CreateAdminFormData) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/dashboard`,
        },
      })

      if (authError) {
        const errorMessage = handleError(authError, 'auth')
        setError(errorMessage.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Erro ao criar usuário')
        setLoading(false)
        return
      }

      // 2. Confirmar email automaticamente (sem 2FA para primeiro admin)
      const { error: confirmError } = await supabase.rpc('confirm_user_email', {
        p_user_id: authData.user.id,
      })

      if (confirmError) {
        console.warn('⚠️ Erro ao confirmar email automaticamente:', confirmError)
        // Continuar mesmo assim
      }

      // 3. Criar registro em users usando função SQL (bypass RLS)
      const { data: userResult, error: userError } = await supabase.rpc('create_user_after_signup', {
        p_user_id: authData.user.id,
        p_email: data.email,
        p_nome: data.nome,
        p_tipo: 'admin',
        p_status: 'ativo',
      })

      if (userError) {
        console.error('❌ Erro ao criar user via função:', {
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
          fullError: userError
        })
        
        // Tentar método direto como fallback
        const { error: directError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            nome: data.nome,
            tipo: 'admin',
            status: 'ativo',
          })

        if (directError) {
          console.error('❌ Erro ao criar user (fallback direto):', {
            code: directError.code,
            message: directError.message,
            details: directError.details,
            hint: directError.hint,
            fullError: directError
          })
          setError(`Erro ao criar registro do usuário: ${directError.message || 'Erro desconhecido'}`)
          setLoading(false)
          return
        } else {
          console.log('✅ Usuário criado via método direto (fallback)')
        }
      } else {
        console.log('✅ Usuário criado via função SQL:', userResult)
      }

      // 4. Criar registro em admins usando função SQL (bypass RLS)
      const { data: adminResult, error: adminError } = await supabase.rpc('create_admin_after_signup', {
        p_user_id: authData.user.id,
        p_nivel_acesso: 'super_admin',
        p_ativo: true,
      })

      if (adminError) {
        console.error('❌ Erro ao criar admin via função:', {
          code: adminError.code,
          message: adminError.message,
          details: adminError.details,
          hint: adminError.hint,
          fullError: adminError
        })
        
        // Tentar método direto como fallback
        const { error: directError } = await supabase
          .from('admins')
          .insert({
            id: authData.user.id,
            nivel_acesso: 'super_admin',
            ativo: true,
          })

        if (directError) {
          console.error('❌ Erro ao criar admin (fallback direto):', {
            code: directError.code,
            message: directError.message,
            details: directError.details,
            hint: directError.hint,
            fullError: directError
          })
          setError(`Erro ao criar registro de admin: ${directError.message || 'Erro desconhecido'}`)
          setLoading(false)
          return
        } else {
          console.log('✅ Admin criado via método direto (fallback)')
        }
      } else {
        console.log('✅ Admin criado via função SQL:', adminResult)
      }

      // 5. Atribuir role super_admin usando função SQL
      const { error: roleError } = await supabase.rpc('assign_role_to_user', {
        p_user_id: authData.user.id,
        p_role_slug: 'super_admin',
        p_is_primary: true,
      })

      if (roleError) {
        console.error('Erro ao atribuir role:', roleError)
        // Não falhar se não conseguir atribuir role (pode ser que a migração não tenha sido executada)
        console.warn('⚠️ Role não atribuída. Execute a migração 004_user_roles_system.sql')
      }

      // 6. Fazer login automático após criar admin
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      })

      if (loginError) {
        console.warn('⚠️ Erro ao fazer login automático:', loginError)
        toast.success('Primeiro admin criado com sucesso! Faça login manualmente.')
        setTimeout(() => {
          navigate('/login', { replace: true })
        }, 1500)
        setLoading(false) // IMPORTANTE: Resetar loading
        return
      }

      toast.success('Primeiro admin criado com sucesso! Redirecionando...')
      
      // Aguardar um pouco para o AuthContext processar o SIGNED_IN
      // e então redirecionar
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true })
        setLoading(false) // IMPORTANTE: Resetar loading após navegação
      }, 1500)
    } catch (err) {
      console.error('Erro ao criar admin:', err)
      const errorMessage = handleError(err)
      setError(errorMessage.message)
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <AuthLayout
        title="Verificando Sistema"
        subtitle="Aguarde enquanto verificamos o estado do sistema"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    )
  }

  if (hasAdmin) {
    return (
      <AuthLayout
        title="Admin Já Existe"
        subtitle="O sistema já possui um administrador configurado"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="border-primary/20 bg-primary/5">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <AlertDescription>
              O sistema já possui um administrador. Você será redirecionado para a página de login.
            </AlertDescription>
          </Alert>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Configuração Inicial"
      subtitle="Crie o primeiro administrador do sistema"
    >
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              {...form.register('nome')}
              className="h-12"
            />
            {form.formState.errors.nome && (
              <p className="text-sm text-destructive">
                {form.formState.errors.nome.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...form.register('email')}
              className="h-12"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Mínimo 8 caracteres, 1 maiúscula"
              {...form.register('senha')}
              className="h-12"
            />
            {form.formState.errors.senha && (
              <p className="text-sm text-destructive">
                {form.formState.errors.senha.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar_senha">Confirmar Senha</Label>
            <Input
              id="confirmar_senha"
              type="password"
              placeholder="Digite a senha novamente"
              {...form.register('confirmar_senha')}
              className="h-12"
            />
            {form.formState.errors.confirmar_senha && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmar_senha.message}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando Admin...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Criar Primeiro Admin
              </>
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center text-sm text-muted-foreground"
        >
          <p>
            Este é o primeiro acesso ao sistema. Após criar o admin, você poderá fazer login normalmente.
          </p>
        </motion.div>
      </form>
    </AuthLayout>
  )
}

