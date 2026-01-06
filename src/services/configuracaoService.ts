import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import type { Configuracao, TemplateEmail, Automatizacao, UpdateConfiguracaoFormData } from '@/types/database'

export interface CreateTemplateEmailFormData {
  nome: string
  assunto: string
  corpo_html: string
  corpo_texto?: string
  variaveis: string[]
  ativo?: boolean
}

export interface CreateAutomatizacaoFormData {
  nome: string
  trigger_evento: string
  condicoes: Record<string, any>
  acoes: Record<string, any>
  ativo?: boolean
}

export const configuracaoService = {
  async getConfiguracoes(categoria?: string): Promise<Configuracao[]> {
    try {
      let query = supabase.from('configuracoes').select('*').order('categoria', { ascending: true })

      if (categoria) {
        query = query.eq('categoria', categoria)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => {
        let parsedValue = item.valor
        if (typeof item.valor === 'string') {
          try {
            parsedValue = JSON.parse(item.valor)
          } catch {
            // Se não for JSON válido, mantém como string
            parsedValue = item.valor
          }
        }
        return {
          ...item,
          valor: parsedValue,
        }
      }) as Configuracao[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar configurações'
      console.error('Erro ao buscar configurações:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async getConfiguracao(chave: string): Promise<Configuracao | null> {
    try {
      const { data, error } = await supabase.from('configuracoes').select('*').eq('chave', chave).single()

      if (error) {
        throw error
      }

      return {
        ...data,
        valor: typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor,
      } as Configuracao
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar configuração'
      console.error('Erro ao buscar configuração:', error)
      return null
    }
  },

  async updateConfiguracao(
    chave: string,
    valor: UpdateConfiguracaoFormData['valor'],
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const config = await this.getConfiguracao(chave)
      if (!config || !config.editavel) {
        throw new Error('Configuração não editável')
      }

      const valorJson = typeof valor === 'string' ? valor : JSON.stringify(valor)

      const { error } = await supabase
        .from('configuracoes')
        .update({ valor: valorJson, atualizado_em: new Date().toISOString() })
        .eq('chave', chave)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'configuracao.update', 'configuracoes', chave, {
        chave,
        valor_anterior: config.valor,
        valor_novo: valor,
      })

      toast.success('Configuração atualizada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar configuração'
      console.error('Erro ao atualizar configuração:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async getTemplatesEmail(): Promise<TemplateEmail[]> {
    try {
      const { data, error } = await supabase
        .from('templates_email')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => ({
        ...item,
        variaveis: typeof item.variaveis === 'string' ? JSON.parse(item.variaveis) : item.variaveis || [],
      })) as TemplateEmail[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar templates'
      console.error('Erro ao buscar templates:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async createTemplateEmail(
    data: CreateTemplateEmailFormData,
    adminId: string
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const { data: template, error } = await supabase
        .from('templates_email')
        .insert({
          ...data,
          variaveis: JSON.stringify(data.variaveis),
          ativo: data.ativo ?? true,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'template.create', 'templates_email', template.id, {
        template_id: template.id,
        nome: data.nome,
      })

      toast.success('Template criado com sucesso!')
      return { success: true, templateId: template.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar template'
      console.error('Erro ao criar template:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async updateTemplateEmail(
    id: string,
    data: Partial<CreateTemplateEmailFormData>,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { ...data }
      if (data.variaveis) {
        updateData.variaveis = JSON.stringify(data.variaveis)
      }

      const { error } = await supabase.from('templates_email').update(updateData).eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'template.update', 'templates_email', id, {
        template_id: id,
        alteracoes: data,
      })

      toast.success('Template atualizado com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar template'
      console.error('Erro ao atualizar template:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async getAutomatizacoes(): Promise<Automatizacao[]> {
    try {
      const { data, error } = await supabase
        .from('automatizacoes')
        .select('*')
        .order('nome', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => ({
        ...item,
        condicoes: typeof item.condicoes === 'string' ? JSON.parse(item.condicoes) : item.condicoes || {},
        acoes: typeof item.acoes === 'string' ? JSON.parse(item.acoes) : item.acoes || {},
      })) as Automatizacao[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar automações'
      console.error('Erro ao buscar automações:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async createAutomatizacao(
    data: CreateAutomatizacaoFormData,
    adminId: string
  ): Promise<{ success: boolean; automatizacaoId?: string; error?: string }> {
    try {
      const { data: automatizacao, error } = await supabase
        .from('automatizacoes')
        .insert({
          ...data,
          condicoes: JSON.stringify(data.condicoes),
          acoes: JSON.stringify(data.acoes),
          ativo: data.ativo ?? true,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'automatizacao.create', 'automatizacoes', automatizacao.id, {
        automatizacao_id: automatizacao.id,
        nome: data.nome,
      })

      toast.success('Automação criada com sucesso!')
      return { success: true, automatizacaoId: automatizacao.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar automação'
      console.error('Erro ao criar automação:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async updateAutomatizacao(
    id: string,
    data: Partial<CreateAutomatizacaoFormData>,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { ...data }
      if (data.condicoes) {
        updateData.condicoes = JSON.stringify(data.condicoes)
      }
      if (data.acoes) {
        updateData.acoes = JSON.stringify(data.acoes)
      }

      const { error } = await supabase.from('automatizacoes').update(updateData).eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'automatizacao.update', 'automatizacoes', id, {
        automatizacao_id: id,
        alteracoes: data,
      })

      toast.success('Automação atualizada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar automação'
      console.error('Erro ao atualizar automação:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async toggleAutomatizacao(
    id: string,
    ativo: boolean,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('automatizacoes').update({ ativo }).eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'automatizacao.toggle', 'automatizacoes', id, {
        automatizacao_id: id,
        ativo,
      })

      toast.success(`Automação ${ativo ? 'ativada' : 'desativada'} com sucesso!`)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar status da automação'
      console.error('Erro ao alterar status da automação:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

