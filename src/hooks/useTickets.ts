import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { ticketService, GetTicketsFilters } from '@/services/ticketService'
import type { TicketWithDetails } from '@/types/database'

export const useTickets = (filters: GetTicketsFilters = {}) => {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef<string>('')
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  // Estabilizar o objeto filters usando useMemo
  const stableFilters = useMemo(() => filters, [
    filters.status,
    filters.prioridade,
    filters.atribuido_a,
    filters.empresa_id,
    filters.motorista_id,
    filters.tag_id,
    filters.search,
  ])

  const fetchTickets = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isFetchingRef.current) return
    
    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)
      const data = await ticketService.getTickets(stableFilters)
      setTickets(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar tickets'
      setError(errorMessage)
      console.error('Erro ao buscar tickets:', err)
      setTickets([])
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [stableFilters])

  useEffect(() => {
    // Buscar na primeira renderização ou quando os filtros mudarem
    const filtersKey = JSON.stringify(stableFilters)
    const filtersChanged = filtersRef.current !== filtersKey
    
    if (!hasInitializedRef.current || filtersChanged) {
      hasInitializedRef.current = true
      filtersRef.current = filtersKey
      fetchTickets()
    }
  }, [stableFilters, fetchTickets])

  return {
    tickets,
    loading,
    error,
    refetch: fetchTickets,
  }
}

export const useTicket = (id: string) => {
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await ticketService.getTicket(id)
        setTicket(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar ticket'
        setError(errorMessage)
        console.error('Erro ao buscar ticket:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [id])

  return {
    ticket,
    loading,
    error,
    refetch: async () => {
      if (id) {
        const data = await ticketService.getTicket(id)
        setTicket(data)
      }
    },
  }
}

export const useTicketComments = (ticketId: string) => {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    if (!ticketId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await ticketService.getComments(ticketId)
      setComments(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar comentários'
      setError(errorMessage)
      console.error('Erro ao buscar comentários:', err)
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return {
    comments,
    loading,
    error,
    refetch: fetchComments,
  }
}

