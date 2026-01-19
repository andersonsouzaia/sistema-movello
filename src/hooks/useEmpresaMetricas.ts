import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { empresaMetricasService } from '@/services/empresaMetricasService'

/**
 * Hook para obter métricas consolidadas de uma campanha
 */
export const useCampanhaMetricas = (
  campanhaId: string | null,
  periodo?: { inicio: string; fim: string }
) => {
  const periodoInicio = periodo?.inicio
  const periodoFim = periodo?.fim

  const { data: metricas = null, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['campanha-metricas', campanhaId, periodoInicio, periodoFim],
    queryFn: () => {
      if (!campanhaId) return null
      return empresaMetricasService.getCampanhaMetricas(campanhaId, periodo)
    },
    enabled: !!campanhaId,
    staleTime: 5 * 60 * 1000,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar métricas' : null

  return {
    metricas,
    loading: loading && !!campanhaId,
    error,
    refetch,
  }
}

/**
 * Hook para obter métricas diárias de uma campanha
 */
export const useCampanhaMetricasDiarias = (
  campanhaId: string | null,
  dias: number = 30
) => {
  const { data: metricas = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['campanha-metricas-diarias', campanhaId, dias],
    queryFn: () => {
      if (!campanhaId) return []
      return empresaMetricasService.getMetricasDiarias(campanhaId, dias)
    },
    enabled: !!campanhaId,
    staleTime: 5 * 60 * 1000,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar métricas diárias' : null

  return {
    metricas,
    loading: loading && !!campanhaId,
    error,
  }
}

/**
 * Hook para obter métricas diárias agregadas da empresa
 */
export const useEmpresaMetricasDiarias = (dias: number = 30) => {
  const { empresa } = useAuth()

  const { data: metricas = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['empresa-metricas-diarias', empresa?.id, dias],
    queryFn: () => {
      if (!empresa?.id) return []
      return empresaMetricasService.getEmpresaMetricasDiarias(dias)
    },
    enabled: !!empresa?.id,
    staleTime: 5 * 60 * 1000,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar métricas diárias' : null

  return {
    metricas,
    loading: loading && !!empresa?.id,
    error,
    refetch,
  }
}

/**
 * Hook para obter métricas consolidadas da empresa
 */
export const useEmpresaMetricasConsolidadas = () => {
  const { empresa } = useAuth()

  const { data: metricas = null, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['empresa-metricas-consolidadas', empresa?.id],
    queryFn: () => {
      if (!empresa?.id) return null
      return empresaMetricasService.getEmpresaMetricasConsolidadas()
    },
    enabled: !!empresa?.id,
    staleTime: 5 * 60 * 1000,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar métricas consolidadas' : null

  return {
    metricas,
    loading: loading && !!empresa?.id,
    error,
    refetch,
    invalidateCache: refetch, // Compatibilidade
  }
}
