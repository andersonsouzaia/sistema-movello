import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type {
  CampanhaMetricasConsolidadas,
  MetricaDiaria,
} from '@/types/database'

export const empresaMetricasService = {
  /**
   * Obter métricas consolidadas de uma campanha
   */
  async getCampanhaMetricas(
    campanhaId: string,
    periodo?: { inicio: string; fim: string }
  ): Promise<CampanhaMetricasConsolidadas> {
    try {
      const { data, error } = await supabase.rpc('get_campanha_metricas', {
        p_campanha_id: campanhaId,
        p_data_inicio: periodo?.inicio || null,
        p_data_fim: periodo?.fim || null,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        // Retornar valores padrão se não houver métricas
        return {
          total_visualizacoes: 0,
          total_cliques: 0,
          total_conversoes: 0,
          total_gasto: 0,
          total_impressoes: 0,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          cpa: 0,
          taxa_conversao: 0,
          tempo_medio_visualizacao: 0,
        }
      }

      return data[0] as CampanhaMetricasConsolidadas
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao buscar métricas da campanha'
      console.error('Erro ao buscar métricas:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Obter métricas diárias de uma campanha
   */
  async getMetricasDiarias(
    campanhaId: string,
    dias: number = 30
  ): Promise<MetricaDiaria[]> {
    try {
      const { data, error } = await supabase.rpc(
        'get_metricas_diarias_campanha',
        {
          p_campanha_id: campanhaId,
          p_dias: dias,
        }
      )

      if (error) {
        throw error
      }

      return (data || []) as MetricaDiaria[]
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao buscar métricas diárias'
      console.error('Erro ao buscar métricas diárias:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Obter métricas diárias agregadas da empresa
   */
  async getEmpresaMetricasDiarias(
    dias: number = 30
  ): Promise<MetricaDiaria[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase.rpc(
        'get_empresa_metricas_diarias',
        {
          p_empresa_id: user.id,
          p_dias: dias,
        }
      )

      if (error) {
        throw error
      }

      return (data || []) as MetricaDiaria[]
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao buscar métricas diárias da empresa'
      console.error('Erro ao buscar métricas diárias:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Obter métricas consolidadas da empresa
   */
  async getEmpresaMetricasConsolidadas(): Promise<{
    periodo_atual: CampanhaMetricasConsolidadas
    periodo_anterior: Partial<CampanhaMetricasConsolidadas>
    tendencias: {
      visualizacoes_crescimento: number
      gasto_crescimento: number
      cliques_crescimento: number
      conversoes_crescimento: number
    }
  }> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase.rpc(
        'get_empresa_metricas_consolidadas',
        {
          p_empresa_id: user.id,
        }
      )

      if (error) {
        throw error
      }

      const resultado = data as {
        periodo_atual: CampanhaMetricasConsolidadas
        periodo_anterior: Partial<CampanhaMetricasConsolidadas>
        tendencias: {
          visualizacoes_crescimento: number
          gasto_crescimento: number
          cliques_crescimento: number
          conversoes_crescimento: number
        }
      }

      return resultado
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao buscar métricas consolidadas'
      console.error('Erro ao buscar métricas consolidadas:', error)
      toast.error(errorMessage)
      throw error
    }
  },
}

