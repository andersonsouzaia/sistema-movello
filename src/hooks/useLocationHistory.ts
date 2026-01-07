import { useState, useEffect, useCallback } from 'react'

export interface LocationHistoryItem {
  display_name: string
  lat: number
  lng: number
  localizacao_tipo?: 'raio' | 'poligono' | 'cidade' | 'estado'
  raio_km?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  timestamp: number
  is_favorite?: boolean
}

const HISTORY_KEY = 'movello_location_history'
const MAX_HISTORY = 20

export function useLocationHistory() {
  const [history, setHistory] = useState<LocationHistoryItem[]>([])

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as LocationHistoryItem[]
        setHistory(parsed.slice(0, MAX_HISTORY))
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de localizações:', error)
    }
  }, [])

  const addToHistory = useCallback((item: Omit<LocationHistoryItem, 'timestamp' | 'is_favorite'>) => {
    const newItem: LocationHistoryItem = {
      ...item,
      timestamp: Date.now(),
      is_favorite: false,
    }

    setHistory((prev) => {
      // Remover duplicatas (mesmo display_name)
      const filtered = prev.filter(h => h.display_name !== newItem.display_name)
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY)
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Erro ao salvar histórico:', error)
      }
      
      return updated
    })
  }, [])

  const toggleFavorite = useCallback((displayName: string) => {
    setHistory((prev) => {
      const updated = prev.map(item => 
        item.display_name === displayName
          ? { ...item, is_favorite: !item.is_favorite }
          : item
      )
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Erro ao salvar histórico:', error)
      }
      
      return updated
    })
  }, [])

  const removeFromHistory = useCallback((displayName: string) => {
    setHistory((prev) => {
      const updated = prev.filter(item => item.display_name !== displayName)
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Erro ao salvar histórico:', error)
      }
      
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_KEY)
    } catch (error) {
      console.error('Erro ao limpar histórico:', error)
    }
  }, [])

  const favorites = history.filter(item => item.is_favorite)
  const recent = history.filter(item => !item.is_favorite).slice(0, 10)

  return {
    history,
    favorites,
    recent,
    addToHistory,
    toggleFavorite,
    removeFromHistory,
    clearHistory,
  }
}


