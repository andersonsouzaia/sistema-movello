import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import type { Tag, CreateTagFormData } from '@/types/database'

export const tagService = {
  async getTags(tipoRecurso?: 'tickets' | 'campanhas' | 'ambos'): Promise<Tag[]> {
    try {
      let query = supabase.from('tags').select('*').order('nome', { ascending: true })

      if (tipoRecurso) {
        if (tipoRecurso === 'ambos') {
          query = query.in('tipo_recurso', ['tickets', 'campanhas', 'ambos'])
        } else {
          query = query.or(`tipo_recurso.eq.${tipoRecurso},tipo_recurso.eq.ambos`)
        }
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []) as Tag[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar tags'
      console.error('Erro ao buscar tags:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async createTag(data: CreateTagFormData, adminId: string): Promise<{ success: boolean; tagId?: string; error?: string }> {
    try {
      const { data: tag, error } = await supabase.from('tags').insert(data).select().single()

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'tag.create', 'tags', tag.id, {
        tag_id: tag.id,
        nome: data.nome,
      })

      toast.success('Tag criada com sucesso!')
      return { success: true, tagId: tag.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar tag'
      console.error('Erro ao criar tag:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async updateTag(
    id: string,
    data: Partial<CreateTagFormData>,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('tags').update(data).eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'tag.update', 'tags', id, {
        tag_id: id,
        alteracoes: data,
      })

      toast.success('Tag atualizada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar tag'
      console.error('Erro ao atualizar tag:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async deleteTag(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('tags').delete().eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'tag.delete', 'tags', id, {
        tag_id: id,
      })

      toast.success('Tag deletada com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar tag'
      console.error('Erro ao deletar tag:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

