import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { campanhaService } from '@/services/campanhaService'
import type { CampanhaMetrica } from '@/types/database'

export interface EmpresaStats {
  total_campanhas: number
  campanhas_ativas: number
  campanhas_pendentes: number
  total_visualizacoes: number
  total_gasto: number
  orcamento_total: number
  saldo_disponivel: number
}

/**
 * Hook para buscar estatísticas da empresa
 */
export const useEmpresaStats = (empresaId?: string) => {
  const { empresa: authEmpresa } = useAuth()
  const targetId = empresaId || authEmpresa?.id

  const { data: stats = null, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['empresa-stats', targetId],
    queryFn: async () => {
      if (!targetId) return null

      // A função get_empresa_stats aceita p_empresa_id opcional (usa auth.uid() se não fornecido)
      console.log('🔵 [useEmpresaStats] Buscando stats para:', targetId)
      const { data, error: rpcError } = await supabase.rpc('get_empresa_stats', {
        p_empresa_id: targetId,
      })

      if (rpcError) {
        throw rpcError
      }

      if (data && data.length > 0) {
        return data[0] as EmpresaStats
      }

      // Retornar valores padrão se não houver dados
      return {
        total_campanhas: 0,
        campanhas_ativas: 0,
        campanhas_pendentes: 0,
        total_visualizacoes: 0,
        total_gasto: 0,
        orcamento_total: 0,
        saldo_disponivel: 0,
      } as EmpresaStats
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar estatísticas' : null

  return {
    stats,
    loading: loading && !!targetId,
    error,
    refetch,
    invalidateCache: refetch, // Compatibilidade
  }
}

/**
 * Hook para buscar métricas de uma campanha específica
 */
export const useCampanhaMetrics = (campanhaId: string | null, periodo?: { inicio: string; fim: string }) => {
  const { data: metrics = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['campanha-metrics-service', campanhaId, periodo],
    queryFn: async () => {
      if (!campanhaId) return []

      const periodoDefault = periodo || {
        inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        fim: new Date().toISOString().split('T')[0],
      }

      return campanhaService.getCampanhaMetricas(campanhaId, periodoDefault)
    },
    enabled: !!campanhaId,
    staleTime: 5 * 60 * 1000,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar métricas' : null

  return {
    metrics,
    loading: loading && !!campanhaId,
    error,
  }
}
