import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import type { User, UserWithRoles, RoleSlug } from '@/types/database'
import type { CreateUserFormData, UpdateUserRoleFormData } from '@/types/database'

export const userService = {
  async createAdminUser(
    data: CreateUserFormData,
    adminId: string
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            nome: data.nome,
          },
        },
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      // 2. Confirmar email automaticamente (sem 2FA)
      const { error: confirmError } = await supabase.rpc('confirm_user_email', {
        p_user_id: authData.user.id,
      })

      if (confirmError) {
        console.warn('⚠️ Erro ao confirmar email automaticamente:', confirmError)
        // Continuar mesmo assim
      }

      // 3. Criar registro em users usando função SQL
      const { error: userError } = await supabase.rpc('create_user_after_signup', {
        p_user_id: authData.user.id,
        p_email: data.email,
        p_nome: data.nome,
        p_tipo: 'admin', // Tipo padrão, será sobrescrito pela role
        p_status: 'ativo',
      })

      if (userError) {
        console.error('Erro ao criar user via função:', userError)
        // Tentar método direto como fallback
        const { error: directError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: data.email,
          nome: data.nome,
          tipo: 'admin',
          status: 'ativo',
        })

        if (directError) {
          throw directError
        }
      }

      // 4. Atribuir role ao usuário
      const { error: roleError } = await supabase.rpc('assign_role_to_user', {
        p_user_id: authData.user.id,
        p_role_slug: data.role_slug,
        p_is_primary: true,
      })

      if (roleError) {
        throw roleError
      }

      // 5. Registrar no audit log
      await logAction(adminId, 'user.create', 'users', authData.user.id, {
        email: data.email,
        nome: data.nome,
        role: data.role_slug,
      })

      toast.success('Usuário criado com sucesso!')
      return { success: true, userId: authData.user.id }
    } catch (error: any) {
      console.error('Erro ao criar usuário administrativo:', error)
      const errorMessage = error.message || 'Erro ao criar usuário'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async updateUserRole(
    data: UpdateUserRoleFormData,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('assign_role_to_user', {
        p_user_id: data.user_id,
        p_role_slug: data.role_slug,
        p_is_primary: data.is_primary ?? false,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'user.role.update', 'users', data.user_id, {
        role: data.role_slug,
        is_primary: data.is_primary,
      })

      toast.success('Role atualizada com sucesso!')
      return { success: true }
    } catch (error: any) {
      console.error('Erro ao atualizar role do usuário:', error)
      toast.error(error.message || 'Erro ao atualizar role')
      return { success: false, error: error.message }
    }
  },

  async removeUserRole(
    userId: string,
    roleSlug: RoleSlug,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('remove_role_from_user', {
        p_user_id: userId,
        p_role_slug: roleSlug,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'user.role.remove', 'users', userId, {
        role: roleSlug,
      })

      toast.success('Role removida com sucesso!')
      return { success: true }
    } catch (error: any) {
      console.error('Erro ao remover role do usuário:', error)
      toast.error(error.message || 'Erro ao remover role')
      return { success: false, error: error.message }
    }
  },

  async getUsersWithRoles(): Promise<UserWithRoles[]> {
    try {
      const { data: users, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Buscar roles para cada usuário
      const usersWithRoles: UserWithRoles[] = await Promise.all(
        (users || []).map(async (user: User) => {
          const { data: rolesData } = await supabase.rpc('get_user_roles', {
            p_user_id: user.id,
          })

          const { data: permsData } = await supabase.rpc('get_user_permissions', {
            p_user_id: user.id,
          })

          return {
            ...user,
            roles: (rolesData || []).map((r: any) => ({
              id: r.role_id,
              name: r.role_name,
              slug: r.role_slug,
              description: null,
              is_system: false,
              created_at: '',
              updated_at: '',
            })),
            permissions: (permsData || []).map((p: any) => p.permission_slug),
          }
        })
      )

      return usersWithRoles
    } catch (error: any) {
      console.error('Erro ao buscar usuários com roles:', error)
      toast.error('Erro ao carregar usuários')
      return []
    }
  },

  async resetUserPassword(userId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar email do usuário
      const { data: userData, error: userError } = await supabase.from('users').select('email').eq('id', userId).single()

      if (userError || !userData) {
        throw new Error('Usuário não encontrado')
      }

      // Enviar email de reset de senha
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(userData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        throw resetError
      }

      // Registrar no audit log
      await logAction(adminId, 'user.password.reset', 'users', userId, {
        email: userData.email,
      })

      toast.success('Email de reset de senha enviado!')
      return { success: true }
    } catch (error: any) {
      console.error('Erro ao resetar senha do usuário:', error)
      toast.error(error.message || 'Erro ao resetar senha')
      return { success: false, error: error.message }
    }
  },

  async blockUser(userId: string, motivo: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'bloqueado' })
        .eq('id', userId)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'user.block', 'users', userId, {
        motivo,
      })

      toast.success('Usuário bloqueado com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao bloquear usuário'
      console.error('Erro ao bloquear usuário:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

