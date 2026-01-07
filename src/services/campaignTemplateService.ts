import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { ObjetivoPrincipal } from '@/types/database'

export interface CampaignTemplate {
  id: string
  nome: string
  descricao?: string
  nicho?: string
  objetivo_principal?: ObjetivoPrincipal
  categoria?: string
  is_sistema: boolean
  compartilhado: boolean
  dados_template: any
  uso_count: number
  rating: number
  criado_em: string
}

export interface CreateCampaignTemplateData {
  nome: string
  descricao?: string
  nicho?: string
  objetivo_principal?: ObjetivoPrincipal
  categoria?: string
  dados_template: any
  compartilhado?: boolean
}

export const campaignTemplateService = {
  /**
   * Criar um novo template de campanha
   */
  async createTemplate(data: CreateCampaignTemplateData): Promise<string> {
    try {
      const { data: templateId, error } = await supabase.rpc('create_campaign_template', {
        p_nome: data.nome,
        p_descricao: data.descricao || null,
        p_nicho: data.nicho || null,
        p_objetivo_principal: data.objetivo_principal || null,
        p_categoria: data.categoria || null,
        p_dados_template: data.dados_template || {},
        p_compartilhado: data.compartilhado || false,
      })

      if (error) {
        throw error
      }

      toast.success('Template de campanha criado com sucesso!')
      return templateId as string
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar template'
      console.error('Erro ao criar template:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Listar templates de campanha
   */
  async listTemplates(
    filtros?: {
      nicho?: string
      objetivo?: ObjetivoPrincipal
      categoria?: string
      includeSistema?: boolean
      includeShared?: boolean
    }
  ): Promise<CampaignTemplate[]> {
    try {
      const { data, error } = await supabase.rpc('list_campaign_templates', {
        p_nicho: filtros?.nicho || null,
        p_objetivo: filtros?.objetivo || null,
        p_categoria: filtros?.categoria || null,
        p_include_sistema: filtros?.includeSistema ?? true,
        p_include_shared: filtros?.includeShared ?? true,
      })

      if (error) {
        throw error
      }

      return (data || []) as CampaignTemplate[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao listar templates'
      console.error('Erro ao listar templates:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Buscar template completo por ID
   */
  async getTemplate(templateId: string): Promise<CampaignTemplate | null> {
    try {
      const { data, error } = await supabase.rpc('get_campaign_template', {
        p_template_id: templateId,
      })

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return null
      }

      return data[0] as CampaignTemplate
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar template'
      console.error('Erro ao buscar template:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Incrementar uso de template
   */
  async incrementUsage(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_template_usage', {
        p_template_id: templateId,
      })

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Erro ao incrementar uso:', error)
      // Não mostrar toast para não incomodar o usuário
      return false
    }
  },

  /**
   * Deletar um template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaign_templates')
        .delete()
        .eq('id', templateId)

      if (error) {
        throw error
      }

      toast.success('Template deletado com sucesso!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar template'
      console.error('Erro ao deletar template:', error)
      toast.error(errorMessage)
      throw error
    }
  },
}


