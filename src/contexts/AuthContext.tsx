import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/utils/errorHandler'
import type {
  User,
  Empresa,
  Motorista,
  Admin,
  UserType,
  LoginAttemptResult,
  CadastroEmpresaFormData,
  CadastroMotoristaFormData,
} from '@/types/database'
import { validatePassword, validateCPF, validateCNPJ, validateEmail } from '@/lib/utils/validations'
import { cleanCPF, cleanCNPJ } from '@/lib/utils/formatters'

// ============================================
// TIPOS DO CONTEXT
// ============================================

interface AuthContextType {
  // Estado
  user: SupabaseUser | null
  profile: User | null
  empresa: Empresa | null
  motorista: Motorista | null
  admin: Admin | null
  userType: UserType | null
  permissions: string[]
  roles: Array<{ role_id: string; role_name: string; role_slug: string; is_primary: boolean }>
  loading: boolean
  initialized: boolean

  // Funções
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; blocked?: boolean; timeRemaining?: number }>
  signUpEmpresa: (data: CadastroEmpresaFormData) => Promise<{ success: boolean; error?: string }>
  signUpMotorista: (data: CadastroMotoristaFormData) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>
  resendVerificationCode: () => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
  checkSession: () => Promise<void>
  checkPermission: (permissionSlug: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [motorista, setMotorista] = useState<Motorista | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<Array<{ role_id: string; role_name: string; role_slug: string; is_primary: boolean }>>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false) // Flag para prevenir múltiplas chamadas simultâneas
  const processingAuthEventRef = useRef(false) // Ref para prevenir processamento duplicado de eventos
  const currentUserRef = useRef<SupabaseUser | null>(null) // Ref para acessar user atual no callback
  const currentProfileRef = useRef<User | null>(null) // Ref para acessar profile atual no callback
  const navigate = useNavigate()

  // ============================================
  // CARREGAR PERFIL COMPLETO
  // ============================================

  const loadUserProfile = async (userId: string): Promise<void> => {
    // Prevenir múltiplas chamadas simultâneas
    if (isLoadingProfile) {
      console.log('⚠️ [loadUserProfile] Já está carregando perfil, ignorando chamada duplicada')
      return
    }

    // Se já temos o perfil carregado para este usuário, não recarregar
    if (profile && profile.id === userId) {
      console.log('✅ [loadUserProfile] Perfil já carregado para este usuário')
      return
    }

    setIsLoadingProfile(true)
    
    try {
      console.log('🔵 [loadUserProfile] Carregando perfil para:', userId)
      
      // Buscar perfil base usando função SQL (bypass RLS)
      const { data: userDataArray, error: userError } = await supabase.rpc('get_user_profile', {
        p_user_id: userId,
      })

      let userData: User | null = null

      if (userError) {
        console.error('❌ [loadUserProfile] Erro ao buscar user via função:', {
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
        })
        
        // Fallback: tentar método direto
        const { data: userDataDirect, error: directError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (directError) {
          console.error('❌ [loadUserProfile] Erro ao buscar user (fallback direto):', {
            code: directError.code,
            message: directError.message,
            details: directError.details,
            hint: directError.hint,
          })
          throw directError
        }
        
        if (!userDataDirect) {
          console.warn('⚠️ [loadUserProfile] UserData não encontrado')
          return
        }
        
        userData = userDataDirect
      } else {
        // A função retorna uma tabela, então pode ser array ou objeto único
        if (Array.isArray(userDataArray)) {
          userData = userDataArray.length > 0 ? userDataArray[0] : null
        } else {
          userData = userDataArray as User | null
        }
        
        if (!userData) {
          console.warn('⚠️ [loadUserProfile] UserData não encontrado via função')
          return
        }
      }

      console.log('✅ [loadUserProfile] UserData encontrado:', { tipo: userData.tipo })
      setProfile(userData)
      currentProfileRef.current = userData // Atualizar ref também
      setUserType(userData.tipo)

      // Carregar roles e permissões
      try {
        const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles', {
          p_user_id: userId,
        })

        if (!rolesError && userRoles) {
          console.log('✅ [loadUserProfile] Roles carregados:', userRoles)
          setRoles(userRoles)
          
          // Buscar permissões
          const { data: userPermissions, error: permissionsError } = await supabase.rpc('get_user_permissions', {
            p_user_id: userId,
          })

          if (!permissionsError && userPermissions) {
            const permissionSlugs = userPermissions.map((p: { permission_slug: string }) => p.permission_slug)
            console.log('✅ [loadUserProfile] Permissões carregadas:', permissionSlugs)
            setPermissions(permissionSlugs)
          } else if (permissionsError) {
            console.warn('⚠️ [loadUserProfile] Erro ao buscar permissões:', permissionsError)
          }
        } else if (rolesError) {
          console.warn('⚠️ [loadUserProfile] Erro ao buscar roles:', rolesError)
        }
      } catch (rolesError) {
        console.warn('⚠️ [loadUserProfile] Erro ao carregar roles/permissões:', rolesError)
        // Continuar mesmo se não conseguir carregar roles
      }

      // Buscar perfil específico baseado no tipo
      if (userData.tipo === 'empresa') {
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .select('*')
          .eq('id', userId)
          .single()

        if (!empresaError && empresaData) {
          console.log('✅ [loadUserProfile] Empresa carregada')
          setEmpresa(empresaData)
        } else if (empresaError) {
          console.warn('⚠️ [loadUserProfile] Erro ao buscar empresa:', empresaError)
        }
      } else if (userData.tipo === 'motorista') {
        const { data: motoristaData, error: motoristaError } = await supabase
          .from('motoristas')
          .select('*')
          .eq('id', userId)
          .single()

        if (!motoristaError && motoristaData) {
          console.log('✅ [loadUserProfile] Motorista carregado')
          setMotorista(motoristaData)
        } else if (motoristaError) {
          console.warn('⚠️ [loadUserProfile] Erro ao buscar motorista:', motoristaError)
        }
      } else if (userData.tipo === 'admin') {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('id', userId)
          .single()

        if (!adminError && adminData) {
          console.log('✅ [loadUserProfile] Admin carregado')
          setAdmin(adminData)
        } else if (adminError) {
          console.warn('⚠️ [loadUserProfile] Erro ao buscar admin:', adminError)
        }
      }

      // Atualizar último acesso (não crítico se falhar)
      try {
        await supabase
          .from('users')
          .update({ ultimo_acesso: new Date().toISOString() })
          .eq('id', userId)
      } catch (updateError) {
        console.warn('⚠️ [loadUserProfile] Erro ao atualizar último acesso:', updateError)
        // Não falhar o fluxo por isso
      }
      
      console.log('✅ [loadUserProfile] Perfil carregado com sucesso')
    } catch (error) {
      console.error('❌ [loadUserProfile] Erro ao carregar perfil:', error)
      // Re-throw para que o chamador saiba que houve erro
      throw error
    } finally {
      setIsLoadingProfile(false) // IMPORTANTE: Sempre resetar o flag
    }
  }

  // ============================================
  // VERIFICAR PERMISSÃO
  // ============================================

  const checkPermission = (permissionSlug: string): boolean => {
    if (!permissions || permissions.length === 0) {
      return false
    }
    return permissions.includes(permissionSlug)
  }

  // ============================================
  // VERIFICAR TENTATIVAS DE LOGIN
  // ============================================

  const checkLoginAttempts = async (email: string, userId?: string): Promise<LoginAttemptResult | null> => {
    try {
      const { data, error } = await supabase.rpc('registrar_tentativa_login', {
        p_email: email,
        p_user_id: userId || null,
      })

      if (error) {
        console.error('Erro ao verificar tentativas:', error)
        return null
      }

      return data as LoginAttemptResult
    } catch (error) {
      console.error('Erro ao verificar tentativas:', error)
      return null
    }
  }

  // ============================================
  // RESETAR TENTATIVAS
  // ============================================

  const resetLoginAttempts = async (userId: string): Promise<void> => {
    try {
      await supabase.rpc('resetar_tentativas_login', {
        p_user_id: userId,
      })
    } catch (error) {
      console.error('Erro ao resetar tentativas:', error)
    }
  }

  // ============================================
  // SIGN IN
  // ============================================

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; blocked?: boolean; timeRemaining?: number }> => {
    try {
      // Verificar tentativas antes de tentar login
      const attemptResult = await checkLoginAttempts(email)

      if (attemptResult?.bloqueado) {
        return {
          success: false,
          blocked: true,
          timeRemaining: attemptResult.tempo_restante_segundos,
          error: attemptResult.mensagem || 'Conta bloqueada temporariamente',
        }
      }

      // Tentar login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Registrar tentativa falhada
        await checkLoginAttempts(email, data?.user?.id || undefined)

        const errorMessage = handleError(error, 'auth')
        return {
          success: false,
          error: errorMessage.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Erro ao fazer login. Tente novamente.',
        }
      }

      // Resetar tentativas após login bem-sucedido
      await resetLoginAttempts(data.user.id)

      // Carregar perfil completo
      await loadUserProfile(data.user.id)

      setUser(data.user)

      return { success: true }
    } catch (error) {
      const errorMessage = handleError(error, 'auth')
      return {
        success: false,
        error: errorMessage.message,
      }
    }
  }

  // ============================================
  // SIGN UP EMPRESA
  // ============================================

  const signUpEmpresa = async (data: CadastroEmpresaFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔵 [signUpEmpresa] Iniciando cadastro de empresa...', { email: data.email, cnpj: data.cnpj })
      
      // Validações
      const emailValidation = validateEmail(data.email)
      if (!emailValidation.isValid) {
        console.error('❌ [signUpEmpresa] Email inválido:', emailValidation.error)
        return { success: false, error: emailValidation.error }
      }

      if (data.email !== data.confirmar_email) {
        console.error('❌ [signUpEmpresa] Emails não coincidem')
        return { success: false, error: 'Os emails não coincidem' }
      }

      const passwordValidation = validatePassword(data.senha)
      if (!passwordValidation.isValid) {
        console.error('❌ [signUpEmpresa] Senha inválida:', passwordValidation.error)
        return { success: false, error: passwordValidation.error }
      }

      if (data.senha !== data.confirmar_senha) {
        console.error('❌ [signUpEmpresa] Senhas não coincidem')
        return { success: false, error: 'As senhas não coincidem' }
      }

      const cnpjValidation = validateCNPJ(data.cnpj)
      if (!cnpjValidation.isValid) {
        console.error('❌ [signUpEmpresa] CNPJ inválido:', cnpjValidation.error)
        return { success: false, error: cnpjValidation.error }
      }

      if (!data.aceitar_termos) {
        console.error('❌ [signUpEmpresa] Termos não aceitos')
        return { success: false, error: 'Você deve aceitar os termos de uso' }
      }

      // Criar usuário no Supabase Auth
      console.log('🔵 [signUpEmpresa] Criando usuário no Supabase Auth...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/confirmar-email`,
        },
      })

      console.log('🔵 [signUpEmpresa] Auth signUp resultado:', { 
        userId: authData?.user?.id, 
        email: authData?.user?.email,
        error: authError 
      })

      if (authError) {
        console.error('❌ [signUpEmpresa] Erro no auth signUp:', authError)
        const errorMessage = handleError(authError, 'auth')
        return { success: false, error: errorMessage.message }
      }

      if (!authData.user) {
        console.error('❌ [signUpEmpresa] Usuário não criado')
        return { success: false, error: 'Erro ao criar usuário' }
      }

      // Criar registro em users usando função SQL (bypass RLS)
      console.log('🔵 [signUpEmpresa] Criando registro em users via função SQL...')
      const { data: userResult, error: userError } = await supabase.rpc('create_user_after_signup', {
        p_user_id: authData.user.id,
        p_email: data.email,
        p_nome: data.razao_social,
        p_tipo: 'empresa',
        p_status: 'ativo',
      })

      console.log('🔵 [signUpEmpresa] Função SQL resultado:', { result: userResult, error: userError })

      if (userError) {
        console.error('❌ [signUpEmpresa] Erro ao criar user via função:', {
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
        })
        
        // Tentar método direto como fallback
        const { error: directError } = await supabase.from('users').insert({
          id: authData.user.id,
          tipo: 'empresa',
          email: data.email,
          nome: data.razao_social,
          status: 'ativo',
        })

        if (directError) {
          console.error('❌ [signUpEmpresa] Erro ao criar user (fallback direto):', directError)
          const errorMessage = handleError(directError, 'database')
          return { success: false, error: errorMessage.message }
        } else {
          console.log('✅ [signUpEmpresa] Usuário criado via método direto (fallback)')
        }
      } else {
        console.log('✅ [signUpEmpresa] Usuário criado via função SQL:', userResult)
      }

      // Criar registro em empresas usando função SQL (bypass RLS)
      const cnpjCleaned = cnpjValidation.cleaned || cleanCNPJ(data.cnpj)
      console.log('🔵 [signUpEmpresa] CNPJ limpo:', cnpjCleaned)
      console.log('🔵 [signUpEmpresa] Criando registro em empresas via função SQL...')
      
      const { data: empresaResult, error: empresaError } = await supabase.rpc('create_empresa_after_signup', {
        p_user_id: authData.user.id,
        p_cnpj: cnpjCleaned,
        p_razao_social: data.razao_social,
        p_nome_fantasia: data.nome_fantasia || null,
        p_instagram: data.instagram || null,
        p_status: 'aguardando_aprovacao',
      })

      console.log('🔵 [signUpEmpresa] Função SQL empresas resultado:', { result: empresaResult, error: empresaError })

      if (empresaError) {
        console.error('❌ [signUpEmpresa] Erro ao criar empresa via função:', {
          code: empresaError.code,
          message: empresaError.message,
          details: empresaError.details,
          hint: empresaError.hint,
        })
        
        // Tentar método direto como fallback
        const { error: directError } = await supabase.from('empresas').insert({
          id: authData.user.id,
          cnpj: cnpjCleaned,
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia || null,
          instagram: data.instagram || null,
          status: 'aguardando_aprovacao',
        })

        if (directError) {
          console.error('❌ [signUpEmpresa] Erro ao criar empresa (fallback direto):', {
            code: directError.code,
            message: directError.message,
            details: directError.details,
            hint: directError.hint,
          })
          // Rollback: deletar user usando função SQL (não há função de delete, então tentar direto)
          console.log('🔵 [signUpEmpresa] Fazendo rollback - deletando user...')
          await supabase.from('users').delete().eq('id', authData.user.id)
          const errorMessage = handleError(directError, 'database')
          return { success: false, error: errorMessage.message }
        } else {
          console.log('✅ [signUpEmpresa] Empresa criada via método direto (fallback)')
        }
      } else {
        console.log('✅ [signUpEmpresa] Empresa criada via função SQL:', empresaResult)
      }

      // Enviar código de verificação
      console.log('🔵 [signUpEmpresa] Enviando código de verificação...')
      const { error: verifyError } = await supabase.auth.resend({
        type: 'signup',
        email: data.email,
      })

      console.log('🔵 [signUpEmpresa] Resend código resultado:', { error: verifyError })

      if (verifyError) {
        console.error('⚠️ [signUpEmpresa] Erro ao enviar código de verificação:', verifyError)
        // Não falhar o cadastro por isso, apenas logar
      }

      // IMPORTANTE: Armazenar email no localStorage para uso na verificação
      // (Supabase não cria sessão até email ser confirmado)
      console.log('🔵 [signUpEmpresa] Armazenando email para verificação...')
      localStorage.setItem('pending_email_verification', data.email)

      // IMPORTANTE: Carregar o usuário no contexto após signup
      console.log('🔵 [signUpEmpresa] Carregando usuário no contexto...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
        console.log('✅ [signUpEmpresa] Usuário carregado no contexto')
      } else {
        console.warn('⚠️ [signUpEmpresa] Sessão não encontrada após signup (normal se email não confirmado)')
        // Usar o user do signUp mesmo sem sessão para ter o ID disponível
        if (authData.user) {
          setUser(authData.user)
        }
      }

      console.log('✅ [signUpEmpresa] Cadastro concluído com sucesso!')
      return { success: true }
    } catch (error) {
      console.error('❌ [signUpEmpresa] Erro catch:', error)
      const errorMessage = handleError(error)
      return { success: false, error: errorMessage.message }
    }
  }

  // ============================================
  // SIGN UP MOTORISTA
  // ============================================

  const signUpMotorista = async (data: CadastroMotoristaFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validações
      const emailValidation = validateEmail(data.email)
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error }
      }

      if (data.email !== data.confirmar_email) {
        return { success: false, error: 'Os emails não coincidem' }
      }

      const passwordValidation = validatePassword(data.senha)
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error }
      }

      if (data.senha !== data.confirmar_senha) {
        return { success: false, error: 'As senhas não coincidem' }
      }

      const cpfValidation = validateCPF(data.cpf)
      if (!cpfValidation.isValid) {
        return { success: false, error: cpfValidation.error }
      }

      if (!data.aceitar_termos) {
        return { success: false, error: 'Você deve aceitar os termos de uso' }
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/confirmar-email`,
        },
      })

      if (authError) {
        const errorMessage = handleError(authError, 'auth')
        return { success: false, error: errorMessage.message }
      }

      if (!authData.user) {
        return { success: false, error: 'Erro ao criar usuário' }
      }

      // Criar registro em users usando função SQL (bypass RLS)
      console.log('🔵 [signUpMotorista] Criando registro em users via função SQL...')
      const { data: userResult, error: userError } = await supabase.rpc('create_user_after_signup', {
        p_user_id: authData.user.id,
        p_email: data.email,
        p_nome: data.nome,
        p_tipo: 'motorista',
        p_status: 'ativo',
        p_telefone: data.telefone,
      })

      if (userError) {
        console.error('❌ [signUpMotorista] Erro ao criar user via função:', {
          code: userError.code,
          message: userError.message,
          details: userError.details,
          hint: userError.hint,
        })
        
        // Tentar método direto como fallback
        const { error: directError } = await supabase.from('users').insert({
          id: authData.user.id,
          tipo: 'motorista',
          email: data.email,
          nome: data.nome,
          telefone: data.telefone,
          status: 'ativo',
        })

        if (directError) {
          console.error('❌ [signUpMotorista] Erro ao criar user (fallback direto):', directError)
          const errorMessage = handleError(directError, 'database')
          return { success: false, error: errorMessage.message }
        } else {
          console.log('✅ [signUpMotorista] Usuário criado via método direto (fallback)')
        }
      } else {
        console.log('✅ [signUpMotorista] Usuário criado via função SQL:', userResult)
      }

      // Criar registro em motoristas usando função SQL (bypass RLS)
      console.log('🔵 [signUpMotorista] Criando registro em motoristas via função SQL...')
      const { data: motoristaResult, error: motoristaError } = await supabase.rpc('create_motorista_after_signup', {
        p_user_id: authData.user.id,
        p_cpf: cpfValidation.cleaned!,
        p_telefone: data.telefone,
        p_veiculo: data.veiculo,
        p_placa: data.placa.toUpperCase().replace(/\s/g, ''),
        p_status: 'aguardando_aprovacao',
      })

      if (motoristaError) {
        console.error('❌ [signUpMotorista] Erro ao criar motorista via função:', {
          code: motoristaError.code,
          message: motoristaError.message,
          details: motoristaError.details,
          hint: motoristaError.hint,
        })
        
        // Tentar método direto como fallback
        const { error: directError } = await supabase.from('motoristas').insert({
          id: authData.user.id,
          cpf: cpfValidation.cleaned!,
          telefone: data.telefone,
          veiculo: data.veiculo,
          placa: data.placa.toUpperCase().replace(/\s/g, ''),
          status: 'aguardando_aprovacao',
        })

        if (directError) {
          console.error('❌ [signUpMotorista] Erro ao criar motorista (fallback direto):', {
            code: directError.code,
            message: directError.message,
            details: directError.details,
            hint: directError.hint,
          })
          // Rollback: deletar user
          await supabase.from('users').delete().eq('id', authData.user.id)
          const errorMessage = handleError(directError, 'database')
          return { success: false, error: errorMessage.message }
        } else {
          console.log('✅ [signUpMotorista] Motorista criado via método direto (fallback)')
        }
      } else {
        console.log('✅ [signUpMotorista] Motorista criado via função SQL:', motoristaResult)
      }

      // Enviar código de verificação
      console.log('🔵 [signUpMotorista] Enviando código de verificação...')
      const { error: verifyError } = await supabase.auth.resend({
        type: 'signup',
        email: data.email,
      })

      console.log('🔵 [signUpMotorista] Resend código resultado:', { error: verifyError })

      if (verifyError) {
        console.error('⚠️ [signUpMotorista] Erro ao enviar código de verificação:', verifyError)
        // Não falhar o cadastro por isso, apenas logar
      }

      // IMPORTANTE: Armazenar email no localStorage para uso na verificação
      // (Supabase não cria sessão até email ser confirmado)
      console.log('🔵 [signUpMotorista] Armazenando email para verificação...')
      localStorage.setItem('pending_email_verification', data.email)

      // IMPORTANTE: Carregar o usuário no contexto após signup
      console.log('🔵 [signUpMotorista] Carregando usuário no contexto...')
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
        console.log('✅ [signUpMotorista] Usuário carregado no contexto')
      } else {
        console.warn('⚠️ [signUpMotorista] Sessão não encontrada após signup (normal se email não confirmado)')
        // Usar o user do signUp mesmo sem sessão para ter o ID disponível
        if (authData.user) {
          setUser(authData.user)
        }
      }

      console.log('✅ [signUpMotorista] Cadastro concluído com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = handleError(error)
      return { success: false, error: errorMessage.message }
    }
  }

  // ============================================
  // SIGN OUT
  // ============================================

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      setEmpresa(null)
      setMotorista(null)
      setAdmin(null)
      setUserType(null)
      navigate('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // ============================================
  // RESET PASSWORD
  // ============================================

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        return { success: false, error: emailValidation.error }
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (error) {
        const errorMessage = handleError(error, 'auth')
        return { success: false, error: errorMessage.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = handleError(error)
      return { success: false, error: errorMessage.message }
    }
  }

  // ============================================
  // UPDATE PASSWORD
  // ============================================

  const updatePassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.error }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        const errorMessage = handleError(error, 'auth')
        return { success: false, error: errorMessage.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = handleError(error)
      return { success: false, error: errorMessage.message }
    }
  }

  // ============================================
  // VERIFY EMAIL
  // ============================================

  const verifyEmail = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔵 [verifyEmail] Iniciando verificação...', { codeLength: code?.length })
      
      if (!code || code.length !== 8) {
        console.error('❌ [verifyEmail] Código inválido:', code)
        return { success: false, error: 'Código inválido' }
      }

      // Buscar email de múltiplas fontes: contexto, sessão, ou localStorage
      let emailToVerify = user?.email
      
      if (!emailToVerify) {
        console.log('🔵 [verifyEmail] Email não encontrado no contexto, buscando da sessão...')
        const { data: { session } } = await supabase.auth.getSession()
        emailToVerify = session?.user?.email || null
      }

      // Se ainda não encontrou, buscar do localStorage (armazenado após signup)
      if (!emailToVerify) {
        console.log('🔵 [verifyEmail] Email não encontrado na sessão, buscando do localStorage...')
        emailToVerify = localStorage.getItem('pending_email_verification')
      }

      if (!emailToVerify) {
        console.error('❌ [verifyEmail] Email não encontrado')
        return { success: false, error: 'Email não encontrado. Faça login novamente.' }
      }

      console.log('🔵 [verifyEmail] Verificando código para:', emailToVerify)

      const { data, error } = await supabase.auth.verifyOtp({
        token: code,
        type: 'email',
        email: emailToVerify, // ADICIONAR EMAIL AQUI
      })

      console.log('🔵 [verifyEmail] Resultado verifyOtp:', { 
        hasUser: !!data?.user, 
        error: error?.message 
      })

      if (error) {
        console.error('❌ [verifyEmail] Erro no verifyOtp:', error)
        const errorMessage = handleError(error, 'auth')
        return { success: false, error: errorMessage.message }
      }

      if (data.user) {
        console.log('✅ [verifyEmail] Usuário verificado, carregando perfil...')
        // Remover email do localStorage após sucesso
        localStorage.removeItem('pending_email_verification')
        // Atualizar usuário primeiro
        setUser(data.user)
        // Carregar perfil e fazer login automático
        // Usar try/catch para não falhar se houver erro no loadUserProfile
        try {
          await loadUserProfile(data.user.id)
          console.log('✅ [verifyEmail] Perfil carregado com sucesso')
        } catch (profileError) {
          console.error('⚠️ [verifyEmail] Erro ao carregar perfil (continuando mesmo assim):', profileError)
          // Continuar mesmo se houver erro ao carregar perfil
          // O perfil será carregado na próxima verificação de sessão
        }
      }

      return { success: true }
    } catch (error) {
      console.error('❌ [verifyEmail] Erro catch:', error)
      const errorMessage = handleError(error)
      return { success: false, error: errorMessage.message }
    }
  }

  // ============================================
  // RESEND VERIFICATION CODE
  // ============================================

  const resendVerificationCode = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔵 [resendVerificationCode] Iniciando reenvio...')
      
      // Tentar obter email de múltiplas fontes
      let emailToResend = user?.email
      
      if (!emailToResend) {
        console.log('🔵 [resendVerificationCode] Email não encontrado no contexto, buscando da sessão...')
        const { data: { session } } = await supabase.auth.getSession()
        emailToResend = session?.user?.email || null
      }

      // Se ainda não encontrou, buscar do localStorage
      if (!emailToResend) {
        console.log('🔵 [resendVerificationCode] Email não encontrado na sessão, buscando do localStorage...')
        emailToResend = localStorage.getItem('pending_email_verification')
      }

      if (!emailToResend) {
        console.error('❌ [resendVerificationCode] Email não encontrado')
        return { success: false, error: 'Email não encontrado. Faça login novamente.' }
      }

      console.log('🔵 [resendVerificationCode] Reenviando código para:', emailToResend)

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
      })

      console.log('🔵 [resendVerificationCode] Resultado:', { error: error?.message })

      if (error) {
        console.error('❌ [resendVerificationCode] Erro:', error)
        const errorMessage = handleError(error, 'auth')
        return { success: false, error: errorMessage.message }
      }

      console.log('✅ [resendVerificationCode] Código reenviado com sucesso')
      return { success: true }
    } catch (error) {
      console.error('❌ [resendVerificationCode] Erro catch:', error)
      const errorMessage = handleError(error)
      return { success: false, error: errorMessage.message }
    }
  }

  // ============================================
  // REFRESH USER
  // ============================================

  const refreshUser = async (): Promise<void> => {
    if (!user?.id) return
    await loadUserProfile(user.id)
  }

  // ============================================
  // CHECK SESSION
  // ============================================

  const checkSession = async (): Promise<void> => {
    try {
      console.log('🔵 [checkSession] Verificando sessão...')
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ [checkSession] Erro ao verificar sessão:', error)
        setLoading(false)
        setInitialized(true)
        return
      }

      if (session?.user) {
        console.log('✅ [checkSession] Sessão encontrada, carregando perfil...', { userId: session.user.id })
        setUser(session.user)
        try {
          await loadUserProfile(session.user.id)
          console.log('✅ [checkSession] Perfil carregado com sucesso')
        } catch (profileError) {
          console.error('❌ [checkSession] Erro ao carregar perfil:', profileError)
          // Continuar mesmo com erro
        }
      } else {
        console.log('🔵 [checkSession] Nenhuma sessão encontrada')
      }

      setLoading(false)
      setInitialized(true)
    } catch (error) {
      console.error('❌ [checkSession] Erro catch:', error)
      setLoading(false)
      setInitialized(true)
    }
  }

  // ============================================
  // EFFECTS
  // ============================================

  // Sincronizar refs com estado
  useEffect(() => {
    currentUserRef.current = user
  }, [user])

  useEffect(() => {
    currentProfileRef.current = profile
  }, [profile])

  useEffect(() => {
    // Verificar sessão ao montar
    checkSession()

    // Escutar mudanças de auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔵 [AuthContext] Auth state changed:', event)
      
      // Prevenir processamento duplicado do mesmo evento
      if (processingAuthEventRef.current) {
        console.log('⚠️ [AuthContext] Já processando evento de auth, ignorando...')
        return
      }

      // Prevenir processamento duplicado do mesmo evento
      if (event === 'SIGNED_IN' && session?.user) {
        // Verificar se já temos este usuário carregado (usando refs para valores atuais)
        if (currentUserRef.current?.id === session.user.id && currentProfileRef.current) {
          console.log('✅ [AuthContext] Usuário já carregado, ignorando SIGNED_IN duplicado')
          setLoading(false)
          setInitialized(true)
          return
        }

        // Verificar se já estamos processando este evento
        if (processingAuthEventRef.current) {
          console.log('⚠️ [AuthContext] Já processando SIGNED_IN, ignorando...')
          return
        }

        processingAuthEventRef.current = true
        console.log('🔵 [AuthContext] Usuário autenticado, carregando perfil...')
        setUser(session.user)
        currentUserRef.current = session.user // Atualizar ref também
        try {
          await loadUserProfile(session.user.id)
          console.log('✅ [AuthContext] Perfil carregado após SIGNED_IN')
        } catch (error) {
          console.error('❌ [AuthContext] Erro ao carregar perfil após SIGNED_IN:', error)
          // Continuar mesmo com erro
        } finally {
          processingAuthEventRef.current = false
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Não recarregar perfil completo em TOKEN_REFRESHED, apenas atualizar user
        console.log('🔵 [AuthContext] Token atualizado')
        setUser(session.user)
        currentUserRef.current = session.user // Atualizar ref também
        // Não chamar loadUserProfile aqui para evitar loops
      } else if (event === 'SIGNED_OUT') {
        console.log('🔵 [AuthContext] Usuário deslogado')
        processingAuthEventRef.current = true
        setUser(null)
        currentUserRef.current = null // Limpar ref também
        setProfile(null)
        currentProfileRef.current = null // Limpar ref também
        setEmpresa(null)
        setMotorista(null)
        setAdmin(null)
        setUserType(null)
        setPermissions([])
        setRoles([])
        setIsLoadingProfile(false) // Resetar flag
        // Limpar localStorage também
        localStorage.removeItem('pending_email_verification')
        processingAuthEventRef.current = false
      }

      setLoading(false)
      setInitialized(true)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, []) // Manter array vazio - o listener deve ser criado apenas uma vez

  // ============================================
  // VALUE
  // ============================================

  const value: AuthContextType = {
    user,
    profile,
    empresa,
    motorista,
    admin,
    userType,
    permissions,
    roles,
    loading,
    initialized,
    signIn,
    signUpEmpresa,
    signUpMotorista,
    signOut,
    resetPassword,
    updatePassword,
    verifyEmail,
    resendVerificationCode,
    refreshUser,
    checkSession,
    checkPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================
// HOOK
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

