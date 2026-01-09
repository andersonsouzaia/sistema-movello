import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { logAction } from '@/utils/auditLogger'
import { notificationService } from '@/services/notificationService'

export interface ApproveEmpresaParams {
  userId: string
  adminId: string
}

export interface BlockEmpresaParams {
  userId: string
  adminId: string
  motivo?: string
}

export interface ApproveMotoristaParams {
  userId: string
  adminId: string
}

export interface BlockMotoristaParams {
  userId: string
  adminId: string
  motivo?: string
}

export const adminService = {
  async approveEmpresa({ userId, adminId }: ApproveEmpresaParams) {
    try {
      console.log('🔵 [approveEmpresa] Chamando RPC com:', { userId, adminId })
      
      // PostgREST ordena parâmetros alfabeticamente ao procurar funções
      // A função SQL foi criada como: approve_empresa(p_admin_id UUID, p_user_id UUID)
      // para corresponder à ordem alfabética que o PostgREST espera
      const { data, error } = await supabase.rpc('approve_empresa', {
        p_admin_id: adminId,
        p_user_id: userId,
      })

      if (error) {
        console.error('❌ [approveEmpresa] Erro do RPC:', error)
        throw new Error(error.message || `Erro ao aprovar empresa: ${JSON.stringify(error)}`)
      }

      console.log('✅ [approveEmpresa] RPC executado com sucesso:', data)

      // Registrar no audit log (não bloquear se falhar)
      try {
        await logAction(adminId, 'empresa.approve', 'empresas', userId, {
          empresa_id: userId,
        })
      } catch (logError) {
        console.warn('⚠️ [approveEmpresa] Erro ao registrar log:', logError)
      }

      // Criar notificação para o admin (não bloquear se falhar)
      try {
        await notificationService.createNotification({
          userId: adminId,
          type: 'success',
          title: 'Empresa Aprovada',
          message: `Empresa foi aprovada com sucesso`,
          link: `/admin/empresas/${userId}`,
        })
      } catch (notifError) {
        console.warn('⚠️ [approveEmpresa] Erro ao criar notificação para admin:', notifError)
      }

      // Criar notificação para a empresa aprovada
      try {
        await notificationService.createNotification({
          userId: userId,
          type: 'success',
          title: 'Conta Aprovada!',
          message: `Sua conta foi aprovada. Você já pode acessar todas as funcionalidades.`,
          link: `/empresa/dashboard`,
        })
      } catch (notifError) {
        console.warn('⚠️ [approveEmpresa] Erro ao criar notificação para empresa:', notifError)
      }

      toast.success('Empresa aprovada com sucesso!')
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : `Erro ao aprovar empresa: ${JSON.stringify(error)}`
      console.error('❌ [approveEmpresa] Erro capturado:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async blockEmpresa({ userId, adminId, motivo }: BlockEmpresaParams) {
    try {
      const { data, error } = await supabase.rpc('block_empresa', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_motivo: motivo || null,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'empresa.block', 'empresas', userId, {
        empresa_id: userId,
        motivo,
      })

      toast.success('Empresa bloqueada com sucesso!')
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao bloquear empresa'
      console.error('Erro ao bloquear empresa:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async suspendEmpresa({ userId, adminId, motivo }: BlockEmpresaParams) {
    try {
      const { data, error } = await supabase.rpc('suspend_empresa', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_motivo: motivo || null,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'empresa.suspend', 'empresas', userId, {
        empresa_id: userId,
        motivo,
      })

      toast.success('Empresa suspensa com sucesso!')
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao suspender empresa'
      console.error('Erro ao suspender empresa:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async approveMotorista({ userId, adminId }: ApproveMotoristaParams) {
    try {
      const { data, error } = await supabase.rpc('approve_motorista', {
        p_admin_id: adminId,
        p_user_id: userId,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'motorista.approve', 'motoristas', userId, {
        motorista_id: userId,
      })

      // Criar notificação para o admin (não bloquear se falhar)
      try {
        await notificationService.createNotification({
          userId: adminId,
          type: 'success',
          title: 'Motorista Aprovado',
          message: `Motorista foi aprovado com sucesso`,
          link: `/admin/motoristas/${userId}`,
        })
      } catch (notifError) {
        console.warn('⚠️ [approveMotorista] Erro ao criar notificação para admin:', notifError)
      }

      // Criar notificação para o motorista aprovado
      try {
        await notificationService.createNotification({
          userId: userId,
          type: 'success',
          title: 'Conta Aprovada!',
          message: `Sua conta foi aprovada. Você já pode acessar todas as funcionalidades.`,
          link: `/motorista/dashboard`,
        })
      } catch (notifError) {
        console.warn('⚠️ [approveMotorista] Erro ao criar notificação para motorista:', notifError)
      }

      toast.success('Motorista aprovado com sucesso!')
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao aprovar motorista'
      console.error('Erro ao aprovar motorista:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async blockMotorista({ userId, adminId, motivo }: BlockMotoristaParams) {
    try {
      const { data, error } = await supabase.rpc('block_motorista', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_motivo: motivo || null,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'motorista.block', 'motoristas', userId, {
        motorista_id: userId,
        motivo,
      })

      toast.success('Motorista bloqueado com sucesso!')
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao bloquear motorista'
      console.error('Erro ao bloquear motorista:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },

  async suspendMotorista({ userId, adminId, motivo }: BlockMotoristaParams) {
    try {
      const { data, error } = await supabase.rpc('suspend_motorista', {
        p_admin_id: adminId,
        p_user_id: userId,
        p_motivo: motivo || null,
      })

      if (error) {
        throw error
      }

      // Registrar no audit log
      await logAction(adminId, 'motorista.suspend', 'motoristas', userId, {
        motorista_id: userId,
        motivo,
      })

      toast.success('Motorista suspenso com sucesso!')
      return { success: true, data }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao suspender motorista'
      console.error('Erro ao suspender motorista:', error)
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  },
}

