import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empresa, EmpresaStatus } from '@/types/database'
import { toast } from 'sonner'

interface EmpresaWithUser extends Empresa {
  user_email: string
  user_nome: string
}

interface UseEmpresasOptions {
  status?: EmpresaStatus
}

export const useEmpresas = (options: UseEmpresasOptions = {}) => {
  const [empresas, setEmpresas] = useState<EmpresaWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmpresas = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('empresas')
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
      const userIds = (data || []).map((e: Empresa) => e.id)
      const empresasWithUser: EmpresaWithUser[] = []

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, nome')
          .in('id', userIds)

        const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))

        empresasWithUser.push(...(data || []).map((empresa: Empresa) => ({
          ...empresa,
          user_email: usersMap.get(empresa.id)?.email || '',
          user_nome: usersMap.get(empresa.id)?.nome || '',
        })))
      }

      setEmpresas(empresasWithUser)
    } catch (err: any) {
      console.error('Erro ao buscar empresas:', err)
      setError(err.message || 'Erro ao buscar empresas')
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmpresas()
  }, [options.status])

  return {
    empresas,
    loading,
    error,
    refetch: fetchEmpresas,
  }
}

export const useEmpresa = (id: string) => {
  const [empresa, setEmpresa] = useState<EmpresaWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: queryError } = await supabase
          .from('empresas')
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

          setEmpresa({
            ...data,
            user_email: userData?.email || '',
            user_nome: userData?.nome || '',
          })
        }
      } catch (err: any) {
        console.error('Erro ao buscar empresa:', err)
        setError(err.message || 'Erro ao buscar empresa')
        toast.error('Erro ao carregar empresa')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEmpresa()
    }
  }, [id])

  return {
    empresa,
    loading,
    error,
  }
}

