import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import type { Midia } from '@/types/database'

export const midiaService = {
  async getMidias(campanhaId: string): Promise<Midia[]> {
    try {
      const { data, error } = await supabase
        .from('midias')
        .select('*')
        .eq('campanha_id', campanhaId)
        .order('ordem', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []) as Midia[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar mídias'
      console.error('Erro ao buscar mídias:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async approveMidia(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('approve_midia', {
        p_midia_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Notificação será criada via trigger no banco ou serviço separado

      // Registrar no audit log
      await logAction(adminId, 'midia.approve', 'midias', id, {
        midia_id: id,
      })

      toast.success('Mídia aprovada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao aprovar mídia'
      console.error('Erro ao aprovar mídia:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async rejectMidia(
    id: string,
    adminId: string,
    motivo: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('reject_midia', {
        p_midia_id: id,
        p_admin_id: adminId,
        p_motivo: motivo,
      })

      if (error) {
        throw error
      }

      // Notificação será criada via trigger no banco ou serviço separado

      // Registrar no audit log
      await logAction(adminId, 'midia.reject', 'midias', id, {
        midia_id: id,
        motivo,
      })

      toast.success('Mídia reprovada')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reprovar mídia'
      console.error('Erro ao reprovar mídia:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async uploadMidia(
    campanhaId: string,
    file: File,
    tipo: 'imagem' | 'video'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${campanhaId}/${Date.now()}.${fileExt}`
      const filePath = `campanhas/${fileName}`

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('campanha_midias')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('campanhas').getPublicUrl(filePath)

      // Criar registro na tabela midias
      const { data: midiaData, error: midiaError } = await supabase
        .from('midias')
        .insert({
          campanha_id: campanhaId,
          tipo,
          url: publicUrl,
          status: 'em_analise',
        })
        .select()
        .single()

      if (midiaError) {
        throw midiaError
      }

      toast.success('Mídia enviada com sucesso! Aguardando aprovação.')
      return { success: true, url: publicUrl }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer upload da mídia'
      console.error('Erro ao fazer upload da mídia:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async deleteMidia(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar mídia para deletar arquivo
      const { data: midia, error: fetchError } = await supabase
        .from('midias')
        .select('url')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Deletar arquivo do storage (extrair path da URL)
      if (midia.url) {
        const urlParts = midia.url.split('/campanhas/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage.from('campanha_midias').remove([filePath])
        }
      }

      // Deletar registro
      const { error } = await supabase.from('midias').delete().eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'midia.delete', 'midias', id, {
        midia_id: id,
      })

      toast.success('Mídia deletada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar mídia'
      console.error('Erro ao deletar mídia:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async reorderMidias(campanhaId: string, ordem: Array<{ id: string; ordem: number }>): Promise<{ success: boolean; error?: string }> {
    try {
      // Atualizar ordem de cada mídia
      const updates = ordem.map((item) =>
        supabase.from('midias').update({ ordem: item.ordem }).eq('id', item.id)
      )

      await Promise.all(updates)

      toast.success('Ordem das mídias atualizada!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao reordenar mídias'
      console.error('Erro ao reordenar mídias:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

