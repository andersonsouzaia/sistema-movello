import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ganhoService, GetGanhosFilters, PeriodoType } from '@/services/ganhoService'
import type { Ganho, GanhoStats, GanhoMensal } from '@/types/database'

/**
 * Hook para listar ganhos do motorista
 */
export const useMotoristaGanhos = (filters: GetGanhosFilters = {}) => {
  const { motorista } = useAuth()
  const [ganhos, setGanhos] = useState<Ganho[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef<string>('')
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const stableFilters = useMemo(() => {
    if (!motorista?.id) return {}
    
    return {
      motorista_id: motorista.id,
      ...filters,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    motorista?.id,
    filters.status,
    filters.tipo,
    filters.data_inicio,
    filters.data_fim,
    filters.valor_min,
    filters.valor_max,
    filters.campanha_id,
  ])

  const fetchGanhos = useCallback(async () => {
    if (isFetchingRef.current) return
    
    if (!motorista?.id) {
      setLoading(false)
      setGanhos([])
      return
    }
    
    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)
      const data = await ganhoService.getGanhos(stableFilters)
      setGanhos(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar ganhos'
      setError(errorMessage)
      console.error('Erro ao buscar ganhos:', err)
      setGanhos([])
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [stableFilters, motorista?.id])

  useEffect(() => {
    const filtersKey = JSON.stringify(stableFilters)
    const filtersChanged = filtersRef.current !== filtersKey
    
    if (!hasInitializedRef.current || filtersChanged) {
      hasInitializedRef.current = true
      filtersRef.current = filtersKey
      fetchGanhos()
    }
  }, [stableFilters, fetchGanhos])

  return {
    ganhos,
    loading,
    error,
    refetch: fetchGanhos,
  }
}

/**
 * Hook para buscar estatísticas de ganhos do motorista
 */
export const useMotoristaGanhosStats = (periodo: PeriodoType = 'mes') => {
  const { motorista } = useAuth()
  const [stats, setStats] = useState<GanhoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!motorista?.id) {
      setLoading(false)
      setStats({
        ganhos_hoje: 0,
        ganhos_mes: 0,
        total_pendente: 0,
        total_pago: 0,
        total_ganhos: 0,
      })
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await ganhoService.getGanhosStats(motorista.id, periodo)
      setStats(data || {
        ganhos_hoje: 0,
        ganhos_mes: 0,
        total_pendente: 0,
        total_pago: 0,
        total_ganhos: 0,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas'
      setError(errorMessage)
      console.error('Erro ao buscar estatísticas de ganhos:', err)
      setStats({
        ganhos_hoje: 0,
        ganhos_mes: 0,
        total_pendente: 0,
        total_pago: 0,
        total_ganhos: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [motorista?.id, periodo])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

/**
 * Hook para buscar ganhos mensais (para gráficos)
 */
export const useMotoristaGanhosMensais = (ano?: number) => {
  const { motorista } = useAuth()
  const [ganhosMensais, setGanhosMensais] = useState<GanhoMensal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGanhosMensais = useCallback(async () => {
    if (!motorista?.id) {
      setLoading(false)
      setGanhosMensais([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await ganhoService.getGanhosMensais(motorista.id, ano)
      setGanhosMensais(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar ganhos mensais'
      setError(errorMessage)
      console.error('Erro ao buscar ganhos mensais:', err)
      setGanhosMensais([])
    } finally {
      setLoading(false)
    }
  }, [motorista?.id, ano])

  useEffect(() => {
    fetchGanhosMensais()
  }, [fetchGanhosMensais])

  return {
    ganhosMensais,
    loading,
    error,
    refetch: fetchGanhosMensais,
  }
}
