/**
 * Hook para gerenciamento de cache
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live em milissegundos
  key: string
}

const CACHE_PREFIX = 'app_cache_'

/**
 * Hook para cache com TTL
 */
export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
): {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
} {
  const { ttl = 5 * 60 * 1000, enabled = true } = options // Default 5 minutos
  const cacheKey = `${CACHE_PREFIX}${key}`
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetchingRef = useRef(false)

  const loadFromCache = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null
      
      const entry: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()
      
      if (now > entry.expiresAt) {
        localStorage.removeItem(cacheKey)
        return null
      }
      
      return entry.data
    } catch {
      return null
    }
  }, [cacheKey])

  const saveToCache = useCallback(
    (value: T) => {
      try {
        const entry: CacheEntry<T> = {
          data: value,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        }
        localStorage.setItem(cacheKey, JSON.stringify(entry))
      } catch (err) {
        console.warn('Erro ao salvar no cache:', err)
      }
    },
    [cacheKey, ttl]
  )

  const fetchData = useCallback(async () => {
    if (fetchingRef.current) return
    
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetcher()
      setData(result)
      saveToCache(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [fetcher, saveToCache])

  const refetch = useCallback(async () => {
    invalidate()
    await fetchData()
  }, [fetchData])

  const invalidate = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey)
      setData(null)
    } catch (err) {
      console.warn('Erro ao invalidar cache:', err)
    }
  }, [cacheKey])

  useEffect(() => {
    if (!enabled) return
    
    // Tentar carregar do cache primeiro
    const cached = loadFromCache()
    if (cached) {
      setData(cached)
      setLoading(false)
      
      // Verificar se precisa atualizar em background
      const entryStr = localStorage.getItem(cacheKey)
      if (entryStr) {
        const entry: CacheEntry<T> = JSON.parse(entryStr)
        const staleTime = entry.timestamp + ttl * 0.8 // 80% do TTL
        if (Date.now() > staleTime) {
          // Atualizar em background
          fetchData()
        }
      }
    } else {
      fetchData()
    }
  }, [enabled, loadFromCache, fetchData, cacheKey, ttl])

  return { data, loading, error, refetch, invalidate }
}

/**
 * Hook para invalidar múltiplos caches por padrão
 */
export function useCacheInvalidation() {
  const invalidateByPattern = useCallback((pattern: string) => {
    try {
      const keys = Object.keys(localStorage)
      const regex = new RegExp(pattern)
      
      keys.forEach((key) => {
        if (regex.test(key)) {
          localStorage.removeItem(key)
        }
      })
    } catch (err) {
      console.warn('Erro ao invalidar cache por padrão:', err)
    }
  }, [])

  const invalidateAll = useCallback(() => {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key)
        }
      })
    } catch (err) {
      console.warn('Erro ao invalidar todos os caches:', err)
    }
  }, [])

  return { invalidateByPattern, invalidateAll }
}

