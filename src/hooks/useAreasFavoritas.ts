import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { AreaFavorita, LocalizacaoTipo } from '@/types/database'

export interface CreateAreaFavoritaData {
  nome: string
  localizacao_tipo: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  regioes?: string[]
}

export interface UpdateAreaFavoritaData extends Partial<CreateAreaFavoritaData> {}

/**
 * Hook para listar áreas favoritas
 */
export function useAreasFavoritas() {
  const { empresa } = useAuth()
  const [areas, setAreas] = useState<AreaFavorita[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAreas = useCallback(async () => {
    if (!empresa?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('areas_favoritas')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('criado_em', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setAreas(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar áreas favoritas'
      setError(errorMessage)
      console.error('Erro ao buscar áreas favoritas:', err)
      setAreas([])
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  return {
    areas,
    loading,
    error,
    refetch: fetchAreas,
  }
}

/**
 * Hook para criar área favorita
 */
export function useCreateAreaFavorita() {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAreaFavorita = useCallback(async (data: CreateAreaFavoritaData) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      const { data: area, error: insertError } = await supabase
        .from('areas_favoritas')
        .insert({
          empresa_id: empresa.id,
          ...data,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      toast.success('Área favorita criada com sucesso!')
      return area
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar área favorita'
      setError(errorMessage)
      console.error('Erro ao criar área favorita:', err)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    createAreaFavorita,
    loading,
    error,
  }
}

/**
 * Hook para deletar área favorita
 */
export function useDeleteAreaFavorita() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAreaFavorita = useCallback(async (areaId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('areas_favoritas')
        .delete()
        .eq('id', areaId)

      if (deleteError) {
        throw deleteError
      }

      toast.success('Área favorita deletada com sucesso!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar área favorita'
      setError(errorMessage)
      console.error('Erro ao deletar área favorita:', err)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    deleteAreaFavorita,
    loading,
    error,
  }
}


