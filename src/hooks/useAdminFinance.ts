import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export interface AdjustBalanceData {
    empresaId: string
    valor: number
    descricao: string
}

export const useAdminFinance = () => {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { mutateAsync: adjustBalance, isPending: loading } = useMutation({
        mutationFn: async ({ empresaId, valor, descricao }: AdjustBalanceData) => {
            if (!user?.id) throw new Error('Usuário não autenticado')

            const { data, error } = await supabase.rpc('admin_adjust_balance', {
                p_empresa_id: empresaId,
                p_valor: valor,
                p_descricao: descricao,
                p_admin_id: user.id
            })

            if (error) throw error
            return data
        },
        onSuccess: (_, variables) => {
            toast.success('Saldo ajustado com sucesso!')
            // Invalidate relevant queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ['empresa-stats', variables.empresaId] })
            queryClient.invalidateQueries({ queryKey: ['pagamentos'] }) // If transactions are listed here
            queryClient.invalidateQueries({ queryKey: ['transacoes'] })
        },
        onError: (error) => {
            const message = error instanceof Error ? error.message : 'Erro ao ajustar saldo'
            toast.error(message)
        }
    })

    return {
        adjustBalance,
        loading
    }
}
