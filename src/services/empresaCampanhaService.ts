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
}

export interface UpdateCampanhaData {
  titulo: string
  descricao: string
  orcamento: number
  data_inicio: string
  data_fim: string
}

export const empresaCampanhaService = {
  /**
   * Criar uma nova campanha
   */
  async createCampanha(data: CreateCampanhaData): Promise<string> {
    try {
      // Usar INSERT direto para suportar todos os novos campos
      const { data: campanha, error } = await supabase
        .from('campanhas')
        .insert({
          titulo: data.titulo,
          descricao: data.descricao,
          orcamento: data.orcamento,
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
          status: 'em_analise',
          // Campos de geolocalização
          localizacao_tipo: data.localizacao_tipo,
          raio_km: data.raio_km,
          centro_latitude: data.centro_latitude,
          centro_longitude: data.centro_longitude,
          poligono_coordenadas: data.poligono_coordenadas,
          cidades: data.cidades,
          estados: data.estados,
          regioes: data.regioes,
          // Campos de nicho
          nicho: data.nicho,
          categorias: data.categorias,
          // Campos de público-alvo
          publico_alvo: data.publico_alvo,
          horarios_exibicao: data.horarios_exibicao,
          dias_semana: data.dias_semana,
          // Campos de objetivos
          objetivo_principal: data.objetivo_principal,
          objetivos_secundarios: data.objetivos_secundarios,
          kpis_meta: data.kpis_meta,
          estrategia: data.estrategia,
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      toast.success('Campanha criada com sucesso!')
      return campanha.id
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
}

