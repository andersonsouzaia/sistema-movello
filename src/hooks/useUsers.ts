import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const { data: users = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['users', options],
    queryFn: async () => {
      const usersData = await userService.getUsersWithRoles()

      // Client-side filtering (ideally this should be server-side, but maintaining current logic for now)
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

      return filteredUsers
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar usuários' : null

  return {
    users,
    loading,
    error,
    refetch,
  }
}

export const useUser = (userId: string) => {
  const { data: user, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError

      if (userData) {
        // Parallel fetching for performance
        const [{ data: rolesData }, { data: permsData }] = await Promise.all([
          supabase.rpc('get_user_roles', { p_user_id: userId }),
          supabase.rpc('get_user_permissions', { p_user_id: userId })
        ])

        // Roles fetch
        const roleIds = (rolesData || []).map((r: { role_id: string }) => r.role_id)
        const { data: rolesFullData } = await supabase
          .from('roles')
          .select('*')
          .in('id', roleIds)

        return {
          ...userData,
          roles: (rolesFullData || []).map((r) => ({
            ...r,
            slug: r.slug as RoleSlug,
          })),
          permissions: (permsData || []).map((p: { permission_slug: string }) => p.permission_slug),
        } as UserWithRoles
      }
      return null
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar usuário' : null

  return {
    user: user || null,
    loading,
    error,
  }
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  const { mutateAsync: createUser, isPending: loading, error: queryError } = useMutation({
    mutationFn: async ({ data, adminId }: { data: CreateUserFormData; adminId: string }) => {
      const result = await userService.createAdminUser(data, adminId)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar usuário')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Usuário criado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário'
      toast.error(errorMessage)
    }
  })

  // Wrapper for backward compatibility
  const createUserWrapper = async (data: CreateUserFormData, adminId: string) => {
    try {
      const result = await createUser({ data, adminId })
      return { success: true, userId: result.userId }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao criar usuário' : null

  return {
    createUser: createUserWrapper, // Maintaining signature
    loading,
    error,
  }
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()

  const { mutateAsync: updateRole, isPending: loading, error: queryError } = useMutation({
    mutationFn: async ({ data, adminId }: { data: UpdateUserRoleFormData; adminId: string }) => {
      const result = await userService.updateUserRole(data, adminId)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar role')
      }
      return result
    },
    onSuccess: (_, variables) => {
      toast.success('Permissões atualizadas com sucesso')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.data.user_id] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar role'
      toast.error(errorMessage)
    }
  })

  // Wrapper for backward compatibility
  const updateRoleWrapper = async (data: UpdateUserRoleFormData, adminId: string) => {
    try {
      await updateRole({ data, adminId })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao atualizar role' : null

  return {
    updateRole: updateRoleWrapper,
    loading,
    error,
  }
}

