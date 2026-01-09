import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Ganho, GanhoStats, GanhoMensal } from '@/types/database'

export interface GetGanhosFilters {
  status?: string
  tipo?: string
  motorista_id?: string
  data_inicio?: string
  data_fim?: string
  valor_min?: number
  valor_max?: number
  campanha_id?: string
}

export type PeriodoType = 'hoje' | 'semana' | 'mes' | 'ano'

export const ganhoService = {
  /**
   * Buscar ganhos com filtros
   */
  async getGanhos(filters: GetGanhosFilters = {}): Promise<Ganho[]> {
    try {
      let query = supabase
        .from('ganhos')
        .select('*')
        .order('data_exibicao', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo)
      }

      if (filters.motorista_id) {
        query = query.eq('motorista_id', filters.motorista_id)
      }

      if (filters.data_inicio) {
        query = query.gte('data_exibicao', filters.data_inicio)
      }

      if (filters.data_fim) {
        query = query.lte('data_exibicao', filters.data_fim)
      }

      if (filters.valor_min) {
        query = query.gte('valor', filters.valor_min)
      }

      if (filters.valor_max) {
        query = query.lte('valor', filters.valor_max)
      }

      if (filters.campanha_id) {
        query = query.eq('campanha_id', filters.campanha_id)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []) as Ganho[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar ganhos'
      console.error('Erro ao buscar ganhos:', error)
      toast.error(errorMessage)
      return []
    }
  },

  /**
   * Buscar estatísticas de ganhos do motorista
   */
  async getGanhosStats(motoristaId: string, periodo: PeriodoType = 'mes'): Promise<GanhoStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_motorista_ganhos_stats', {
        p_motorista_id: motoristaId,
        p_periodo: periodo,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return {
          ganhos_hoje: 0,
          ganhos_mes: 0,
          total_pendente: 0,
          total_pago: 0,
          total_ganhos: 0,
        }
      }

      return data[0] as GanhoStats
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar estatísticas de ganhos'
      console.error('Erro ao buscar estatísticas de ganhos:', error)
      toast.error(errorMessage)
      return null
    }
  },

  /**
   * Buscar ganhos mensais para gráficos
   */
  async getGanhosMensais(motoristaId: string, ano?: number): Promise<GanhoMensal[]> {
    try {
      const anoAtual = ano || new Date().getFullYear()

      const { data, error } = await supabase.rpc('get_motorista_ganhos_mensais', {
        p_motorista_id: motoristaId,
        p_ano: anoAtual,
      })

      if (error) {
        throw error
      }

      return (data || []) as GanhoMensal[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar ganhos mensais'
      console.error('Erro ao buscar ganhos mensais:', error)
      toast.error(errorMessage)
      return []
    }
  },

  /**
   * Buscar ganho específico por ID
   */
  async getGanho(id: string): Promise<Ganho | null> {
    try {
      const { data, error } = await supabase
        .from('ganhos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return data as Ganho
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar ganho'
      console.error('Erro ao buscar ganho:', error)
      toast.error(errorMessage)
      return null
    }
  },
}
