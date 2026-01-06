import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { empresaRascunhoService, type AtivarRascunhoResult } from '@/services/empresaRascunhoService'
import type { Campanha } from '@/types/database'
import type { CreateCampanhaData } from '@/services/empresaCampanhaService'

/**
 * Hook para listar rascunhos da empresa
 */
export const useRascunhos = () => {
  const { empresa } = useAuth()
  const [rascunhos, setRascunhos] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRascunhos = useCallback(async () => {
    if (!empresa?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await empresaRascunhoService.listarRascunhos()
      setRascunhos(data)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao buscar rascunhos'
      setError(errorMessage)
      console.error('Erro ao buscar rascunhos:', err)
    } finally {
      setLoading(false)
    }
  }, [empresa?.id])

  useEffect(() => {
    fetchRascunhos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id])

  return {
    rascunhos,
    loading,
    error,
    refetch: fetchRascunhos,
  }
}

/**
 * Hook para salvar/atualizar rascunho
 */
export const useSalvarRascunho = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const salvarRascunho = useCallback(
    async (campanhaId: string | null, dados: CreateCampanhaData) => {
      setLoading(true)
      setError(null)

      try {
        const id = await empresaRascunhoService.salvarRascunho(
          campanhaId,
          dados
        )
        return id
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao salvar rascunho'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    salvarRascunho,
    loading,
    error,
  }
}

/**
 * Hook para ativar rascunho
 */
export const useAtivarRascunho = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ativarRascunho = useCallback(async (campanhaId: string) => {
    setLoading(true)
    setError(null)

    try {
      const resultado = await empresaRascunhoService.ativarRascunho(campanhaId)
      return resultado
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao ativar rascunho'
      setError(errorMessage)
      return { sucesso: false, mensagem: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    ativarRascunho,
    loading,
    error,
  }
}

