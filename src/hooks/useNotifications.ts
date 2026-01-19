import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '@/services/notificationService'
import { useAuth } from '@/contexts/AuthContext'

export const useNotifications = (read?: boolean) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['notifications', user?.id, read],
    queryFn: async () => {
      if (!user?.id) return []
      return notificationService.getNotifications(user.id, read)
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 1000 * 10, // 10 seconds
  })

  // Mutations
  const { mutateAsync: markAsReadMutation } = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    }
  })

  const { mutateAsync: markAllAsReadMutation } = useMutation({
    mutationFn: (userId: string) => notificationService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] })
    }
  })

  const markAsRead = async (notificationId: string) => {
    return markAsReadMutation(notificationId)
  }

  const markAllAsRead = async () => {
    if (!user?.id) return false
    return markAllAsReadMutation(user.id)
  }

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar notificações' : null

  return {
    notifications,
    loading: loading && !!user?.id,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
  }
}

export const useUnreadNotifications = () => {
  return useNotifications(false)
}

export const useNotificationCount = () => {
  const { user } = useAuth()

  const { data: count = 0, isLoading: loading } = useQuery({
    queryKey: ['notifications-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0
      return notificationService.getUnreadCount(user.id)
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 1000 * 10,
  })

  return {
    count,
    loading: loading && !!user?.id,
  }
}

