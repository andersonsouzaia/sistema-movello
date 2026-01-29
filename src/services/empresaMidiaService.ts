import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { midiaService } from './midiaService'
import type { Midia } from '@/types/database'

export const empresaMidiaService = {
  /**
   * Listar mídias de uma campanha
   */
  async getMidias(campanhaId: string): Promise<Midia[]> {
    try {
      return await midiaService.getMidias(campanhaId)
    } catch (error) {
      console.error('Erro ao buscar mídias:', error)
      return []
    }
  },

  /**
   * Upload de mídia para uma campanha
   */
  async uploadMidia(
    campanhaId: string,
    file: File,
    tipo: 'imagem' | 'video',
    categoria?: string
  ): Promise<Midia> {
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

      // Usar midiaService unificado que já cuida do bucket 'midias' e categorias
      const result = await midiaService.uploadMidia(campanhaId, file, tipo, categoria)

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Erro ao fazer upload')
      }

      // Buscar o registro recém criado para retornar o objeto Midia completo
      const { data: midiaData, error: fetchError } = await supabase
        .from('midias')
        .select('*')
        .eq('url', result.url)
        .single()

      if (fetchError) throw fetchError

      return midiaData as Midia
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da mídia'
      console.error('Erro ao fazer upload da mídia:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Deletar mídia
   */
  async deleteMidia(midiaId: string): Promise<boolean> {
    try {
      // Buscar mídia para obter URL
      const { data: midia, error: fetchError } = await supabase
        .from('midias')
        .select('url')
        .eq('id', midiaId)
        .single()

      if (fetchError) {
        throw fetchError
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar mídia'
      console.error('Erro ao deletar mídia:', error)
      toast.error(errorMessage)
      throw error
    }
  },

  /**
   * Reordenar mídias
   */
  async reorderMidias(
    campanhaId: string,
    midias: Array<{ id: string; ordem: number }>
  ): Promise<boolean> {
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reordenar mídias'
      console.error('Erro ao reordenar mídias:', error)
      toast.error(errorMessage)
      throw error
    }
  },
}


