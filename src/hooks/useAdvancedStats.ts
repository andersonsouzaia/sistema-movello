import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface AdvancedStats {
  empresas_crescimento_30d: number
  motoristas_crescimento_30d: number
  empresas_aprovadas_30d: number
  motoristas_aprovados_30d: number
  total_acoes_hoje: number
  notificacoes_nao_lidas: number
}

export const useAdvancedStats = () => {
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase.rpc('get_advanced_stats')

      if (queryError) {
        throw queryError
      }

      if (data && data.length > 0) {
        setStats(data[0] as AdvancedStats)
      } else {
        // Valores padrão
        setStats({
          empresas_crescimento_30d: 0,
          motoristas_crescimento_30d: 0,
          empresas_aprovadas_30d: 0,
          motoristas_aprovados_30d: 0,
          total_acoes_hoje: 0,
          notificacoes_nao_lidas: 0,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas'
      setError(errorMessage)
      console.error('Erro ao buscar estatísticas avançadas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}

