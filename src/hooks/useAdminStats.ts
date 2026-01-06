import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface AdminStats {
  total_empresas: number
  empresas_ativas: number
  empresas_pendentes: number
  empresas_bloqueadas: number
  total_motoristas: number
  motoristas_aprovados: number
  motoristas_pendentes: number
  motoristas_bloqueados: number
  total_usuarios_ativos: number
  campanhas_ativas?: number
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase.rpc('get_admin_stats')

      if (queryError) {
        throw queryError
      }

      if (data && data.length > 0) {
        const statsData = data[0] as AdminStats
        // Garantir que campanhas_ativas existe (pode não estar na versão antiga)
        setStats({
          ...statsData,
          campanhas_ativas: statsData.campanhas_ativas || 0,
        })
      } else {
        // Valores padrão se não houver dados
        setStats({
          total_empresas: 0,
          empresas_ativas: 0,
          empresas_pendentes: 0,
          empresas_bloqueadas: 0,
          total_motoristas: 0,
          motoristas_aprovados: 0,
          motoristas_pendentes: 0,
          motoristas_bloqueados: 0,
          total_usuarios_ativos: 0,
          campanhas_ativas: 0,
        })
      }
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err)
      setError(err.message || 'Erro ao buscar estatísticas')
      // Não mostrar toast para evitar spam no dashboard
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

