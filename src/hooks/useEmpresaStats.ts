import { useState, useEffect, useCallback, useRef } from 'react'
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

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

let statsCache: {
  data: EmpresaStats | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

/**
 * Hook para buscar estatísticas da empresa
 */
export const useEmpresaStats = () => {
  const { empresa } = useAuth()
  const [stats, setStats] = useState<EmpresaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const fetchStats = useCallback(async () => {
    if (!empresa?.id || isFetchingRef.current) return

    // Verificar cache
    const now = Date.now()
    if (statsCache.data && (now - statsCache.timestamp) < CACHE_TTL) {
      setStats(statsCache.data)
      setLoading(false)
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      // A função get_empresa_stats aceita p_empresa_id opcional (usa auth.uid() se não fornecido)
      const { data, error: rpcError } = await supabase.rpc('get_empresa_stats', {
        p_empresa_id: empresa.id,
      })

      if (rpcError) {
        throw rpcError
      }

      if (data && data.length > 0) {
        const statsData = data[0] as EmpresaStats
        setStats(statsData)
        
        // Atualizar cache
        statsCache = {
          data: statsData,
          timestamp: now,
        }
      } else {
        // Retornar valores padrão se não houver dados
        const defaultStats: EmpresaStats = {
          total_campanhas: 0,
          campanhas_ativas: 0,
          campanhas_pendentes: 0,
          total_visualizacoes: 0,
          total_gasto: 0,
          orcamento_total: 0,
          saldo_disponivel: 0,
        }
        setStats(defaultStats)
        statsCache = {
          data: defaultStats,
          timestamp: now,
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err
        ? String(err.message)
        : 'Erro ao buscar estatísticas'
      setError(errorMessage)
      
      // Log mais detalhado apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao buscar estatísticas:', err)
      }
      
      // Retornar valores padrão em caso de erro
      const defaultStats: EmpresaStats = {
        total_campanhas: 0,
        campanhas_ativas: 0,
        campanhas_pendentes: 0,
        total_visualizacoes: 0,
        total_gasto: 0,
        orcamento_total: 0,
        saldo_disponivel: 0,
      }
      setStats(defaultStats)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [empresa?.id])

  useEffect(() => {
    if (!hasInitializedRef.current && empresa?.id) {
      hasInitializedRef.current = true
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id])

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    statsCache = {
      data: null,
      timestamp: 0,
    }
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    invalidateCache,
  }
}

/**
 * Hook para buscar métricas de uma campanha específica
 */
export const useCampanhaMetrics = (campanhaId: string | null, periodo?: { inicio: string; fim: string }) => {
  const [metrics, setMetrics] = useState<CampanhaMetrica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!campanhaId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const periodoDefault = periodo || {
          inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          fim: new Date().toISOString().split('T')[0],
        }

        const data = await campanhaService.getCampanhaMetricas(campanhaId, periodoDefault)
        setMetrics(data || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar métricas'
        setError(errorMessage)
        console.error('Erro ao buscar métricas:', err)
        setMetrics([])
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [campanhaId, periodo])

  return {
    metrics,
    loading,
    error,
  }
}

