import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface EmpresaPagamento {
  id: string
  empresa_id: string
  valor: number
  metodo_pagamento: string | null
  status: string
  criado_em: string
  processado_em: string | null
  descricao?: string
  tipo?: string
}

export interface UseEmpresaPagamentosFilters {
  status?: string
}

export interface CreatePagamentoData {
  valor: number
  metodo_pagamento: string
}

/**
 * Hook para listar pagamentos da empresa
 */
export const useEmpresaPagamentos = (filters: UseEmpresaPagamentosFilters = {}) => {
  const { empresa } = useAuth()

  const stableFilters = filters.status || null

  const { data: pagamentos = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['empresa-pagamentos', empresa?.id, stableFilters],
    queryFn: async () => {
      if (!empresa?.id) return []

      const { data, error: rpcError } = await supabase.rpc('get_empresa_pagamentos', {
        p_empresa_id: empresa.id,
        p_status: stableFilters,
      })

      if (rpcError) throw rpcError
      return (data || []) as EmpresaPagamento[]
    },
    enabled: !!empresa?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar pagamentos' : null

  return {
    pagamentos,
    loading: loading && !!empresa?.id,
    error,
    refetch,
  }
}

/**
 * Hook para criar um novo pagamento
 */
export const useCreatePagamento = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: createPagamento, isPending: loading, error: queryError } = useMutation({
    mutationFn: async (data: CreatePagamentoData) => {
      if (!empresa?.id) throw new Error('Empresa não encontrada')
      if (data.valor < 50.00) throw new Error('Valor mínimo é R$ 50,00')

      const { data: pagamentoData, error: insertError } = await supabase
        .from('pagamentos')
        .insert({
          empresa_id: empresa.id,
          valor: data.valor,
          metodo_pagamento: data.metodo_pagamento,
          valor_liquido: data.valor,
          status: 'pendente',
        })
        .select()
        .single()

      if (insertError) throw insertError
      return pagamentoData as EmpresaPagamento
    },
    onSuccess: () => {
      toast.success('Pagamento criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['empresa-pagamentos'] })
      queryClient.invalidateQueries({ queryKey: ['empresa-stats'] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar pagamento'
      toast.error(errorMessage)
    }
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao criar pagamento' : null

  return {
    createPagamento,
    loading,
    error,
  }
}


