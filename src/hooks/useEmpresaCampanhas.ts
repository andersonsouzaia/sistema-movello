import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { campanhaService, GetCampanhasFilters } from '@/services/campanhaService'
import { empresaCampanhaService } from '@/services/empresaCampanhaService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { CampanhaWithEmpresa, Campanha } from '@/types/database'

export interface UseEmpresaCampanhasFilters {
  status?: string
  data_inicio?: string
  data_fim?: string
  orcamento_min?: number
  orcamento_max?: number
  search?: string
}

export interface CreateCampanhaData {
  titulo: string
  descricao: string
  orcamento: number
  data_inicio: string
  data_fim: string
  // Campos de geolocalização
  localizacao_tipo?: 'raio' | 'poligono' | 'cidade' | 'estado' | 'regiao'
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  regioes?: string[]
  // Campos de nicho
  nicho?: string
  categorias?: string[]
  // Campos de público-alvo
  publico_alvo?: {
    idade_min?: number
    idade_max?: number
    genero?: string[]
    interesses?: string[]
  }
  horarios_exibicao?: Record<string, { inicio: string; fim: string }>
  dias_semana?: number[]
  // Campos de objetivos
  objetivo_principal?: 'awareness' | 'consideracao' | 'conversao' | 'retencao' | 'engajamento'
  objetivos_secundarios?: string[]
  kpis_meta?: {
    visualizacoes?: number
    cliques?: number
    conversoes?: number
    ctr?: number
    cpc?: number
    roi?: number
  }
  estrategia?: 'cpc' | 'cpm' | 'cpa' | 'cpl'
}

export interface UpdateCampanhaData {
  titulo: string
  descricao: string
  orcamento: number
  data_inicio: string
  data_fim: string
}

/**
 * Hook para listar campanhas da empresa autenticada
 */
/**
 * Hook para listar campanhas da empresa autenticada
 */
export const useEmpresaCampanhas = (filters: UseEmpresaCampanhasFilters = {}) => {
  const { empresa } = useAuth()

  const stableFilters = useMemo(() => {
    if (!empresa?.id) return {}

    return {
      empresa_id: empresa.id,
      ...filters,
    } as GetCampanhasFilters
  }, [
    empresa?.id,
    filters.status,
    filters.data_inicio,
    filters.data_fim,
    filters.orcamento_min,
    filters.orcamento_max,
    filters.search,
  ])

  const { data: campanhas = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['empresa-campanhas', stableFilters],
    queryFn: async () => {
      if (!empresa?.id) return []
      const { data } = await campanhaService.getCampanhas(stableFilters)
      return data
    },
    enabled: !!empresa?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar campanhas' : null

  return {
    campanhas,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook para buscar detalhes de uma campanha específica da empresa
 */
/**
 * Hook para buscar detalhes de uma campanha específica da empresa
 */
export const useEmpresaCampanha = (id: string) => {
  const { empresa } = useAuth()

  const { data: campanha, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['campanha', id],
    queryFn: async () => {
      if (!id) return null
      const data = await campanhaService.getCampanha(id)
      if (data && data.empresa_id !== empresa?.id) {
        throw new Error('Campanha não encontrada ou você não tem permissão para visualizá-la')
      }
      return data
    },
    enabled: !!id && !!empresa?.id,
    retry: false,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar campanha' : null

  return {
    campanha,
    loading,
    error,
  }
}

/**
 * Hook para criar uma nova campanha
 */
/**
 * Hook para criar uma nova campanha
 */
export const useCreateCampanha = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: createCampanha, isPending: loading, error: queryError } = useMutation({
    mutationFn: async (data: CreateCampanhaData) => {
      if (!empresa?.id) throw new Error('Empresa não encontrada')
      // Usar o serviço atualizado que suporta todos os novos campos
      return empresaCampanhaService.createCampanha(data)
    },
    onSuccess: () => {
      toast.success('Campanha criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['empresa-campanhas'] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar campanha'
      toast.error(errorMessage)
    }
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao criar campanha' : null

  return {
    createCampanha,
    loading,
    error,
  }
}

/**
 * Hook para atualizar uma campanha
 */
/**
 * Hook para atualizar uma campanha
 */
export const useUpdateCampanha = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: updateCampanha, isPending: loading, error: queryError } = useMutation({
    mutationFn: async ({ campanhaId, data }: { campanhaId: string; data: UpdateCampanhaData }) => {
      if (!empresa?.id) throw new Error('Empresa não encontrada')

      const { error: rpcError } = await supabase.rpc('update_campanha_empresa', {
        p_campanha_id: campanhaId,
        p_titulo: data.titulo,
        p_descricao: data.descricao,
        p_orcamento: data.orcamento,
        p_data_inicio: data.data_inicio,
        p_data_fim: data.data_fim,
      })

      if (rpcError) throw rpcError
      return true
    },
    onSuccess: (_, variables) => {
      toast.success('Campanha atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['empresa-campanhas'] })
      queryClient.invalidateQueries({ queryKey: ['campanha', variables.campanhaId] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar campanha'
      toast.error(errorMessage)
    }
  })

  // Wrapper para manter assinatura
  const updateCampanhaWrapper = (campanhaId: string, data: UpdateCampanhaData) => updateCampanha({ campanhaId, data })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao atualizar campanha' : null

  return {
    updateCampanha: updateCampanhaWrapper,
    loading,
    error,
  }
}

/**
 * Hook para pausar/ativar uma campanha
 */
/**
 * Hook para pausar/ativar uma campanha
 */
export const useToggleCampanha = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: toggleCampanha, isPending: loading, error: queryError } = useMutation({
    mutationFn: async ({ campanhaId, action }: { campanhaId: string; action: 'pause' | 'activate' }) => {
      if (!empresa?.id) throw new Error('Empresa não encontrada')

      const { error: rpcError } = await supabase.rpc('toggle_campanha_empresa', {
        p_campanha_id: campanhaId,
        p_action: action,
      })

      if (rpcError) throw rpcError
      return true
    },
    onSuccess: (_, variables) => {
      const message = variables.action === 'pause' ? 'Campanha pausada com sucesso!' : 'Campanha ativada com sucesso!'
      toast.success(message)
      queryClient.invalidateQueries({ queryKey: ['empresa-campanhas'] })
      queryClient.invalidateQueries({ queryKey: ['campanha', variables.campanhaId] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status da campanha'
      toast.error(errorMessage)
    }
  })

  // Wrapper para manter assinatura
  const toggleCampanhaWrapper = (campanhaId: string, action: 'pause' | 'activate') => toggleCampanha({ campanhaId, action })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao alterar status da campanha' : null

  return {
    toggleCampanha: toggleCampanhaWrapper,
    loading,
    error,
  }
}

/**
 * Hook para deletar uma campanha
 */
export const useDeleteCampanha = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: deleteCampanha, isPending: loading, error: queryError } = useMutation({
    mutationFn: async (campanhaId: string) => {
      if (!empresa?.id) throw new Error('Empresa não encontrada')
      return empresaCampanhaService.deleteCampanha(campanhaId)
    },
    onSuccess: () => {
      // Toast já é exibido no serviço, mas invalidar queries é crucial
      queryClient.invalidateQueries({ queryKey: ['empresa-campanhas'] })
    },
    onError: (err) => {
      // Erro já tratado no serviço via toast, mas podemos logar ou tratar específico aqui se necessário
    }
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao excluir campanha' : null

  return {
    deleteCampanha,
    loading,
    error,
  }
}

