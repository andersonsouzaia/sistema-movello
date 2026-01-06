import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
export const useEmpresaCampanhas = (filters: UseEmpresaCampanhasFilters = {}) => {
  const { empresa } = useAuth()
  const [campanhas, setCampanhas] = useState<CampanhaWithEmpresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef<string>('')
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // Estabilizar o objeto filters usando useMemo
  const stableFilters = useMemo(() => {
    if (!empresa?.id) return {}
    
    return {
      empresa_id: empresa.id,
      ...filters,
    } as GetCampanhasFilters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    empresa?.id,
    filters.status,
    filters.data_inicio,
    filters.data_fim,
    filters.orcamento_min,
    filters.orcamento_max,
    filters.search,
  ])

  const fetchCampanhas = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isFetchingRef.current) return
    
    // Não buscar se não houver empresa
    if (!empresa?.id) {
      setLoading(false)
      setCampanhas([])
      return
    }
    
    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)
      const data = await campanhaService.getCampanhas(stableFilters)
      setCampanhas(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanhas'
      setError(errorMessage)
      console.error('Erro ao buscar campanhas:', err)
      setCampanhas([])
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [stableFilters, empresa?.id])

  useEffect(() => {
    // Buscar na primeira renderização ou quando os filtros mudarem
    const filtersKey = JSON.stringify(stableFilters)
    const filtersChanged = filtersRef.current !== filtersKey
    
    if (!hasInitializedRef.current || filtersChanged) {
      hasInitializedRef.current = true
      filtersRef.current = filtersKey
      fetchCampanhas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableFilters])

  return {
    campanhas,
    loading,
    error,
    refetch: fetchCampanhas,
  }
}

/**
 * Hook para buscar detalhes de uma campanha específica da empresa
 */
export const useEmpresaCampanha = (id: string) => {
  const { empresa } = useAuth()
  const [campanha, setCampanha] = useState<CampanhaWithEmpresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampanha = async () => {
      if (!id || !empresa?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await campanhaService.getCampanha(id)
        
        // Verificar se a campanha pertence à empresa
        if (data && data.empresa_id !== empresa.id) {
          setError('Campanha não encontrada ou você não tem permissão para visualizá-la')
          setCampanha(null)
        } else {
          setCampanha(data)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanha'
        setError(errorMessage)
        console.error('Erro ao buscar campanha:', err)
        setCampanha(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCampanha()
  }, [id, empresa?.id])

  return {
    campanha,
    loading,
    error,
  }
}

/**
 * Hook para criar uma nova campanha
 */
export const useCreateCampanha = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCampanha = useCallback(async (data: CreateCampanhaData) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      // Usar o serviço atualizado que suporta todos os novos campos
      const campanhaId = await empresaCampanhaService.createCampanha(data)
      return campanhaId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar campanha'
      setError(errorMessage)
      // O serviço já mostra o toast de erro, então não precisamos mostrar aqui
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    createCampanha,
    loading,
    error,
  }
}

/**
 * Hook para atualizar uma campanha
 */
export const useUpdateCampanha = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCampanha = useCallback(async (campanhaId: string, data: UpdateCampanhaData) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      const { error: rpcError } = await supabase.rpc('update_campanha_empresa', {
        p_campanha_id: campanhaId,
        p_titulo: data.titulo,
        p_descricao: data.descricao,
        p_orcamento: data.orcamento,
        p_data_inicio: data.data_inicio,
        p_data_fim: data.data_fim,
      })

      if (rpcError) {
        throw rpcError
      }

      toast.success('Campanha atualizada com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar campanha'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    updateCampanha,
    loading,
    error,
  }
}

/**
 * Hook para pausar/ativar uma campanha
 */
export const useToggleCampanha = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleCampanha = useCallback(async (campanhaId: string, action: 'pause' | 'activate') => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      const { error: rpcError } = await supabase.rpc('toggle_campanha_empresa', {
        p_campanha_id: campanhaId,
        p_action: action,
      })

      if (rpcError) {
        throw rpcError
      }

      const message = action === 'pause' ? 'Campanha pausada com sucesso!' : 'Campanha ativada com sucesso!'
      toast.success(message)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status da campanha'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    toggleCampanha,
    loading,
    error,
  }
}

