import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { midiaService } from '@/services/midiaService'
import { toast } from 'sonner'
import type { Midia } from '@/types/database'

/**
 * Hook para listar mídias de uma campanha
 */
export const useEmpresaMidias = (campanhaId: string | null) => {
  const { empresa } = useAuth()
  const [midias, setMidias] = useState<Midia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMidias = useCallback(async () => {
    if (!campanhaId || !empresa?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await midiaService.getMidias(campanhaId)
      setMidias(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar mídias'
      setError(errorMessage)
      console.error('Erro ao buscar mídias:', err)
      setMidias([])
    } finally {
      setLoading(false)
    }
  }, [campanhaId, empresa?.id])

  useEffect(() => {
    fetchMidias()
  }, [fetchMidias])

  return {
    midias,
    loading,
    error,
    refetch: fetchMidias,
  }
}

/**
 * Hook para upload de mídia
 */
export const useUploadMidia = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadMidia = useCallback(async (
    campanhaId: string,
    file: File,
    tipo: 'imagem' | 'video'
  ) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      // Validar tipo de arquivo
      if (tipo === 'imagem' && !file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem')
      }
      if (tipo === 'video' && !file.type.startsWith('video/')) {
        throw new Error('Arquivo deve ser um vídeo')
      }

      // Validar tamanho (máximo 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 10MB')
      }

      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${campanhaId}/${Date.now()}.${fileExt}`
      const filePath = `campanhas/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('midias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('midias')
        .getPublicUrl(filePath)

      // Criar registro na tabela midias
      const { data: midiaData, error: insertError } = await supabase
        .from('midias')
        .insert({
          campanha_id: campanhaId,
          tipo,
          url: publicUrl,
          status: 'em_analise',
        })
        .select()
        .single()

      if (insertError) {
        // Tentar deletar arquivo do storage em caso de erro
        await supabase.storage.from('midias').remove([filePath])
        throw insertError
      }

      toast.success('Mídia enviada com sucesso!')
      return midiaData as Midia
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload da mídia'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    uploadMidia,
    loading,
    error,
  }
}

/**
 * Hook para deletar mídia
 */
export const useDeleteMidia = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteMidia = useCallback(async (midiaId: string) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      // Buscar mídia para obter URL
      const { data: midia, error: fetchError } = await supabase
        .from('midias')
        .select('url, campanha_id')
        .eq('id', midiaId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Verificar se a campanha pertence à empresa
      const { data: campanha } = await supabase
        .from('campanhas')
        .select('empresa_id')
        .eq('id', midia.campanha_id)
        .single()

      if (campanha?.empresa_id !== empresa.id) {
        throw new Error('Você não tem permissão para deletar esta mídia')
      }

      // Deletar registro
      const { error: deleteError } = await supabase
        .from('midias')
        .delete()
        .eq('id', midiaId)

      if (deleteError) {
        throw deleteError
      }

      // Tentar deletar arquivo do storage (não crítico se falhar)
      try {
        const filePath = midia.url.split('/midias/')[1]
        if (filePath) {
          await supabase.storage.from('midias').remove([filePath])
        }
      } catch (storageError) {
        console.warn('Erro ao deletar arquivo do storage:', storageError)
      }

      toast.success('Mídia deletada com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar mídia'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    deleteMidia,
    loading,
    error,
  }
}

/**
 * Hook para reordenar mídias
 */
export const useReorderMidias = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reorderMidias = useCallback(async (campanhaId: string, midias: Array<{ id: string; ordem: number }>) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      // Verificar se a campanha pertence à empresa
      const { data: campanha } = await supabase
        .from('campanhas')
        .select('empresa_id')
        .eq('id', campanhaId)
        .single()

      if (campanha?.empresa_id !== empresa.id) {
        throw new Error('Você não tem permissão para reordenar mídias desta campanha')
      }

      // Atualizar ordens
      const updates = midias.map((midia) =>
        supabase
          .from('midias')
          .update({ ordem: midia.ordem })
          .eq('id', midia.id)
      )

      await Promise.all(updates)

      toast.success('Mídias reordenadas com sucesso!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reordenar mídias'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  return {
    reorderMidias,
    loading,
    error,
  }
}

