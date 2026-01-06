import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { AuditLog } from '@/types/database'

export interface LogActionParams {
  userId: string
  action: string
  resourceType: string
  resourceId?: string | null
  details?: Record<string, any> | null
  ipAddress?: string | null
  userAgent?: string | null
}

export interface GetAuditLogsParams {
  action?: string
  resourceType?: string
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export const auditService = {
  async logAction(params: LogActionParams): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_action', {
        p_user_id: params.userId,
        p_action: params.action,
        p_resource_type: params.resourceType,
        p_resource_id: params.resourceId || null,
        p_details: params.details ? JSON.stringify(params.details) : null,
        p_ip_address: params.ipAddress || null,
        p_user_agent: params.userAgent || null,
      })

      if (error) {
        throw error
      }

      return data || null
    } catch (error: any) {
      console.error('Erro ao registrar log de auditoria:', error)
      // Não mostrar toast para não poluir a UI
      return null
    }
  },

  async getAuditLogs(params: GetAuditLogsParams = {}): Promise<{ data: AuditLog[]; count: number }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (params.action) {
        query = query.eq('action', params.action)
      }

      if (params.resourceType) {
        query = query.eq('resource_type', params.resourceType)
      }

      if (params.userId) {
        query = query.eq('user_id', params.userId)
      }

      if (params.startDate) {
        query = query.gte('created_at', params.startDate)
      }

      if (params.endDate) {
        query = query.lte('created_at', params.endDate)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        data: (data || []) as AuditLog[],
        count: count || 0,
      }
    } catch (error: any) {
      console.error('Erro ao buscar logs de auditoria:', error)
      toast.error('Erro ao carregar logs de auditoria')
      return { data: [], count: 0 }
    }
  },

  async getUserActions(userId: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return (data || []) as AuditLog[]
    } catch (error: any) {
      console.error('Erro ao buscar ações do usuário:', error)
      return []
    }
  },
}

