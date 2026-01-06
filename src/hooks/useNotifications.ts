import { useState, useEffect, useCallback } from 'react'
import { notificationService } from '@/services/notificationService'
import { useAuth } from '@/contexts/AuthContext'
import type { Notification } from '@/types/database'

export const useNotifications = (read?: boolean) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await notificationService.getNotifications(user.id, read)
      setNotifications(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar notificações'
      setError(errorMessage)
      console.error('Erro ao buscar notificações:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, read])

  useEffect(() => {
    fetchNotifications()

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const success = await notificationService.markAsRead(notificationId)
      if (success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
      }
      return success
    },
    []
  )

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return false

    const success = await notificationService.markAllAsRead(user.id)
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
    return success
  }, [user?.id])

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}

export const useUnreadNotifications = () => {
  return useNotifications(false)
}

export const useNotificationCount = () => {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCount = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const unreadCount = await notificationService.getUnreadCount(user.id)
        setCount(unreadCount)
      } catch (err) {
        console.error('Erro ao contar notificações:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()

    // Refresh a cada 30 segundos
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [user?.id])

  return {
    count,
    loading,
  }
}

