import { useState, useEffect, useCallback, useRef } from 'react'
import { pagamentoService, GetPagamentosFilters, GetRepassesFilters } from '@/services/pagamentoService'
import type { Pagamento, Repasse, FinancialSummary } from '@/types/database'

export const usePagamentos = (filters: GetPagamentosFilters = {}) => {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPagamentos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await pagamentoService.getPagamentos(filters)
      setPagamentos(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar pagamentos'
      setError(errorMessage)
      console.error('Erro ao buscar pagamentos:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.empresa_id, filters.data_inicio, filters.data_fim, filters.valor_min, filters.valor_max])

  useEffect(() => {
    fetchPagamentos()
  }, [fetchPagamentos])

  return {
    pagamentos,
    loading,
    error,
    refetch: fetchPagamentos,
  }
}

export const useRepasses = (filters: GetRepassesFilters = {}) => {
  const [repasses, setRepasses] = useState<Repasse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRepasses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await pagamentoService.getRepasses(filters)
      setRepasses(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar repasses'
      setError(errorMessage)
      console.error('Erro ao buscar repasses:', err)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.motorista_id, filters.data_inicio, filters.data_fim, filters.valor_min, filters.valor_max])

  useEffect(() => {
    fetchRepasses()
  }, [fetchRepasses])

  return {
    repasses,
    loading,
    error,
    refetch: fetchRepasses,
  }
}

export const useFinancialSummary = (periodo?: { inicio: string; fim: string }) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasAttemptedRef = useRef(false)
  const hasErrorRef = useRef(false)
  const periodoKeyRef = useRef<string>('')

  useEffect(() => {
    // Criar chave única para o período atual
    const currentPeriodoKey = `${periodo?.inicio || ''}_${periodo?.fim || ''}`
    
    // Se o período mudou, resetar flags
    if (periodoKeyRef.current !== currentPeriodoKey) {
      hasAttemptedRef.current = false
      hasErrorRef.current = false
      periodoKeyRef.current = currentPeriodoKey
    }

    // Se já tentou buscar para este período e teve erro, não tenta novamente
    if (hasErrorRef.current && periodoKeyRef.current === currentPeriodoKey) {
      setLoading(false)
      return
    }

    // Se já tentou buscar para este período, não tenta novamente
    if (hasAttemptedRef.current && periodoKeyRef.current === currentPeriodoKey) {
      return
    }

    const fetchSummary = async () => {
      // Marcar que já tentou buscar
      hasAttemptedRef.current = true

      try {
        setLoading(true)
        setError(null)
        const data = await pagamentoService.getFinancialSummary(periodo)
        
        // O serviço sempre retorna um objeto (nunca null após a correção)
        if (data) {
          setSummary(data)
          hasErrorRef.current = false
        } else {
          // Fallback: definir valores padrão
          setSummary({
            total_receitas: 0,
            total_despesas: 0,
            saldo: 0,
            pagamentos_pendentes: 0,
            repasses_pendentes: 0,
          })
          hasErrorRef.current = false
        }
      } catch (err) {
        // Marcar que houve erro para não tentar novamente para este período
        hasErrorRef.current = true
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar resumo financeiro'
        setError(errorMessage)
        
        // Definir valores padrão em caso de erro
        setSummary({
          total_receitas: 0,
          total_despesas: 0,
          saldo: 0,
          pagamentos_pendentes: 0,
          repasses_pendentes: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [periodo?.inicio, periodo?.fim])

  return {
    summary,
    loading,
    error,
  }
}

