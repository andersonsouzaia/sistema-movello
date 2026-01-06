import { useState, useEffect, useCallback } from 'react'
import { userService } from '@/services/userService'
import { supabase } from '@/lib/supabase'
import type { UserWithRoles, CreateUserFormData, UpdateUserRoleFormData, RoleSlug } from '@/types/database'
import { toast } from 'sonner'

interface UseUsersOptions {
  roleSlug?: string
  status?: string
  search?: string
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const usersData = await userService.getUsersWithRoles()

      // Aplicar filtros
      let filteredUsers = usersData

      if (options.roleSlug) {
        filteredUsers = filteredUsers.filter((user) =>
          user.roles.some((role) => role.slug === options.roleSlug)
        )
      }

      if (options.status) {
        filteredUsers = filteredUsers.filter((user) => user.status === options.status)
      }

      if (options.search) {
        const searchLower = options.search.toLowerCase()
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.nome?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        )
      }

      setUsers(filteredUsers)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuários'
      setError(errorMessage)
      console.error('Erro ao buscar usuários:', err)
    } finally {
      setLoading(false)
    }
  }, [options.roleSlug, options.status, options.search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  }
}

export const useUser = (userId: string) => {
  const [user, setUser] = useState<UserWithRoles | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userError) {
          throw userError
        }

        if (userData) {
          // Buscar roles e permissões
          const { data: rolesData } = await supabase.rpc('get_user_roles', {
            p_user_id: userId,
          })

          const { data: permsData } = await supabase.rpc('get_user_permissions', {
            p_user_id: userId,
          })

          // Buscar dados completos das roles
          const roleIds = (rolesData || []).map((r: { role_id: string }) => r.role_id)
          const { data: rolesFullData } = await supabase
            .from('roles')
            .select('*')
            .in('id', roleIds)

          setUser({
            ...userData,
            roles: (rolesFullData || []).map((r) => ({
              ...r,
              slug: r.slug as RoleSlug,
            })),
            permissions: (permsData || []).map((p: { permission_slug: string }) => p.permission_slug),
          })
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar usuário'
        setError(errorMessage)
        console.error('Erro ao buscar usuário:', err)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  return {
    user,
    loading,
    error,
  }
}

export const useCreateUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = useCallback(
    async (data: CreateUserFormData, adminId: string) => {
      setLoading(true)
      setError(null)

      try {
        const result = await userService.createAdminUser(data, adminId)
        if (!result.success) {
          setError(result.error || 'Erro ao criar usuário')
          return { success: false, error: result.error }
        }
        return { success: true, userId: result.userId }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    createUser,
    loading,
    error,
  }
}

export const useUpdateUserRole = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateRole = useCallback(
    async (data: UpdateUserRoleFormData, adminId: string) => {
      setLoading(true)
      setError(null)

      try {
        const result = await userService.updateUserRole(data, adminId)
        if (!result.success) {
          setError(result.error || 'Erro ao atualizar role')
          return { success: false, error: result.error }
        }
        return { success: true }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar role'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    updateRole,
    loading,
    error,
  }
}

