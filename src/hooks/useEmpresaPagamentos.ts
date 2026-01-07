import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [pagamentos, setPagamentos] = useState<EmpresaPagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef<string>('')
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const stableFilters = filters.status || null

  const fetchPagamentos = useCallback(async () => {
    if (isFetchingRef.current || !empresa?.id) {
      if (!empresa?.id) {
        setLoading(false)
        setPagamentos([])
      }
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('get_empresa_pagamentos', {
        p_empresa_id: empresa.id,
        p_status: stableFilters,
      })

      if (rpcError) {
        throw rpcError
      }

      setPagamentos((data || []) as EmpresaPagamento[])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar pagamentos'
      setError(errorMessage)
      console.error('Erro ao buscar pagamentos:', err)
      setPagamentos([])
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [empresa?.id, stableFilters])

  useEffect(() => {
    const filtersKey = JSON.stringify(stableFilters)
    const filtersChanged = filtersRef.current !== filtersKey

    if (!hasInitializedRef.current || filtersChanged) {
      hasInitializedRef.current = true
      filtersRef.current = filtersKey
      fetchPagamentos()
    }
  }, [stableFilters, fetchPagamentos])

  return {
    pagamentos,
    loading,
    error,
    refetch: fetchPagamentos,
  }
}

/**
 * Hook para criar um novo pagamento
 */
export const useCreatePagamento = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPagamento = useCallback(async (data: CreatePagamentoData) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    // Validar valor mínimo
    if (data.valor < 50.00) {
      throw new Error('Valor mínimo é R$ 50,00')
    }

    setLoading(true)
    setError(null)

    try {
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

      if (insertError) {
        throw insertError
      }

      toast.success('Pagamento criado com sucesso!')
      return pagamentoData as EmpresaPagamento
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar pagamento'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    createPagamento,
    loading,
    error,
  }
}


