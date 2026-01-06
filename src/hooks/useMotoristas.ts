import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Motorista, MotoristaStatus } from '@/types/database'
import { toast } from 'sonner'

interface MotoristaWithUser extends Motorista {
  user_email: string
  user_nome: string
}

interface UseMotoristasOptions {
  status?: MotoristaStatus
}

export const useMotoristas = (options: UseMotoristasOptions = {}) => {
  const [motoristas, setMotoristas] = useState<MotoristaWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMotoristas = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('motoristas')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtro de status
      if (options.status) {
        query = query.eq('status', options.status)
      }

      const { data, error: queryError } = await query

      if (queryError) {
        throw queryError
      }

      // Buscar dados dos usuários separadamente
      const userIds = (data || []).map((m: Motorista) => m.id)
      const motoristasWithUser: MotoristaWithUser[] = []

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, nome')
          .in('id', userIds)

        const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))

        motoristasWithUser.push(...(data || []).map((motorista: Motorista) => ({
          ...motorista,
          user_email: usersMap.get(motorista.id)?.email || '',
          user_nome: usersMap.get(motorista.id)?.nome || '',
        })))
      }

      setMotoristas(motoristasWithUser)
    } catch (err: any) {
      console.error('Erro ao buscar motoristas:', err)
      setError(err.message || 'Erro ao buscar motoristas')
      toast.error('Erro ao carregar motoristas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMotoristas()
  }, [options.status])

  return {
    motoristas,
    loading,
    error,
    refetch: fetchMotoristas,
  }
}

export const useMotorista = (id: string) => {
  const [motorista, setMotorista] = useState<MotoristaWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMotorista = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: queryError } = await supabase
          .from('motoristas')
          .select('*')
          .eq('id', id)
          .single()

        if (queryError) {
          throw queryError
        }

        if (data) {
          // Buscar dados do usuário
          const { data: userData } = await supabase
            .from('users')
            .select('email, nome, telefone')
            .eq('id', id)
            .single()

          setMotorista({
            ...data,
            user_email: userData?.email || '',
            user_nome: userData?.nome || '',
          })
        }
      } catch (err: any) {
        console.error('Erro ao buscar motorista:', err)
        setError(err.message || 'Erro ao buscar motorista')
        toast.error('Erro ao carregar motorista')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMotorista()
    }
  }, [id])

  return {
    motorista,
    loading,
    error,
  }
}

