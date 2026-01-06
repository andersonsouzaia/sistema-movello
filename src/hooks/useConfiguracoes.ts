import { useState, useEffect, useCallback } from 'react'
import { configuracaoService } from '@/services/configuracaoService'
import type { Configuracao, TemplateEmail, Automatizacao } from '@/types/database'

export const useConfiguracoes = (categoria?: string) => {
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfiguracoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await configuracaoService.getConfiguracoes(categoria)
      setConfiguracoes(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar configurações'
      setError(errorMessage)
      console.error('Erro ao buscar configurações:', err)
    } finally {
      setLoading(false)
    }
  }, [categoria])

  useEffect(() => {
    fetchConfiguracoes()
  }, [fetchConfiguracoes])

  return {
    configuracoes,
    loading,
    error,
    refetch: fetchConfiguracoes,
  }
}

export const useTemplatesEmail = () => {
  const [templates, setTemplates] = useState<TemplateEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await configuracaoService.getTemplatesEmail()
      setTemplates(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar templates'
      setError(errorMessage)
      console.error('Erro ao buscar templates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  }
}

export const useAutomatizacoes = () => {
  const [automatizacoes, setAutomatizacoes] = useState<Automatizacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAutomatizacoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await configuracaoService.getAutomatizacoes()
      setAutomatizacoes(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar automações'
      setError(errorMessage)
      console.error('Erro ao buscar automações:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAutomatizacoes()
  }, [fetchAutomatizacoes])

  return {
    automatizacoes,
    loading,
    error,
    refetch: fetchAutomatizacoes,
  }
}

