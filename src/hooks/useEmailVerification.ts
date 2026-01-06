import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UseEmailVerificationReturn {
  sendVerificationCode: (email: string) => Promise<{ success: boolean; error?: string }>
  verifyCode: (code: string) => Promise<{ success: boolean; error?: string }>
  resendCode: () => Promise<{ success: boolean; error?: string }>
  loading: boolean
  error: string | null
  timeRemaining: number
  canResend: boolean
}

const VERIFICATION_TIMEOUT = 5 * 60 // 5 minutos em segundos
const RESEND_COOLDOWN = 30 // 30 segundos

export const useEmailVerification = (): UseEmailVerificationReturn => {
  const { verifyEmail, resendVerificationCode, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(VERIFICATION_TIMEOUT)
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Timer de expiração do código
  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Cooldown para reenvio
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true)
      return
    }

    setCanResend(false)
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  const sendVerificationCode = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      setError(null)
      setTimeRemaining(VERIFICATION_TIMEOUT)

      // Aqui você pode chamar uma função para enviar código
      // Por enquanto, vamos usar o resend do Supabase
      const result = await resendVerificationCode()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar código'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const result = await verifyEmail(code)

      if (result.success) {
        setTimeRemaining(0) // Resetar timer após sucesso
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar código'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async (): Promise<{ success: boolean; error?: string }> => {
    if (!canResend) {
      return { success: false, error: 'Aguarde antes de reenviar' }
    }

    try {
      setLoading(true)
      setError(null)
      setResendCooldown(RESEND_COOLDOWN)
      setTimeRemaining(VERIFICATION_TIMEOUT)

      const result = await resendVerificationCode()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reenviar código'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return {
    sendVerificationCode,
    verifyCode,
    resendCode,
    loading,
    error,
    timeRemaining,
    canResend,
  }
}

