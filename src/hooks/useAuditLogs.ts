import { useQuery } from '@tanstack/react-query'
import { auditService } from '@/services/auditService'

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
  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['audit-logs', options],
    queryFn: async () => {
      const offset = options.page ? (options.page - 1) * (options.limit || 50) : 0
      return auditService.getAuditLogs({
        ...options,
        offset,
      })
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const logs = data?.data || []
  const totalCount = data?.count || 0
  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar logs' : null

  return {
    logs,
    loading,
    error,
    totalCount,
    refetch,
  }
}

export const useRecentActivity = (limit: number = 10) => {
  const { data, isLoading: loading } = useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      return auditService.getAuditLogs({
        limit,
      })
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 1000 * 10,
  })

  return {
    activities: data?.data || [],
    loading,
  }
}

