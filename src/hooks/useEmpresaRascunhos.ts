import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { empresaRascunhoService } from '@/services/empresaRascunhoService'
import type { CreateCampanhaData } from '@/services/empresaCampanhaService'

/**
 * Hook para listar rascunhos da empresa
 */
export const useRascunhos = () => {
  const { empresa } = useAuth()

  const { data: rascunhos = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['empresa-rascunhos', empresa?.id],
    queryFn: async () => {
      if (!empresa?.id) return []
      return empresaRascunhoService.listarRascunhos()
    },
    enabled: !!empresa?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar rascunhos' : null

  return {
    rascunhos,
    loading: loading && !!empresa?.id,
    error,
    refetch,
    invalidateCache: refetch,
  }
}

/**
 * Hook para salvar/atualizar rascunho
 */
export const useSalvarRascunho = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: salvarRascunhoMutation, isPending: loading, error: queryError } = useMutation({
    mutationFn: async ({ campanhaId, dados }: { campanhaId: string | null; dados: CreateCampanhaData }) => {
      return empresaRascunhoService.salvarRascunho(campanhaId, dados)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-rascunhos'] })
    },
  })

  const salvarRascunho = async (campanhaId: string | null, dados: CreateCampanhaData) => {
    return salvarRascunhoMutation({ campanhaId, dados })
  }

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao salvar rascunho' : null

  return {
    salvarRascunho,
    loading,
    error,
  }
}

/**
 * Hook para ativar rascunho
 */
export const useAtivarRascunho = () => {
  const queryClient = useQueryClient()

  const { mutateAsync: ativarRascunhoMutation, isPending: loading, error: queryError } = useMutation({
    mutationFn: async (campanhaId: string) => {
      return empresaRascunhoService.ativarRascunho(campanhaId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa-rascunhos'] })
      queryClient.invalidateQueries({ queryKey: ['empresa-campanhas'] })
      queryClient.invalidateQueries({ queryKey: ['empresa-stats'] })
    },
  })

  const ativarRascunho = async (campanhaId: string) => {
    try {
      return await ativarRascunhoMutation(campanhaId)
    } catch (err: any) {
      return { sucesso: false, mensagem: err.message || 'Erro ao ativar rascunho' }
    }
  }

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao ativar rascunho' : null

  return {
    ativarRascunho,
    loading,
    error,
  }
}

