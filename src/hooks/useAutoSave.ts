import { useEffect, useRef, useCallback, useState } from 'react'

export interface AutoSaveOptions {
  debounceMs?: number
  onSave: () => Promise<void> | void
  enabled?: boolean
  onSaveStart?: () => void
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions
) {
  const {
    debounceMs = 2000,
    onSave,
    enabled = true,
    onSaveStart,
    onSaveSuccess,
    onSaveError,
  } = options

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState<Error | null>(null)
  const previousDataRef = useRef<T>(data)
  const isInitialMount = useRef(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const performSave = useCallback(async () => {
    if (!enabled) return

    try {
      setIsSaving(true)
      setSaveError(null)
      onSaveStart?.()

      await onSave()

      setLastSaved(new Date())
      onSaveSuccess?.()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro desconhecido ao salvar')
      setSaveError(err)
      onSaveError?.(err)
    } finally {
      setIsSaving(false)
    }
  }, [enabled, onSave, onSaveStart, onSaveSuccess, onSaveError])

  useEffect(() => {
    // Ignorar primeira renderização
    if (isInitialMount.current) {
      isInitialMount.current = false
      previousDataRef.current = data
      return
    }

    // Verificar se os dados mudaram
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      previousDataRef.current = data

      // Limpar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Criar novo timeout
      timeoutRef.current = setTimeout(() => {
        performSave()
      }, debounceMs)
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, debounceMs, performSave])

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    await performSave()
  }, [performSave])

  return {
    isSaving,
    lastSaved,
    saveError,
    saveNow,
  }
}
