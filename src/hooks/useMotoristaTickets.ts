import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ticketService } from '@/services/ticketService'
import { toast } from 'sonner'
import type { TicketWithDetails, TicketComentario } from '@/types/database'

export interface UseMotoristaTicketsFilters {
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
 * Hook para listar tickets do motorista
 */
export const useMotoristaTickets = (filters: UseMotoristaTicketsFilters = {}) => {
  const { motorista } = useAuth()
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef<string>('')
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const stableFilters = useMemo(() => {
    if (!motorista?.id) return {}
    
    return {
      motorista_id: motorista.id,
      ...filters,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    motorista?.id,
    filters.status,
    filters.prioridade,
    filters.search,
  ])

  const fetchTickets = useCallback(async () => {
    if (isFetchingRef.current) return
    
    if (!motorista?.id) {
      setLoading(false)
      setTickets([])
      return
    }
    
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
  }, [stableFilters, motorista?.id])

  useEffect(() => {
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

/**
 * Hook para buscar detalhes de um ticket específico
 */
export const useMotoristaTicket = (id: string | null) => {
  const { motorista } = useAuth()
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id || !motorista?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await ticketService.getTicket(id)
        
        // Verificar se o ticket pertence ao motorista
        if (data && data.motorista_id !== motorista.id) {
          setError('Ticket não encontrado ou você não tem permissão para visualizá-lo')
          setTicket(null)
        } else {
          setTicket(data)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar ticket'
        setError(errorMessage)
        console.error('Erro ao buscar ticket:', err)
        setTicket(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [id, motorista?.id])

  return {
    ticket,
    loading,
    error,
  }
}

/**
 * Hook para criar um novo ticket
 */
export const useCreateMotoristaTicket = () => {
  const { motorista } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTicket = useCallback(async (data: CreateTicketData) => {
    if (!motorista?.id) {
      throw new Error('Motorista não encontrado')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await ticketService.createTicket({
        motorista_id: motorista.id,
        titulo: data.assunto,
        descricao: data.descricao,
        prioridade: data.prioridade,
      }, motorista.id)

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar ticket')
      }

      toast.success('Ticket criado com sucesso!')
      // Buscar ticket criado para retornar
      if (result.ticketId) {
        const ticket = await ticketService.getTicket(result.ticketId)
        return ticket
      }
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar ticket'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [motorista?.id])

  return {
    createTicket,
    loading,
    error,
  }
}

/**
 * Hook para adicionar comentário a um ticket
 */
export const useAddMotoristaTicketComment = () => {
  const { motorista } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addComment = useCallback(async (
    ticketId: string,
    comentario: string,
    interno: boolean = false
  ) => {
    if (!motorista?.id) {
      throw new Error('Motorista não encontrado')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await ticketService.addComment(ticketId, {
        comentario,
        interno,
      })

      if (!result.success) {
        throw new Error(result.error || 'Erro ao adicionar comentário')
      }

      toast.success('Comentário adicionado com sucesso!')
      return result.comment
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar comentário'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [motorista?.id])

  return {
    addComment,
    loading,
    error,
  }
}
