import { supabase } from '@/lib/supabase'
import { campanhaService } from './campanhaService'
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

export const empresaStatsService = {
  /**
   * Buscar estatísticas da empresa
   */
  async getStats(empresaId?: string): Promise<EmpresaStats> {
    try {
      const { data, error } = await supabase.rpc('get_empresa_stats', {
        p_empresa_id: empresaId || null,
      })

      if (error) {
        throw error
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
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      // Retornar valores padrão em caso de erro
      return {
        total_campanhas: 0,
        campanhas_ativas: 0,
        campanhas_pendentes: 0,
        total_visualizacoes: 0,
        total_gasto: 0,
        orcamento_total: 0,
        saldo_disponivel: 0,
      }
    }
  },

  /**
   * Buscar métricas de uma campanha específica
   */
  async getCampanhaMetrics(
    campanhaId: string,
    periodo: { inicio: string; fim: string }
  ): Promise<CampanhaMetrica[]> {
    try {
      return await campanhaService.getCampanhaMetricas(campanhaId, periodo)
    } catch (error) {
      console.error('Erro ao buscar métricas da campanha:', error)
      return []
    }
  },
}


