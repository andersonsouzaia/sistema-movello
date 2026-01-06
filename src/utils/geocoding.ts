/**
 * Utilitários de Geocoding e Cálculos Geográficos
 * Usa OpenStreetMap Nominatim API (gratuita)
 */

interface GeocodeResult {
  lat: number
  lng: number
  display_name: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
}

interface ReverseGeocodeResult {
  display_name: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
}

export interface AddressSuggestion {
  lat: number
  lng: number
  display_name: string
  address?: {
    city?: string
    state?: string
    country?: string
    postcode?: string
    road?: string
    house_number?: string
  }
  importance?: number
  place_id?: number
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

// Cache simples para evitar requisições duplicadas
const geocodeCache = new Map<string, GeocodeResult | null>()
const autocompleteCache = new Map<string, AddressSuggestion[]>()

/**
 * Converter endereço em coordenadas (Geocoding)
 */
export async function geocodeEndereco(endereco: string): Promise<GeocodeResult | null> {
  // Verificar cache
  if (geocodeCache.has(endereco)) {
    return geocodeCache.get(endereco) || null
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&addressdetails=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Movello/1.0', // Nominatim requer User-Agent
      },
    })

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      geocodeCache.set(endereco, null)
      return null
    }

    const result = data[0]
    const geocodeResult: GeocodeResult = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      display_name: result.display_name,
      address: result.address,
    }

    geocodeCache.set(endereco, geocodeResult)
    return geocodeResult
  } catch (error) {
    console.error('Erro ao fazer geocoding:', error)
    geocodeCache.set(endereco, null)
    return null
  }
}

/**
 * Buscar sugestões de endereços (Autocomplete)
 */
export async function buscarEnderecosAutocomplete(
  query: string,
  limit: number = 5
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return []
  }

  const cacheKey = `${query}:${limit}`
  
  // Verificar cache
  if (autocompleteCache.has(cacheKey)) {
    return autocompleteCache.get(cacheKey) || []
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1&countrycodes=br&accept-language=pt-BR`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Movello/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Autocomplete failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      autocompleteCache.set(cacheKey, [])
      return []
    }

    const suggestions: AddressSuggestion[] = data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      address: item.address,
      importance: item.importance,
      place_id: item.place_id,
    }))

    autocompleteCache.set(cacheKey, suggestions)
    return suggestions
  } catch (error) {
    console.error('Erro ao buscar autocomplete:', error)
    autocompleteCache.set(cacheKey, [])
    return []
  }
}

/**
 * Converter coordenadas em endereço (Reverse Geocoding)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Movello/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data) {
      return null
    }

    return {
      display_name: data.display_name,
      address: data.address,
    }
  } catch (error) {
    console.error('Erro ao fazer reverse geocoding:', error)
    return null
  }
}

/**
 * Calcular distância entre dois pontos usando fórmula de Haversine
 * Retorna distância em quilômetros
 */
export function calcularDistancia(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distancia = R * c
  
  return distancia
}

/**
 * Verificar se um ponto está dentro de um raio
 */
export function verificarPontoEmRaio(
  lat: number,
  lng: number,
  centroLat: number,
  centroLng: number,
  raioKm: number
): boolean {
  const distancia = calcularDistancia(lat, lng, centroLat, centroLng)
  return distancia <= raioKm
}

/**
 * Verificar se um ponto está dentro de um polígono
 * Usa algoritmo Ray Casting
 */
export function verificarPontoEmPoligono(
  lat: number,
  lng: number,
  poligono: Array<[number, number]>
): boolean {
  if (poligono.length < 3) {
    return false
  }

  let dentro = false
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i]
    const [xj, yj] = poligono[j]
    
    const intersecta =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi
    
    if (intersecta) {
      dentro = !dentro
    }
  }
  
  return dentro
}

/**
 * Converter graus para radianos
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Validar coordenadas
 */
export function validarCoordenadas(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Formatar coordenadas para exibição
 */
export function formatarCoordenadas(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/**
 * Buscar cidades brasileiras (mock - em produção usar API real)
 */
export async function buscarCidades(query: string): Promise<Array<{ nome: string; estado: string }>> {
  // Lista básica de cidades principais do Brasil
  const cidadesPrincipais = [
    { nome: 'São Paulo', estado: 'SP' },
    { nome: 'Rio de Janeiro', estado: 'RJ' },
    { nome: 'Brasília', estado: 'DF' },
    { nome: 'Salvador', estado: 'BA' },
    { nome: 'Fortaleza', estado: 'CE' },
    { nome: 'Belo Horizonte', estado: 'MG' },
    { nome: 'Manaus', estado: 'AM' },
    { nome: 'Curitiba', estado: 'PR' },
    { nome: 'Recife', estado: 'PE' },
    { nome: 'Porto Alegre', estado: 'RS' },
    { nome: 'Goiânia', estado: 'GO' },
    { nome: 'Belém', estado: 'PA' },
    { nome: 'Guarulhos', estado: 'SP' },
    { nome: 'Campinas', estado: 'SP' },
    { nome: 'São Luís', estado: 'MA' },
    { nome: 'São Gonçalo', estado: 'RJ' },
    { nome: 'Maceió', estado: 'AL' },
    { nome: 'Duque de Caxias', estado: 'RJ' },
    { nome: 'Natal', estado: 'RN' },
    { nome: 'Teresina', estado: 'PI' },
  ]

  const queryLower = query.toLowerCase()
  return cidadesPrincipais.filter(
    (cidade) =>
      cidade.nome.toLowerCase().includes(queryLower) ||
      cidade.estado.toLowerCase().includes(queryLower)
  )
}

/**
 * Lista de estados brasileiros
 */
export const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

/**
 * Gerenciar histórico de endereços pesquisados
 */
const HISTORY_KEY = 'movello_address_history'
const MAX_HISTORY_ITEMS = 10

export function getAddressHistory(): AddressSuggestion[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function addToAddressHistory(address: AddressSuggestion): void {
  try {
    const history = getAddressHistory()
    
    // Remover duplicatas
    const filtered = history.filter(
      (item) => item.place_id !== address.place_id
    )
    
    // Adicionar no início
    const updated = [address, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Erro ao salvar histórico de endereços:', error)
  }
}

export function clearAddressHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.error('Erro ao limpar histórico de endereços:', error)
  }
}
