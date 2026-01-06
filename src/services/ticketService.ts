import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import { notificationService } from '@/services/notificationService'
import type { Ticket, TicketWithDetails, TicketComentario, CreateTicketFormData, UpdateTicketFormData } from '@/types/database'

export interface GetTicketsFilters {
  status?: string
  prioridade?: string
  atribuido_a?: string
  empresa_id?: string
  motorista_id?: string
  tag_id?: string
  search?: string
}

export const ticketService = {
  async getTickets(filters: GetTicketsFilters = {}): Promise<TicketWithDetails[]> {
    try {
      // Buscar tickets primeiro
      let query = supabase
        .from('tickets')
        .select(
          '*, atribuido:atribuido_a(id, nome), tags:ticket_tags(tag:tags(*))'
        )
        .order('criado_em', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.prioridade) {
        query = query.eq('prioridade', filters.prioridade)
      }

      if (filters.atribuido_a) {
        query = query.eq('atribuido_a', filters.atribuido_a)
      }

      if (filters.empresa_id) {
        query = query.eq('empresa_id', filters.empresa_id)
      }

      if (filters.motorista_id) {
        query = query.eq('motorista_id', filters.motorista_id)
      }

      if (filters.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        return []
      }

      // Buscar empresas e motoristas separadamente
      const empresaIds = [...new Set(data.map((t: any) => t.empresa_id).filter(Boolean))]
      const motoristaIds = [...new Set(data.map((t: any) => t.motorista_id).filter(Boolean))]

      const [empresasResult, motoristasResult] = await Promise.all([
        empresaIds.length > 0
          ? supabase.from('empresas').select('id, razao_social, nome_fantasia').in('id', empresaIds)
          : Promise.resolve({ data: [], error: null }),
        motoristaIds.length > 0
          ? supabase.from('motoristas').select('id, user_nome').in('id', motoristaIds)
          : Promise.resolve({ data: [], error: null }),
      ])

      const empresasMap = new Map((empresasResult.data || []).map((e: any) => [e.id, e]))
      const motoristasMap = new Map((motoristasResult.data || []).map((m: any) => [m.id, m]))

      // Processar tags e adicionar empresas/motoristas
      return (data || []).map((item: any) => ({
        ...item,
        empresa: item.empresa_id ? empresasMap.get(item.empresa_id) : undefined,
        motorista: item.motorista_id ? motoristasMap.get(item.motorista_id) : undefined,
        atribuido: item.atribuido || undefined,
        tags: (item.tags || []).map((tt: any) => tt.tag).filter(Boolean),
      })) as TicketWithDetails[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar tickets'
      console.error('Erro ao buscar tickets:', error)
      toast.error(errorMessage)
      return []
    }
  },

  async getTicket(id: string): Promise<TicketWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          '*, atribuido:atribuido_a(id, nome), criado_por_user:criado_por(id, nome), resolvido_por_user:resolvido_por(id, nome), tags:ticket_tags(tag:tags(*))'
        )
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        return null
      }

      // Buscar empresa e motorista separadamente se existirem
      const [empresaResult, motoristaResult] = await Promise.all([
        data.empresa_id
          ? supabase.from('empresas').select('id, razao_social, nome_fantasia').eq('id', data.empresa_id).single()
          : Promise.resolve({ data: null, error: null }),
        data.motorista_id
          ? supabase.from('motoristas').select('id, user_nome').eq('id', data.motorista_id).single()
          : Promise.resolve({ data: null, error: null }),
      ])

      return {
        ...data,
        empresa: empresaResult.data || undefined,
        motorista: motoristaResult.data || undefined,
        atribuido: data.atribuido || undefined,
        criado_por_user: data.criado_por_user || undefined,
        resolvido_por_user: data.resolvido_por_user || undefined,
        tags: (data.tags || []).map((tt: any) => tt.tag).filter(Boolean),
      } as TicketWithDetails
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar ticket'
      console.error('Erro ao buscar ticket:', error)
      toast.error(errorMessage)
      return null
    }
  },

  async createTicket(data: CreateTicketFormData, userId: string): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({
          ...data,
          criado_por: userId,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Notificar admins
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role_id', (await supabase.from('roles').select('id').in('slug', ['admin', 'super_admin', 'suporte'])).data?.map((r: any) => r.id) || [])

      if (admins) {
        for (const admin of admins) {
          await notificationService.createNotification({
            userId: admin.user_id,
            type: 'info',
            title: 'Novo Ticket Criado',
            message: `Novo ticket: ${data.titulo}`,
            link: `/admin/suporte/${ticket.id}`,
          })
        }
      }

      // Registrar no audit log
      await logAction(userId, 'ticket.create', 'tickets', ticket.id, {
        ticket_id: ticket.id,
        titulo: data.titulo,
      })

      toast.success('Ticket criado com sucesso!')
      return { success: true, ticketId: ticket.id }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar ticket'
      console.error('Erro ao criar ticket:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async updateTicket(
    id: string,
    data: UpdateTicketFormData,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('tickets').update(data).eq('id', id)

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'ticket.update', 'tickets', id, {
        ticket_id: id,
        alteracoes: data,
      })

      toast.success('Ticket atualizado com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar ticket'
      console.error('Erro ao atualizar ticket:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async assignTicket(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('assign_ticket', {
        p_ticket_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Buscar ticket para notificar
      const ticket = await this.getTicket(id)
      if (ticket && ticket.criado_por) {
        await notificationService.createNotification({
          userId: ticket.criado_por,
          type: 'info',
          title: 'Ticket Atribuído',
          message: `Seu ticket "${ticket.titulo}" foi atribuído a um atendente`,
          link: `/admin/suporte/${id}`,
        })
      }

      // Registrar no audit log
      await logAction(adminId, 'ticket.assign', 'tickets', id, {
        ticket_id: id,
      })

      toast.success('Ticket atribuído com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atribuir ticket'
      console.error('Erro ao atribuir ticket:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async resolveTicket(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('resolve_ticket', {
        p_ticket_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Buscar ticket para notificar
      const ticket = await this.getTicket(id)
      if (ticket && ticket.criado_por) {
        await notificationService.createNotification({
          userId: ticket.criado_por,
          type: 'success',
          title: 'Ticket Resolvido',
          message: `Seu ticket "${ticket.titulo}" foi resolvido`,
          link: `/admin/suporte/${id}`,
        })
      }

      // Registrar no audit log
      await logAction(adminId, 'ticket.resolve', 'tickets', id, {
        ticket_id: id,
      })

      toast.success('Ticket resolvido com sucesso!')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao resolver ticket'
      console.error('Erro ao resolver ticket:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async closeTicket(id: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('close_ticket', {
        p_ticket_id: id,
        p_admin_id: adminId,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'ticket.close', 'tickets', id, {
        ticket_id: id,
      })

      toast.success('Ticket fechado')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fechar ticket'
      console.error('Erro ao fechar ticket:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async addComment(
    ticketId: string,
    comment: string,
    userId: string,
    anexos: Array<{ url: string; nome: string }> = [],
    interno: boolean = false
  ): Promise<{ success: boolean; commentId?: string; error?: string }> {
    try {
      const { data: commentData, error } = await supabase.rpc('add_ticket_comment', {
        p_ticket_id: ticketId,
        p_user_id: userId,
        p_comentario: comment,
        p_anexos: JSON.stringify(anexos),
        p_interno: interno,
      })

      if (error) {
        throw error
      }

      // Buscar ticket para notificar
      const ticket = await this.getTicket(ticketId)
      if (ticket && !interno) {
        // Notificar criador do ticket se não for comentário interno
        if (ticket.criado_por !== userId) {
          await notificationService.createNotification({
            userId: ticket.criado_por,
            type: 'info',
            title: 'Novo Comentário no Ticket',
            message: `Novo comentário no ticket "${ticket.titulo}"`,
            link: `/admin/suporte/${ticketId}`,
          })
        }
      }

      toast.success('Comentário adicionado!')
      return { success: true, commentId: commentData }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar comentário'
      console.error('Erro ao adicionar comentário:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async getComments(ticketId: string): Promise<TicketComentario[]> {
    try {
      const { data, error } = await supabase
        .from('ticket_comentarios')
        .select('*, user:user_id(id, nome)')
        .eq('ticket_id', ticketId)
        .order('criado_em', { ascending: true })

      if (error) {
        throw error
      }

      return (data || []).map((item: any) => ({
        ...item,
        anexos: typeof item.anexos === 'string' ? JSON.parse(item.anexos) : item.anexos || [],
      })) as TicketComentario[]
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar comentários'
      console.error('Erro ao buscar comentários:', error)
      return []
    }
  },

  async addTag(ticketId: string, tagId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('ticket_tags').insert({
        ticket_id: ticketId,
        tag_id: tagId,
      })

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar tag'
      console.error('Erro ao adicionar tag:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async removeTag(ticketId: string, tagId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ticket_tags')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('tag_id', tagId)

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover tag'
      console.error('Erro ao remover tag:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

