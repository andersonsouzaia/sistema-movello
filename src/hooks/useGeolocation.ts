import { useState, useEffect } from 'react'
import { geoService } from '@/services/geoService'
import type { GeocodeResult, ReverseGeocodeResult } from '@/services/geoService'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

/**
 * Hook para obter geolocalização do navegador
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  })

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocalização não é suportada pelo navegador',
        loading: false,
      }))
      return
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        })
      },
      (error) => {
        setState({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: error.message,
          loading: false,
        })
      }
    )
  }

  return {
    ...state,
    getCurrentPosition,
  }
}

/**
 * Hook para geocoding (endereço -> coordenadas)
 */
export function useGeocode() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeocodeResult | null>(null)

  const geocode = async (endereco: string) => {
    if (!endereco.trim()) {
      setResult(null)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const resultado = await geoService.geocodeEndereco(endereco)
      setResult(resultado)
      return resultado
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer geocoding'
      setError(errorMessage)
      setResult(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    geocode,
    result,
    loading,
    error,
  }
}

/**
 * Hook para reverse geocoding (coordenadas -> endereço)
 */
export function useReverseGeocode() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ReverseGeocodeResult | null>(null)

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true)
    setError(null)

    try {
      const resultado = await geoService.reverseGeocode(lat, lng)
      setResult(resultado)
      return resultado
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer reverse geocoding'
      setError(errorMessage)
      setResult(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    reverseGeocode,
    result,
    loading,
    error,
  }
}


