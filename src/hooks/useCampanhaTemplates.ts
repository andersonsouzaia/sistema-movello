import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { CampanhaTemplate } from '@/types/database'

export interface CreateTemplateData {
  nome: string
  descricao?: string
  nicho?: string
  categorias?: string[]
  publico_alvo?: any
  horarios_exibicao?: any
  dias_semana?: number[]
  objetivo_principal?: string
  objetivos_secundarios?: string[]
  estrategia?: string
  localizacao_tipo?: string
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  regioes?: string[]
}

export interface UpdateTemplateData extends Partial<CreateTemplateData> {}

/**
 * Hook para listar templates de campanha
 */
export function useCampanhaTemplates() {
  const { empresa } = useAuth()
  const [templates, setTemplates] = useState<CampanhaTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query = supabase
        .from('campanha_templates')
        .select('*')
        .order('criado_em', { ascending: false })

      // Se empresa autenticada, buscar templates próprios e públicos (empresa_id IS NULL)
      if (empresa?.id) {
        query.or(`empresa_id.eq.${empresa.id},empresa_id.is.null`)
      } else {
        // Apenas templates públicos
        query.is('empresa_id', null)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setTemplates(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar templates'
      setError(errorMessage)
      console.error('Erro ao buscar templates:', err)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  }
}

/**
 * Hook para criar template
 */
export function useCreateTemplate() {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTemplate = useCallback(async (data: CreateTemplateData) => {
    setLoading(true)
    setError(null)

    try {
      const { data: template, error: insertError } = await supabase
        .from('campanha_templates')
        .insert({
          empresa_id: empresa?.id || null,
          ...data,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      toast.success('Template criado com sucesso!')
      return template
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar template'
      setError(errorMessage)
      console.error('Erro ao criar template:', err)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    createTemplate,
    loading,
    error,
  }
}

/**
 * Hook para criar campanha a partir de template
 */
export function useCampanhaFromTemplate() {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCampanhaFromTemplate = useCallback(async (templateId: string, dadosAdicionais?: any) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      // Buscar template
      const { data: template, error: templateError } = await supabase
        .from('campanha_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError || !template) {
        throw new Error('Template não encontrado')
      }

      // Criar campanha usando dados do template + dados adicionais
      const { data: campanha, error: campanhaError } = await supabase
        .from('campanhas')
        .insert({
          empresa_id: empresa.id,
          titulo: dadosAdicionais?.titulo || `Campanha de ${template.nome}`,
          descricao: dadosAdicionais?.descricao || template.descricao || '',
          orcamento: dadosAdicionais?.orcamento || 1000,
          data_inicio: dadosAdicionais?.data_inicio || new Date().toISOString().split('T')[0],
          data_fim: dadosAdicionais?.data_fim || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'em_analise',
          // Campos do template
          nicho: template.nicho,
          categorias: template.categorias,
          publico_alvo: template.publico_alvo,
          horarios_exibicao: template.horarios_exibicao,
          dias_semana: template.dias_semana,
          objetivo_principal: template.objetivo_principal as any,
          objetivos_secundarios: template.objetivos_secundarios,
          estrategia: template.estrategia as any,
          localizacao_tipo: template.localizacao_tipo as any,
          raio_km: template.raio_km,
          centro_latitude: template.centro_latitude,
          centro_longitude: template.centro_longitude,
          poligono_coordenadas: template.poligono_coordenadas,
          cidades: template.cidades,
          estados: template.estados,
          regioes: template.regioes,
        })
        .select('id')
        .single()

      if (campanhaError) {
        throw campanhaError
      }

      toast.success('Campanha criada a partir do template!')
      return campanha.id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar campanha do template'
      setError(errorMessage)
      console.error('Erro ao criar campanha do template:', err)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    createCampanhaFromTemplate,
    loading,
    error,
  }
}


