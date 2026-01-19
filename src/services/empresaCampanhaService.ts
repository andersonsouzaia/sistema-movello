import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { CampanhaWithEmpresa, UpdateCampanhaFormData } from '@/types/database'

export interface CreateCampanhaData {
  titulo: string
  descricao?: string
  orcamento?: number
  data_inicio?: string
  data_fim?: string
  // Campos de geolocalização
  localizacao_tipo?: 'raio' | 'poligono' | 'cidade' | 'estado' | 'regiao' | null
  raio_km?: number | null
  centro_latitude?: number | null
  centro_longitude?: number | null
  poligono_coordenadas?: Array<[number, number]> | null
  cidades?: string[] | null
  estados?: string[] | null
  regioes?: string[] | null
  // Campos de nicho
  nicho?: string | null
  categorias?: string[] | null
  // Campos de público-alvo
  publico_alvo?: {
    idade_min?: number
    idade_max?: number
    genero?: string[]
    interesses?: string[]
  } | null
  horarios_exibicao?: Record<string, { inicio: string; fim: string }> | null
  dias_semana?: number[] | null
  // Campos de objetivos
  objetivo_principal?: 'awareness' | 'consideracao' | 'conversao' | 'retencao' | 'engajamento' | null
  objetivos_secundarios?: string[] | null
  kpis_meta?: {
    visualizacoes?: number
    cliques?: number
    conversoes?: number
    ctr?: number
    cpc?: number
    roi?: number
  } | null
  estrategia?: 'cpc' | 'cpm' | 'cpa' | 'cpl' | null
  // Novos campos de mídia
  midias_urls?: string[] | null
  qr_code_link?: string | null
}

export interface UpdateCampanhaData {
  titulo: string
  descricao: string
  orcamento: number
  data_inicio: string
  data_fim: string
  // Novos campos opcionais
  midias_urls?: string[] | null
  qr_code_link?: string | null
}

export const empresaCampanhaService = {
  /**
   * Criar uma nova campanha
   */
  async createCampanha(data: CreateCampanhaData): Promise<string> {
    try {
      const { data: campanhaId, error } = await supabase.rpc('create_campanha_empresa', {
        p_titulo: data.titulo,
        p_descricao: data.descricao,
        p_orcamento: data.orcamento,
        p_data_inicio: data.data_inicio,
        p_data_fim: data.data_fim,
        // Segmentação: Nicho
        p_nicho: data.nicho,
        p_categorias: data.categorias,
        // Segmentação: Localização
        p_localizacao_tipo: data.localizacao_tipo,
        p_raio_km: data.raio_km,
        p_centro_latitude: data.centro_latitude,
        p_centro_longitude: data.centro_longitude,
        p_poligono_coordenadas: data.poligono_coordenadas,
        p_cidades: data.cidades,
        p_estados: data.estados,
        p_regioes: data.regioes,
        // Segmentação: Público Alvo
        p_publico_alvo: data.publico_alvo,
        p_horarios_exibicao: data.horarios_exibicao,
        p_dias_semana: data.dias_semana,
        // Objetivos
        p_objetivo_principal: data.objetivo_principal,
        p_objetivos_secundarios: data.objetivos_secundarios,
        p_kpis_meta: data.kpis_meta,
        p_estrategia: data.estrategia,
        // Mídias
        p_midias_urls: data.midias_urls,
        p_qr_code_link: data.qr_code_link,
      })

      if (error) {
        throw error
      }

      toast.success('Campanha criada com sucesso!')
      return campanhaId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar campanha'
      console.error('Erro ao criar campanha:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Atualizar uma campanha existente
   */
  async updateCampanha(campanhaId: string, data: UpdateCampanhaData): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_campanha_empresa', {
        p_campanha_id: campanhaId,
        p_titulo: data.titulo,
        p_descricao: data.descricao,
        p_orcamento: data.orcamento,
        p_data_inicio: data.data_inicio,
        p_data_fim: data.data_fim,
        p_midias_urls: data.midias_urls,
        p_qr_code_link: data.qr_code_link,
      })

      if (error) {
        throw error
      }

      toast.success('Campanha atualizada com sucesso!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar campanha'
      console.error('Erro ao atualizar campanha:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Pausar uma campanha
   */
  async pauseCampanha(campanhaId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('toggle_campanha_empresa', {
        p_campanha_id: campanhaId,
        p_action: 'pause',
      })

      if (error) {
        throw error
      }

      toast.success('Campanha pausada com sucesso!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao pausar campanha'
      console.error('Erro ao pausar campanha:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Ativar uma campanha
   */
  async activateCampanha(campanhaId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('toggle_campanha_empresa', {
        p_campanha_id: campanhaId,
        p_action: 'activate',
      })

      if (error) {
        throw error
      }

      toast.success('Campanha ativada com sucesso!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao ativar campanha'
      console.error('Erro ao ativar campanha:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Deletar uma campanha (apenas rascunho, em_analise ou reprovada)
   */
  async deleteCampanha(campanhaId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('delete_campanha_empresa', {
        p_campanha_id: campanhaId,
      })

      if (error) {
        throw error
      }

      toast.success('Campanha excluída com sucesso!')
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir campanha'
      console.error('Erro ao excluir campanha:', error)
      toast.error(errorMessage)
      throw error
    }
  },
}

