import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketService, GetTicketsFilters } from '@/services/ticketService'

export const useTickets = (filters: GetTicketsFilters = {}) => {
  // Estabilizar o objeto filters com useMemo não é estritamente necessário se passado diretamente para a queryKey
  // mas ajuda a evitar re-renders desnecessários se o objeto não for estável
  const stableFilters = useMemo(() => filters, [
    filters.status,
    filters.prioridade,
    filters.atribuido_a,
    filters.empresa_id,
    filters.motorista_id,
    filters.tag_id,
    filters.search,
  ])

  const { data: tickets = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['tickets', stableFilters],
    queryFn: () => ticketService.getTickets(stableFilters),
    staleTime: 1000 * 60 * 1, // 1 minuto de cache
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar tickets' : null

  return {
    tickets,
    loading,
    error,
    refetch,
  }
}

export const useTicket = (id: string | null) => {
  const { data: ticket, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => (id ? ticketService.getTicket(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos para detalhes
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar ticket' : null

  return {
    ticket,
    loading,
    error,
    refetch,
  }
}

export const useTicketComments = (ticketId: string) => {
  const { data: comments = [], isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: () => ticketService.getComments(ticketId),
    enabled: !!ticketId,
  })

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao buscar comentários' : null

  return {
    comments,
    loading,
    error,
    refetch,
  }
}

