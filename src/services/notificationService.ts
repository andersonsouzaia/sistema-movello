import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { Notification } from '@/types/database'

export interface CreateNotificationParams {
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  link?: string | null
}

export const notificationService = {
  async createNotification(params: CreateNotificationParams): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: params.userId,
        p_type: params.type,
        p_title: params.title,
        p_message: params.message,
        p_link: params.link || null,
      })

      if (error) {
        throw error
      }

      return data || null
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error)
      return null
    }
  },

  async getNotifications(userId: string, read?: boolean): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (read !== undefined) {
        query = query.eq('read', read)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return (data || []) as Notification[]
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error)
      return []
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        throw error
      }

      return data?.length || 0
    } catch (error: any) {
      console.error('Erro ao contar notificações não lidas:', error)
      return 0
    }
  },

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        throw error
      }

      return true
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error)
      toast.error('Erro ao atualizar notificação')
      return false
    }
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        throw error
      }

      return true
    } catch (error: any) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
      toast.error('Erro ao atualizar notificações')
      return false
    }
  },
}

