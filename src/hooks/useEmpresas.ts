import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empresa, EmpresaStatus } from '@/types/database'
import { toast } from 'sonner'

export interface EmpresaWithUser extends Empresa {
  user_email: string
  user_nome: string
}

interface UseEmpresasOptions {
  status?: EmpresaStatus
  page?: number
  perPage?: number
  searchTerm?: string
}

export const useEmpresas = (options: UseEmpresasOptions = {}) => {
  const { page = 1, perPage = 10, searchTerm = '', status } = options
  const [empresas, setEmpresas] = useState<EmpresaWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Use useRef to keep track of the current abort controller
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchEmpresas = async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('empresas')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Aplicar filtro de status
      if (status) {
        query = query.eq('status', status)
      }

      // Paginação
      const from = (page - 1) * perPage
      const to = from + perPage - 1
      query = query.range(from, to)

      // Busca (Search) - Nota: isso busca apenas na tabela empresas
      // Para buscar pelo nome do usuário, seria necessário uma query mais complexa ou RPC
      if (searchTerm) {
        // Busca simples por razão social ou CNPJ
        query = query.or(`razao_social.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`)
      }

      const { data, error: queryError, count: totalCount } = await query.abortSignal(controller.signal)

      if (queryError) {
        if (queryError.code === '20' || queryError.message.includes('AbortError')) {
          // Ignore stats from aborted requests
          return
        }
        throw queryError
      }

      if (totalCount !== null) {
        setCount(totalCount)
        setTotalPages(Math.ceil(totalCount / perPage))
      }

      // Buscar dados dos usuários separadamente
      const userIds = (data || []).map((e: Empresa) => e.id)
      const empresasWithUser: EmpresaWithUser[] = []

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, nome')
          .in('id', userIds)
          .abortSignal(controller.signal)

        const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))

        empresasWithUser.push(...(data || []).map((empresa: Empresa) => ({
          ...empresa,
          user_email: usersMap.get(empresa.id)?.email || '',
          user_nome: usersMap.get(empresa.id)?.nome || '',
        })))
      }

      setEmpresas(empresasWithUser)
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
        console.log('Requisição cancelada (debounce)')
        return
      }
      console.error('Erro ao buscar empresas:', err)
      setError(err.message || 'Erro ao buscar empresas')
      toast.error('Erro ao carregar empresas')
    } finally {
      // Only verify loading state if this is still the active request
      if (abortControllerRef.current === controller) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchEmpresas()

    return () => {
      // Cleanup on unmount or re-render
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [page, perPage, searchTerm, status])

  return {
    empresas,
    loading,
    error,
    count,
    totalPages,
    refetch: fetchEmpresas,
  }
}

export const useEmpresa = (id: string) => {
  const [empresa, setEmpresa] = useState<EmpresaWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    if (id) {
      fetchEmpresa()
    }
  }, [id])

  return {
    empresa,
    loading,
    error,
    refetch: fetchEmpresa,
  }
}

