import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { campanhaService, GetCampanhasFilters } from '@/services/campanhaService'
import type { CampanhaWithEmpresa } from '@/types/database'

export const useCampanhas = (filters: GetCampanhasFilters = {}) => {
  const [campanhas, setCampanhas] = useState<CampanhaWithEmpresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 10

  const filtersRef = useRef<string>('')
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // Estabilizar o objeto filters incluindo page
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFilters = useMemo(() => ({ ...filters, page, limit }), [
    filters.status,
    filters.empresa_id,
    filters.data_inicio,
    filters.data_fim,
    filters.orcamento_min,
    filters.orcamento_max,
    filters.search,
    page,
  ])

  const fetchCampanhas = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    // Não vamos bloquear se for mudança de página rápida, mas ajuda
    // if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)
      const { data, count: totalCount } = await campanhaService.getCampanhas(stableFilters)
      setCampanhas(data || [])
      setCount(totalCount)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas'
      setError(errorMessage)
      console.error('Erro ao buscar campanhas:', err)
      setCampanhas([])
      setCount(0)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [stableFilters])

  useEffect(() => {
    // Buscar na primeira renderização ou quando os filtros mudarem
    const filtersKey = JSON.stringify(stableFilters)
    const filtersChanged = filtersRef.current !== filtersKey

    if (!hasInitializedRef.current || filtersChanged) {
      hasInitializedRef.current = true
      filtersRef.current = filtersKey
      fetchCampanhas()
    }
  }, [stableFilters, fetchCampanhas])

  const totalPages = Math.ceil(count / limit)

  return {
    campanhas,
    loading,
    error,
    refetch: fetchCampanhas,
    page,
    setPage,
    totalPages,
    totalRecords: count,
  }
}

export const useCampanha = (id: string) => {
  const [campanha, setCampanha] = useState<CampanhaWithEmpresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampanha = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await campanhaService.getCampanha(id)
        setCampanha(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanha'
        setError(errorMessage)
        console.error('Erro ao buscar campanha:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampanha()
  }, [id])

  return {
    campanha,
    loading,
    error,
  }
}

