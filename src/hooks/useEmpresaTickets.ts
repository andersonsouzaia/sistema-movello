import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef<string>('')
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const stableFilters = useMemo(() => {
    if (!empresa?.id) return {}
    
    return {
      empresa_id: empresa.id,
      ...filters,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    empresa?.id,
    filters.status,
    filters.prioridade,
    filters.search,
  ])

  const fetchTickets = useCallback(async () => {
    if (isFetchingRef.current) return
    
    if (!empresa?.id) {
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
  }, [stableFilters, empresa?.id])

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
export const useEmpresaTicket = (id: string | null) => {
  const { empresa } = useAuth()
  const [ticket, setTicket] = useState<TicketWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id || !empresa?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await ticketService.getTicket(id)
        
        // Verificar se o ticket pertence à empresa
        if (data && data.empresa_id !== empresa.id) {
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
  }, [id, empresa?.id])

  return {
    ticket,
    loading,
    error,
  }
}

/**
 * Hook para criar um novo ticket
 */
export const useCreateTicket = () => {
  const { empresa } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTicket = useCallback(async (data: CreateTicketData) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
    }

    setLoading(true)
    setError(null)

    try {
      const result = await ticketService.createTicket({
        empresa_id: empresa.id,
        assunto: data.assunto,
        descricao: data.descricao,
        prioridade: data.prioridade,
        status: 'aberto',
      })

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar ticket')
      }

      toast.success('Ticket criado com sucesso!')
      return result.ticket
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar ticket'
      setError(errorMessage)
      toast.error(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addComment = useCallback(async (
    ticketId: string,
    comentario: string,
    interno: boolean = false
  ) => {
    if (!empresa?.id) {
      throw new Error('Empresa não encontrada')
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
  }, [empresa?.id])

  return {
    addComment,
    loading,
    error,
  }
}

