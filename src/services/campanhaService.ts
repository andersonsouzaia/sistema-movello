import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import type { Campanha, CampanhaWithEmpresa, CampanhaMetrica, UpdateCampanhaFormData } from '@/types/database'

export interface GetCampanhasFilters {
  status?: string
  empresa_id?: string
  data_inicio?: string
  data_fim?: string
  orcamento_min?: number
  orcamento_max?: number
  search?: string
}

export const campanhaService = {
  async getCampanhas(filters: GetCampanhasFilters = {}): Promise<CampanhaWithEmpresa[]> {
    try {
      let query = supabase
        .from('campanhas')
        .select('*, empresa:empresa_id(id, razao_social, nome_fantasia)')
        .order('criado_em', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.empresa_id) {
        query = query.eq('empresa_id', filters.empresa_id)
      }

      if (filters.data_inicio) {
        query = query.gte('data_inicio', filters.data_inicio)
      }

      if (filters.data_fim) {
        query = query.lte('data_fim', filters.data_fim)
      }

      if (filters.orcamento_min) {
        query = query.gte('orcamento', filters.orcamento_min)
      }

      if (filters.orcamento_max) {
        query = query.lte('orcamento', filters.orcamento_max)
      }

      if (filters.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => ({
        ...item,
        empresa: item.empresa || undefined,
      })) as CampanhaWithEmpresa[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar campanhas'
      console.error('Erro ao buscar campanhas:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async getCampanha(id: string): Promise<CampanhaWithEmpresa | null> {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*, empresa:empresa_id(id, razao_social, nome_fantasia)')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return {
        ...data,
        empresa: data.empresa || undefined,
      } as CampanhaWithEmpresa
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar campanha'
      console.error('Erro ao buscar campanha:', error)
      toast.error(errorMessage)
      return null
    }
  },

  async approveCampanha(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campanha = await this.getCampanha(id)
      
      const { error } = await supabase.rpc('approve_campanha', {
        p_campanha_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Notificação será criada via trigger no banco ou serviço separado

      // Registrar no audit log
      await logAction(adminId, 'campanha.approve', 'campanhas', id, {
        campanha_id: id,
        titulo: campanha?.titulo,
      })

      toast.success('Campanha aprovada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao aprovar campanha'
      console.error('Erro ao aprovar campanha:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async rejectCampanha(
    id: string,
    adminId: string,
    motivo: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const campanha = await this.getCampanha(id)
      
      const { error } = await supabase.rpc('reject_campanha', {
        p_campanha_id: id,
        p_admin_id: adminId,
        p_motivo: motivo,
      })

      if (error) {
        throw error
      }

      // Notificação será criada via trigger no banco ou serviço separado

      // Registrar no audit log
      await logAction(adminId, 'campanha.reject', 'campanhas', id, {
        campanha_id: id,
        titulo: campanha?.titulo,
        motivo,
      })

      toast.success('Campanha reprovada')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reprovar campanha'
      console.error('Erro ao reprovar campanha:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async pauseCampanha(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('pause_campanha', {
        p_campanha_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'campanha.pause', 'campanhas', id, {
        campanha_id: id,
      })

      toast.success('Campanha pausada')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao pausar campanha'
      console.error('Erro ao pausar campanha:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async activateCampanha(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('activate_campanha', {
        p_campanha_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'campanha.activate', 'campanhas', id, {
        campanha_id: id,
      })

      toast.success('Campanha ativada')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao ativar campanha'
      console.error('Erro ao ativar campanha:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async updateCampanha(
    id: string,
    data: UpdateCampanhaFormData,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('campanhas').update(data).eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'campanha.update', 'campanhas', id, {
        campanha_id: id,
        alteracoes: data,
      })

      toast.success('Campanha atualizada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar campanha'
      console.error('Erro ao atualizar campanha:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async getCampanhaMetricas(
    campanhaId: string,
    periodo: { inicio: string; fim: string }
  ): Promise<CampanhaMetrica[]> {
    try {
      const { data, error } = await supabase
        .from('campanha_metricas')
        .select('*')
        .eq('campanha_id', campanhaId)
        .gte('data', periodo.inicio)
        .lte('data', periodo.fim)
        .order('data', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []) as CampanhaMetrica[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar métricas'
      console.error('Erro ao buscar métricas:', error)
      return []
    }
  },
}

