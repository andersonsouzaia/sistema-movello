import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { LocalizacaoTipo } from '@/types/database'

export interface LocationTemplate {
  id: string
  nome: string
  descricao?: string
  localizacao_tipo: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  is_favorito: boolean
  compartilhado: boolean
  criado_em: string
}

export interface CreateLocationTemplateData {
  nome: string
  descricao?: string
  localizacao_tipo: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  is_favorito?: boolean
  compartilhado?: boolean
}

export const locationTemplateService = {
  /**
   * Criar um novo template de localização
   */
  async createTemplate(data: CreateLocationTemplateData): Promise<string> {
    try {
      const { data: templateId, error } = await supabase.rpc('create_location_template', {
        p_nome: data.nome,
        p_localizacao_tipo: data.localizacao_tipo,
        p_descricao: data.descricao || null,
        p_raio_km: data.raio_km || null,
        p_centro_latitude: data.centro_latitude || null,
        p_centro_longitude: data.centro_longitude || null,
        p_poligono_coordenadas: data.poligono_coordenadas || null,
        p_cidades: data.cidades || null,
        p_estados: data.estados || null,
        p_is_favorito: data.is_favorito || false,
        p_compartilhado: data.compartilhado || false,
      })

      if (error) {
        throw error
      }

      toast.success('Template de localização criado com sucesso!')
      return templateId as string
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar template'
      console.error('Erro ao criar template:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Listar templates de localização
   */
  async listTemplates(includeShared: boolean = true): Promise<LocationTemplate[]> {
    try {
      const { data, error } = await supabase.rpc('list_location_templates', {
        p_include_shared: includeShared,
      })

      if (error) {
        throw error
      }

      return (data || []) as LocationTemplate[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao listar templates'
      console.error('Erro ao listar templates:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Alternar favorito de um template
   */
  async toggleFavorite(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('toggle_template_favorite', {
        p_template_id: templateId,
      })

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar favorito'
      console.error('Erro ao atualizar favorito:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Deletar um template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('location_templates')
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

