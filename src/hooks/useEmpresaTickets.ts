import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { ticketService } from '@/services/ticketService'
import { toast } from 'sonner'
import type { TicketWithDetails, TicketComentario } from '@/types/database'

export interface UseEmpresaTicketsFilters {
  status?: string
  prioridade?: string
  search?: string
}

export interface CreateTicketData {
  assunto: string
  descricao: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
}

/**
 * Hook para listar tickets da empresa
 */
export const useEmpresaTickets = (filters: UseEmpresaTicketsFilters = {}) => {
  const { empresa } = useAuth()

  const stableFilters = useMemo(() => {
    if (!empresa?.id) return {}

    return {
      empresa_id: empresa.id,
      ...filters,
    }
  }, [
    empresa?.id,
    filters.status,
    filters.prioridade,
    filters.search,
  ])

  const { data: tickets = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['empresa-tickets', stableFilters],
    queryFn: () => {
      if (!empresa?.id) return []
      return ticketService.getTickets(stableFilters)
    },
    enabled: !!empresa?.id,
    staleTime: 1000 * 60 * 1, // 1 minuto
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar tickets' : null

  return {
    tickets,
    loading: loading && !!empresa?.id,
    error,
    refetch,
  }
}

/**
 * Hook para buscar detalhes de um ticket específico
 */
export const useEmpresaTicket = (id: string | null) => {
  const { empresa } = useAuth()

  const { data: ticket, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) return null
      const data = await ticketService.getTicket(id)
      if (data && data.empresa_id !== empresa?.id) {
        throw new Error('Ticket não encontrado ou você não tem permissão para visualizá-lo')
      }
      return data
    },
    enabled: !!id && !!empresa?.id,
    retry: false,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar ticket' : null

  return {
    ticket,
    loading: loading && !!id && !!empresa?.id,
    error,
  }
}

/**
 * Hook para criar um novo ticket
 */
export const useCreateTicket = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: createTicket, isPending: loading, error: queryError } = useMutation({
    mutationFn: async (data: CreateTicketData) => {
      if (!empresa?.id) throw new Error('Empresa não encontrada')

      const result = await ticketService.createTicket({
        empresa_id: empresa.id,
        titulo: data.assunto,
        descricao: data.descricao,
        prioridade: data.prioridade,
      }, empresa.id)

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar ticket')
      }
      return result.ticketId
    },
    onSuccess: () => {
      toast.success('Ticket criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['empresa-tickets'] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar ticket'
      toast.error(errorMessage)
    }
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao criar ticket' : null

  return {
    createTicket,
    loading,
    error,
  }
}

/**
 * Hook para adicionar comentário a um ticket
 */
export const useAddTicketComment = () => {
  const { empresa } = useAuth()
  const queryClient = useQueryClient()

  const { mutateAsync: addComment, isPending: loading, error: queryError } = useMutation({
    mutationFn: async ({ ticketId, comentario, interno = false }: { ticketId: string, comentario: string, interno?: boolean }) => {
      if (!empresa?.id) throw new Error('Empresa não encontrada')

      const result = await ticketService.addComment(
        ticketId,
        comentario,
        empresa.id,
        [], // anexos
        interno
      )

      if (!result.success) {
        throw new Error(result.error || 'Erro ao adicionar comentário')
      }
      return result.commentId
    },
    onSuccess: (_, variables) => {
      toast.success('Comentário adicionado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', variables.ticketId] })
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar comentário'
      toast.error(errorMessage)
    }
  })

  // Wrapper para manter a assinatura original do hook
  const addCommentWrapper = (ticketId: string, comentario: string, interno: boolean = false) => {
    return addComment({ ticketId, comentario, interno })
  }

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao adicionar comentário' : null

  return {
    addComment: addCommentWrapper,
    loading,
    error,
  }
}
