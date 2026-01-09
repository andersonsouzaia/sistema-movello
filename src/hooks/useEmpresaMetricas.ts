import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { empresaMetricasService } from '@/services/empresaMetricasService'
import type {
  CampanhaMetricasConsolidadas,
  MetricaDiaria,
} from '@/types/database'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

const metricasCache: {
  [key: string]: {
    data: any
    timestamp: number
  }
} = {}

/**
 * Hook para obter métricas consolidadas de uma campanha
 */
export const useCampanhaMetricas = (
  campanhaId: string | null,
  periodo?: { inicio: string; fim: string }
) => {
  const [metricas, setMetricas] = useState<CampanhaMetricasConsolidadas | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const periodoInicio = periodo?.inicio
  const periodoFim = periodo?.fim

  const fetchMetricas = useCallback(async () => {
    if (!campanhaId || isFetchingRef.current) return

    const cacheKey = `campanha_${campanhaId}_${periodoInicio || 'all'}_${periodoFim || 'all'}`
    const cached = metricasCache[cacheKey]

    // Verificar cache
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setMetricas(cached.data)
      setLoading(false)
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      const data = await empresaMetricasService.getCampanhaMetricas(
        campanhaId,
        periodo
      )

      setMetricas(data)

      // Atualizar cache
      metricasCache[cacheKey] = {
        data,
        timestamp: Date.now(),
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar métricas'
      setError(errorMessage)
      console.error('Erro ao buscar métricas:', err)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [campanhaId, periodoInicio, periodoFim])

  useEffect(() => {
    if (campanhaId) {
      fetchMetricas()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanhaId, periodoInicio, periodoFim])

  return {
    metricas,
    loading,
    error,
    refetch: fetchMetricas,
  }
}

/**
 * Hook para obter métricas diárias de uma campanha
 */
export const useCampanhaMetricasDiarias = (
  campanhaId: string | null,
  dias: number = 30
) => {
  const [metricas, setMetricas] = useState<MetricaDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetricas = async () => {
      if (!campanhaId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const data = await empresaMetricasService.getMetricasDiarias(
          campanhaId,
          dias
        )

        setMetricas(data)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao buscar métricas diárias'
        setError(errorMessage)
        console.error('Erro ao buscar métricas diárias:', err)
        setMetricas([])
      } finally {
        setLoading(false)
      }
    }

    fetchMetricas()
  }, [campanhaId, dias])

  return {
    metricas,
    loading,
    error,
  }
}

/**
 * Hook para obter métricas diárias agregadas da empresa
 */
export const useEmpresaMetricasDiarias = (dias: number = 30) => {
  const { empresa } = useAuth()
  const [metricas, setMetricas] = useState<MetricaDiaria[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const empresaId = empresa?.id

  const fetchMetricas = useCallback(async () => {
    if (!empresaId || isFetchingRef.current) return

    const cacheKey = `empresa_diarias_${empresaId}_${dias}`
    const cached = metricasCache[cacheKey]

    // Verificar cache
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setMetricas(cached.data)
      setLoading(false)
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      const data = await empresaMetricasService.getEmpresaMetricasDiarias(dias)

      setMetricas(data)

      // Atualizar cache
      metricasCache[cacheKey] = {
        data,
        timestamp: Date.now(),
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao buscar métricas diárias'
      setError(errorMessage)
      console.error('Erro ao buscar métricas diárias:', err)
      setMetricas([])
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [empresaId, dias])

  useEffect(() => {
    if (empresaId) {
      fetchMetricas()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, dias])

  return {
    metricas,
    loading,
    error,
    refetch: fetchMetricas,
  }
}

/**
 * Hook para obter métricas consolidadas da empresa
 */
export const useEmpresaMetricasConsolidadas = () => {
  const { empresa } = useAuth()
  const [metricas, setMetricas] = useState<{
    periodo_atual: CampanhaMetricasConsolidadas
    periodo_anterior: Partial<CampanhaMetricasConsolidadas>
    tendencias: {
      visualizacoes_crescimento: number
      gasto_crescimento: number
      cliques_crescimento: number
      conversoes_crescimento: number
    }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)

  const empresaId = empresa?.id

  const fetchMetricas = useCallback(async () => {
    if (!empresaId || isFetchingRef.current) return

    const cacheKey = `empresa_consolidadas_${empresaId}`
    const cached = metricasCache[cacheKey]

    // Verificar cache
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setMetricas(cached.data)
      setLoading(false)
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      const data =
        await empresaMetricasService.getEmpresaMetricasConsolidadas()

      setMetricas(data)

      // Atualizar cache
      metricasCache[cacheKey] = {
        data,
        timestamp: Date.now(),
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao buscar métricas consolidadas'
      setError(errorMessage)
      console.error('Erro ao buscar métricas consolidadas:', err)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [empresaId])

  useEffect(() => {
    if (empresaId) {
      fetchMetricas()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    if (!empresaId) return
    Object.keys(metricasCache).forEach((key) => {
      if (key.includes(`empresa_consolidadas_${empresaId}`)) {
        delete metricasCache[key]
      }
    })
    fetchMetricas()
  }, [empresaId, fetchMetricas])

  return {
    metricas,
    loading,
    error,
    refetch: fetchMetricas,
    invalidateCache,
  }
}

