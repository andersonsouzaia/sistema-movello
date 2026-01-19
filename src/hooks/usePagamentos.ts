import { useQuery } from '@tanstack/react-query'
import { pagamentoService, GetPagamentosFilters, GetRepassesFilters } from '@/services/pagamentoService'

export const usePagamentos = (filters: GetPagamentosFilters = {}) => {
  const { data: pagamentos = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['pagamentos', filters],
    queryFn: () => pagamentoService.getPagamentos(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar pagamentos' : null

  return {
    pagamentos,
    loading,
    error,
    refetch,
  }
}

export const useRepasses = (filters: GetRepassesFilters = {}) => {
  const { data: repasses = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['repasses', filters],
    queryFn: () => pagamentoService.getRepasses(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar repasses' : null

  return {
    repasses,
    loading,
    error,
    refetch,
  }
}

export const useFinancialSummary = (periodo?: { inicio: string; fim: string }) => {
  const { data: summary, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['financial-summary', periodo],
    queryFn: async () => {
      const data = await pagamentoService.getFinancialSummary(periodo)
      if (data) return data
      return {
        total_receitas: 0,
        total_despesas: 0,
        saldo: 0,
        pagamentos_pendentes: 0,
        repasses_pendentes: 0,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar resumo financeiro' : null

  return {
    summary: summary || null,
    loading,
    error,
  }
}

export const useAdminFinancialHistory = (filters: GetPagamentosFilters = {}) => {
  const { data: history = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['admin-financial-history', filters],
    queryFn: () => pagamentoService.getFinancialHistory(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar histórico financeiro' : null

  return {
    history,
    loading,
    error,
    refetch,
  }
}

