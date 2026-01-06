import { useState, useEffect, useCallback } from 'react'
import { auditService } from '@/services/auditService'
import type { AuditLog } from '@/types/database'

interface UseAuditLogsOptions {
  action?: string
  resourceType?: string
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
  page?: number
}

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const offset = options.page ? (options.page - 1) * (options.limit || 50) : 0

      const result = await auditService.getAuditLogs({
        ...options,
        offset,
      })

      setLogs(result.data)
      setTotalCount(result.count)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar logs'
      setError(errorMessage)
      console.error('Erro ao buscar logs:', err)
    } finally {
      setLoading(false)
    }
  }, [options.action, options.resourceType, options.userId, options.startDate, options.endDate, options.limit, options.page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return {
    logs,
    loading,
    error,
    totalCount,
    refetch: fetchLogs,
  }
}

export const useRecentActivity = (limit: number = 10) => {
  const [activities, setActivities] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const result = await auditService.getAuditLogs({
          limit,
        })
        setActivities(result.data)
      } catch (err) {
        console.error('Erro ao buscar atividades recentes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()

    // Refresh a cada 30 segundos
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [limit])

  return {
    activities,
    loading,
  }
}

