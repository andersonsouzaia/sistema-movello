import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Campanha } from '@/types/database'
import type { CreateCampanhaData } from './empresaCampanhaService'

export interface AtivarRascunhoResult {
  sucesso: boolean
  saldo_disponivel?: number
  orcamento_necessario?: number
  mensagem: string
}

export const empresaRascunhoService = {
  /**
   * Salvar ou atualizar um rascunho de campanha
   */
  async salvarRascunho(
    campanhaId: string | null,
    dados: CreateCampanhaData
  ): Promise<string> {
    try {
      // Preparar dados para JSONB (remover campos null/undefined para não enviar ao banco)
      const dadosJsonb: Record<string, any> = {
        titulo: dados.titulo,
        descricao: dados.descricao || '',
        orcamento: dados.orcamento || 0,
        data_inicio: dados.data_inicio,
        data_fim: dados.data_fim,
      }

      // Adicionar apenas campos que foram preenchidos (não null/undefined)
      if (dados.localizacao_tipo !== null && dados.localizacao_tipo !== undefined) {
        dadosJsonb.localizacao_tipo = dados.localizacao_tipo
        if (dados.raio_km !== null && dados.raio_km !== undefined) dadosJsonb.raio_km = dados.raio_km
        if (dados.centro_latitude !== null && dados.centro_latitude !== undefined) dadosJsonb.centro_latitude = dados.centro_latitude
        if (dados.centro_longitude !== null && dados.centro_longitude !== undefined) dadosJsonb.centro_longitude = dados.centro_longitude
        if (dados.poligono_coordenadas !== null && dados.poligono_coordenadas !== undefined) dadosJsonb.poligono_coordenadas = dados.poligono_coordenadas
        if (dados.cidades !== null && dados.cidades !== undefined) dadosJsonb.cidades = dados.cidades
        if (dados.estados !== null && dados.estados !== undefined) dadosJsonb.estados = dados.estados
        if (dados.regioes !== null && dados.regioes !== undefined) dadosJsonb.regioes = dados.regioes
      }

      if (dados.nicho !== null && dados.nicho !== undefined) {
        dadosJsonb.nicho = dados.nicho
        if (dados.categorias !== null && dados.categorias !== undefined) dadosJsonb.categorias = dados.categorias
      }

      if (dados.publico_alvo !== null && dados.publico_alvo !== undefined) dadosJsonb.publico_alvo = dados.publico_alvo
      if (dados.horarios_exibicao !== null && dados.horarios_exibicao !== undefined) dadosJsonb.horarios_exibicao = dados.horarios_exibicao
      if (dados.dias_semana !== null && dados.dias_semana !== undefined) dadosJsonb.dias_semana = dados.dias_semana

      if (dados.objetivo_principal !== null && dados.objetivo_principal !== undefined) {
        dadosJsonb.objetivo_principal = dados.objetivo_principal
        if (dados.objetivos_secundarios !== null && dados.objetivos_secundarios !== undefined) dadosJsonb.objetivos_secundarios = dados.objetivos_secundarios
        if (dados.kpis_meta !== null && dados.kpis_meta !== undefined) dadosJsonb.kpis_meta = dados.kpis_meta
        if (dados.estrategia !== null && dados.estrategia !== undefined) dadosJsonb.estrategia = dados.estrategia
      }

      const { data, error } = await supabase.rpc('salvar_rascunho_campanha', {
        p_dados: dadosJsonb,
        p_campanha_id: campanhaId || null,
      })

      if (error) {
        // Log detalhado apenas em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro detalhado ao salvar rascunho:', {
            error,
            dadosJsonb,
            campanhaId,
          })
        }
        
        // Mensagem de erro mais amigável
        let errorMessage = 'Erro ao salvar rascunho'
        if (error.code === '42703') {
          errorMessage = 'Erro: Coluna não encontrada na tabela. Verifique se a migração do banco de dados foi executada corretamente.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        const enhancedError = new Error(errorMessage)
        ;(enhancedError as any).originalError = error
        throw enhancedError
      }

      if (campanhaId) {
        toast.success('Rascunho atualizado com sucesso!')
      } else {
        toast.success('Rascunho salvo com sucesso!')
      }

      return data as string
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao salvar rascunho'
      console.error('Erro ao salvar rascunho:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Ativar um rascunho de campanha
   */
  async ativarRascunho(campanhaId: string): Promise<AtivarRascunhoResult> {
    try {
      const { data, error } = await supabase.rpc('ativar_rascunho_campanha', {
        p_campanha_id: campanhaId,
      })

      if (error) {
        throw error
      }

      const resultado = data as AtivarRascunhoResult

      if (resultado.sucesso) {
        toast.success(resultado.mensagem)
      } else {
        toast.error(resultado.mensagem)
      }

      return resultado
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao ativar rascunho'
      console.error('Erro ao ativar rascunho:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Listar todos os rascunhos da empresa
   */
  async listarRascunhos(): Promise<Campanha[]> {
    try {
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('is_rascunho', true)
        .order('rascunho_salvo_em', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []) as Campanha[]
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao listar rascunhos'
      console.error('Erro ao listar rascunhos:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Deletar um rascunho
   */
  async deletarRascunho(campanhaId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', campanhaId)
        .eq('is_rascunho', true)

      if (error) {
        throw error
      }

      toast.success('Rascunho deletado com sucesso!')
      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao deletar rascunho'
      console.error('Erro ao deletar rascunho:', error)
      toast.error(errorMessage)
      throw error
    }
  },
}

