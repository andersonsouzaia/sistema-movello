import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Tablet } from '@/types/database'

export interface ValidarTabletResult {
  existe: boolean
  disponivel: boolean
  status: string | null
  motorista_id: string | null
  mensagem: string
}

export interface VincularTabletResult {
  sucesso: boolean
  mensagem: string
}

export const tabletService = {
  /**
   * Validar se tablet está disponível para vinculação
   */
  async validarTablet(tabletId: string): Promise<ValidarTabletResult> {
    try {
      const { data, error } = await supabase.rpc('validar_tablet_disponivel', {
        p_tablet_id: tabletId,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return {
          existe: false,
          disponivel: false,
          status: null,
          motorista_id: null,
          mensagem: 'Tablet não encontrado',
        }
      }

      return data[0] as ValidarTabletResult
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao validar tablet'
      console.error('Erro ao validar tablet:', error)
      toast.error(errorMessage)
      return {
        existe: false,
        disponivel: false,
        status: null,
        motorista_id: null,
        mensagem: errorMessage,
      }
    }
  },

  /**
   * Vincular tablet ao motorista
   */
  async vincularTablet(motoristaId: string, tabletId: string): Promise<VincularTabletResult> {
    try {
      // Primeiro validar se tablet está disponível
      const validacao = await this.validarTablet(tabletId)

      if (!validacao.existe) {
        return {
          sucesso: false,
          mensagem: validacao.mensagem,
        }
      }

      if (!validacao.disponivel) {
        return {
          sucesso: false,
          mensagem: validacao.mensagem,
        }
      }

      // Vincular usando função do banco
      const { data, error } = await supabase.rpc('vincular_tablet_motorista', {
        p_motorista_id: motoristaId,
        p_tablet_id: tabletId,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return {
          sucesso: false,
          mensagem: 'Erro ao vincular tablet',
        }
      }

      const result = data[0] as VincularTabletResult

      if (result.sucesso) {
        toast.success(result.mensagem)
      } else {
        toast.error(result.mensagem)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao vincular tablet'
      console.error('Erro ao vincular tablet:', error)
      toast.error(errorMessage)
      return {
        sucesso: false,
        mensagem: errorMessage,
      }
    }
  },

  /**
   * Desvincular tablet do motorista
   */
  async desvincularTablet(motoristaId: string): Promise<VincularTabletResult> {
    try {
      const { data, error } = await supabase.rpc('desvincular_tablet_motorista', {
        p_motorista_id: motoristaId,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return {
          sucesso: false,
          mensagem: 'Erro ao desvincular tablet',
        }
      }

      const result = data[0] as VincularTabletResult

      if (result.sucesso) {
        toast.success(result.mensagem)
      } else {
        toast.error(result.mensagem)
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desvincular tablet'
      console.error('Erro ao desvincular tablet:', error)
      toast.error(errorMessage)
      return {
        sucesso: false,
        mensagem: errorMessage,
      }
    }
  },

  /**
   * Buscar tablet por ID
   */
  async getTablet(tabletId: string): Promise<Tablet | null> {
    try {
      const { data, error } = await supabase
        .from('tablets')
        .select('*')
        .eq('id', tabletId)
        .single()

      if (error) {
        throw error
      }

      return data as Tablet
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar tablet'
      console.error('Erro ao buscar tablet:', error)
      return null
    }
  },

  /**
   * Buscar tablets do motorista
   */
  async getTabletsByMotorista(motoristaId: string): Promise<Tablet[]> {
    try {
      const { data, error } = await supabase
        .from('tablets')
        .select('*')
        .eq('motorista_id', motoristaId)

      if (error) {
        throw error
      }

      return (data || []) as Tablet[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar tablets'
      console.error('Erro ao buscar tablets:', error)
      return []
    }
  },
}
