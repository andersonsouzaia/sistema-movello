import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { empresaCampanhaService } from '@/services/empresaCampanhaService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { CampanhaWithEmpresa } from '@/types/database'

/**
 * Hook para buscar uma campanha específica da empresa autenticada
 */
export function useEmpresaCampanha(campanhaId: string) {
  const { empresa } = useAuth()
  const [campanha, setCampanha] = useState<CampanhaWithEmpresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampanha = async () => {
      if (!campanhaId || !empresa?.id) {
        setLoading(false)
        setError('ID da campanha ou empresa não disponível.')
        return
      }

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('campanhas')
          .select('*, empresa:empresa_id(id, razao_social, nome_fantasia)')
          .eq('id', campanhaId)
          .eq('empresa_id', empresa.id)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (data) {
          setCampanha(data as CampanhaWithEmpresa)
        } else {
          setError('Campanha não encontrada')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar campanha'
        setError(errorMessage)
        console.error('Erro ao buscar campanha:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampanha()
  }, [campanhaId, empresa?.id])

  return {
    campanha,
    loading,
    error,
  }
}

