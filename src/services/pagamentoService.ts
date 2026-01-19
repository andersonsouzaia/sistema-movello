import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import { notificationService } from '@/services/notificationService'
import type { Pagamento, Repasse, FinancialSummary, ProcessPaymentFormData, ProcessRepasseFormData } from '@/types/database'

export interface GetPagamentosFilters {
  status?: string
  empresa_id?: string
  data_inicio?: string
  data_fim?: string
  valor_min?: number
  valor_max?: number
  search?: string
}

export interface GetRepassesFilters {
  status?: string
  motorista_id?: string
  data_inicio?: string
  data_fim?: string
  valor_min?: number
  valor_max?: number
  search?: string
}

export const pagamentoService = {
  async getPagamentos(filters: GetPagamentosFilters = {}): Promise<Pagamento[]> {
    try {
      let query = supabase
        .from('pagamentos')
        .select('*')
        .order('criado_em', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.empresa_id) {
        query = query.eq('empresa_id', filters.empresa_id)
      }

      if (filters.data_inicio) {
        query = query.gte('criado_em', filters.data_inicio)
      }

      if (filters.data_fim) {
        query = query.lte('criado_em', filters.data_fim)
      }

      if (filters.valor_min) {
        query = query.gte('valor', filters.valor_min)
      }

      if (filters.valor_max) {
        query = query.lte('valor', filters.valor_max)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []) as Pagamento[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar pagamentos'
      console.error('Erro ao buscar pagamentos:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async getFinancialHistory(filters: GetPagamentosFilters = {}): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_admin_financial_history', {
        p_status: filters.status || null,
        p_search: filters.search || null
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao buscar histórico financeiro:', error)
      return []
    }
  },

  async getRepasses(filters: GetRepassesFilters = {}): Promise<Repasse[]> {
    try {
      let query = supabase
        .from('repasses')
        .select('*')
        .order('criado_em', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.motorista_id) {
        query = query.eq('motorista_id', filters.motorista_id)
      }

      if (filters.data_inicio) {
        query = query.gte('criado_em', filters.data_inicio)
      }

      if (filters.data_fim) {
        query = query.lte('criado_em', filters.data_fim)
      }

      if (filters.valor_min) {
        query = query.gte('valor', filters.valor_min)
      }

      if (filters.valor_max) {
        query = query.lte('valor', filters.valor_max)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []) as Repasse[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar repasses'
      console.error('Erro ao buscar repasses:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async processPayment(
    pagamentoId: string,
    adminId: string,
    data?: ProcessPaymentFormData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('process_payment', {
        p_pagamento_id: pagamentoId,
        p_admin_id: adminId,
        p_referencia_externa: data?.referencia_externa || null,
      })

      if (error) {
        throw error
      }

      // Buscar pagamento para notificar empresa
      const { data: pagamento } = await supabase
        .from('pagamentos')
        .select('empresa_id, valor')
        .eq('id', pagamentoId)
        .single()

      if (pagamento) {
        await notificationService.createNotification({
          userId: pagamento.empresa_id,
          type: 'success',
          title: 'Pagamento Processado',
          message: `Seu pagamento de R$ ${pagamento.valor.toFixed(2)} foi processado com sucesso`,
          link: `/empresa/pagamentos`,
        })
      }

      // Registrar no audit log
      await logAction(adminId, 'pagamento.process', 'pagamentos', pagamentoId, {
        pagamento_id: pagamentoId,
        referencia_externa: data?.referencia_externa,
      })

      toast.success('Pagamento processado com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento'
      console.error('Erro ao processar pagamento:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async processRepasse(
    repasseId: string,
    adminId: string,
    data?: ProcessRepasseFormData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('process_repasse', {
        p_repasse_id: repasseId,
        p_admin_id: adminId,
        p_referencia_externa: data?.referencia_externa || null,
      })

      if (error) {
        throw error
      }

      // Buscar repasse para notificar motorista
      const { data: repasse } = await supabase
        .from('repasses')
        .select('motorista_id, valor_liquido')
        .eq('id', repasseId)
        .single()

      if (repasse) {
        await notificationService.createNotification({
          userId: repasse.motorista_id,
          type: 'success',
          title: 'Repasse Processado',
          message: `Seu repasse de R$ ${repasse.valor_liquido.toFixed(2)} foi processado e está disponível`,
          link: `/motorista/ganhos`,
        })
      }

      // Registrar no audit log
      await logAction(adminId, 'repasse.process', 'repasses', repasseId, {
        repasse_id: repasseId,
        referencia_externa: data?.referencia_externa,
      })

      toast.success('Repasse processado com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar repasse'
      console.error('Erro ao processar repasse:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async retryFailedPayment(
    id: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('retry_failed_payment', {
        p_pagamento_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'pagamento.retry', 'pagamentos', id, {
        pagamento_id: id,
      })

      toast.success('Pagamento será reprocessado')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reprocessar pagamento'
      console.error('Erro ao reprocessar pagamento:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async getFinancialSummary(periodo?: { inicio: string; fim: string }): Promise<FinancialSummary | null> {
    try {
      const { data, error } = await supabase.rpc('get_financial_summary', {
        p_data_inicio: periodo?.inicio || null,
        p_data_fim: periodo?.fim || null,
      })

      if (error) {
        // Se a função não existe ou há erro de permissão, retornar valores padrão
        if (error.code === 'PGRST202' || error.code === '42883') {
          return {
            total_receitas: 0,
            total_despesas: 0,
            saldo: 0,
            pagamentos_pendentes: 0,
            repasses_pendentes: 0,
          }
        }
        throw error
      }

      if (data && data.length > 0) {
        return data[0] as FinancialSummary
      }

      // Retornar valores padrão quando não há dados
      return {
        total_receitas: 0,
        total_despesas: 0,
        saldo: 0,
        pagamentos_pendentes: 0,
        repasses_pendentes: 0,
      }
    } catch (error) {
      // Não logar erro repetidamente - apenas retornar valores padrão
      // O erro será tratado no hook
      return {
        total_receitas: 0,
        total_despesas: 0,
        saldo: 0,
        pagamentos_pendentes: 0,
        repasses_pendentes: 0,
      }
    }
  },
}

