import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface EmpresaPagamento {
  id: string
  empresa_id: string
  valor: number
  metodo_pagamento: string | null
  status: string
  criado_em: string
  processado_em: string | null
}

export interface CreatePagamentoData {
  valor: number
  metodo_pagamento: string
}

export interface GetPagamentosFilters {
  status?: string
}

export const empresaPagamentoService = {
  /**
   * Listar pagamentos da empresa
   */
  async getPagamentos(filters: GetPagamentosFilters = {}): Promise<EmpresaPagamento[]> {
    try {
      const { data, error } = await supabase.rpc('get_empresa_pagamentos', {
        p_empresa_id: null, // Será usado auth.uid() na função SQL
        p_status: filters.status || null,
      })

      if (error) {
        throw error
      }

      return (data || []) as EmpresaPagamento[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar pagamentos'
      console.error('Erro ao buscar pagamentos:', error)
      toast.error(errorMessage)
      return []
    }
  },

  /**
   * Criar um novo pagamento
   */
  async createPagamento(data: CreatePagamentoData, empresaId: string): Promise<EmpresaPagamento> {
    try {
      // Validar valor mínimo
      if (data.valor < 50.00) {
        throw new Error('Valor mínimo é R$ 50,00')
      }

      const { data: pagamentoData, error } = await supabase
        .from('pagamentos')
        .insert({
          empresa_id: empresaId,
          valor: data.valor,
          metodo_pagamento: data.metodo_pagamento,
          valor_liquido: data.valor,
          status: 'pendente',
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      toast.success('Pagamento criado com sucesso!')
      return pagamentoData as EmpresaPagamento
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar pagamento'
      console.error('Erro ao criar pagamento:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Obter métodos de pagamento disponíveis
   */
  getPaymentMethods(): Array<{ value: string; label: string }> {
    return [
      { value: 'pix', label: 'PIX' },
      { value: 'cartao_credito', label: 'Cartão de Crédito' },
      { value: 'cartao_debito', label: 'Cartão de Débito' },
      { value: 'boleto', label: 'Boleto' },
      { value: 'transferencia', label: 'Transferência Bancária' },
    ]
  },
}

