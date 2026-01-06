import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { LoginAttemptResult } from '@/types/database'

interface UseLoginAttemptsReturn {
  checkLoginAttempts: (email: string, userId?: string) => Promise<LoginAttemptResult | null>
  resetLoginAttempts: (userId: string) => Promise<void>
  loading: boolean
  error: string | null
}

export const useLoginAttempts = (): UseLoginAttemptsReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkLoginAttempts = async (
    email: string,
    userId?: string
  ): Promise<LoginAttemptResult | null> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase.rpc('registrar_tentativa_login', {
        p_email: email,
        p_user_id: userId || null,
      })

      if (rpcError) {
        setError(rpcError.message)
        return null
      }

      return data as LoginAttemptResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar tentativas'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const resetLoginAttempts = async (userId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { error: rpcError } = await supabase.rpc('resetar_tentativas_login', {
        p_user_id: userId,
      })

      if (rpcError) {
        setError(rpcError.message)
        throw rpcError
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao resetar tentativas'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    checkLoginAttempts,
    resetLoginAttempts,
    loading,
    error,
  }
}

