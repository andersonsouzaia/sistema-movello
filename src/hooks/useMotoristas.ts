import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Motorista, MotoristaStatus } from '@/types/database'
import { toast } from 'sonner'

export interface MotoristaWithUser extends Motorista {
  user_email: string
  user_nome: string
}

interface UseMotoristasOptions {
  status?: MotoristaStatus
  page?: number
  perPage?: number
  searchTerm?: string
}

import { useQuery } from '@tanstack/react-query'

export const useMotoristas = (options: UseMotoristasOptions = {}) => {
  const { page = 1, perPage = 10, searchTerm = '', status } = options

  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['motoristas', { page, perPage, searchTerm, status }],
    queryFn: async ({ signal }) => {
      let query = supabase
        .from('motoristas')
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

      // Busca (Search)
      if (searchTerm) {
        query = query.or(`cpf.ilike.%${searchTerm}%,veiculo.ilike.%${searchTerm}%`)
      }

      // Supabase supports abortSignal in v2
      // @ts-ignore
      const { data, error: queryError, count: totalCount } = await query.abortSignal(signal)

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
          .abortSignal(signal)

        const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]))

        motoristasWithUser.push(...(data || []).map((motorista: Motorista) => ({
          ...motorista,
          user_email: usersMap.get(motorista.id)?.email || '',
          user_nome: usersMap.get(motorista.id)?.nome || '',
        })))
      }

      return {
        motoristas: motoristasWithUser,
        count: totalCount || 0,
        totalPages: totalCount ? Math.ceil(totalCount / perPage) : 0
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao carregar motoristas' : null

  return {
    motoristas: data?.motoristas || [],
    loading,
    error,
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    refetch,
  }
}

export const useMotorista = (id: string) => {
  const { data: motorista, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['motorista', id],
    queryFn: async ({ signal }) => {
      const { data, error: queryError } = await supabase
        .from('motoristas')
        .select('*')
        .eq('id', id)
        .single()
        // @ts-ignore
        .abortSignal(signal)

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
          // @ts-ignore
          .abortSignal(signal)

        return {
          ...data,
          user_email: userData?.email || '',
          user_nome: userData?.nome || '',
        } as MotoristaWithUser
      }
      return null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao carregar motorista' : null

  return {
    motorista,
    loading,
    error,
  }
}

