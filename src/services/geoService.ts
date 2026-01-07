import { supabase } from '@/lib/supabase'
import {
  geocodeEndereco,
  reverseGeocode,
  calcularDistancia,
  verificarPontoEmRaio,
  verificarPontoEmPoligono,
  buscarCidades,
  ESTADOS_BRASIL,
} from '@/utils/geocoding'

export interface GeocodeResult {
  lat: number
  lng: number
  display_name: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
}

export interface ReverseGeocodeResult {
  display_name: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
}

export const geoService = {
  /**
   * Converter endereço em coordenadas
   */
  async geocodeEndereco(endereco: string): Promise<GeocodeResult | null> {
    return geocodeEndereco(endereco)
  },

  /**
   * Converter coordenadas em endereço
   */
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    return reverseGeocode(lat, lng)
  },

  /**
   * Buscar cidades brasileiras
   */
  async buscarCidades(query: string): Promise<Array<{ nome: string; estado: string }>> {
    return buscarCidades(query)
  },

  /**
   * Listar estados brasileiros
   */
  async buscarEstados(): Promise<Array<{ sigla: string; nome: string }>> {
    return ESTADOS_BRASIL
  },

  /**
   * Calcular distância entre dois pontos
   */
  calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
    return calcularDistancia(lat1, lng1, lat2, lng2)
  },

  /**
   * Verificar se localização está na área de uma campanha
   */
  async verificarLocalizacaoCampanha(
    lat: number,
    lng: number,
    campanhaId: string
  ): Promise<boolean> {
    try {
      const { data: campanha, error } = await supabase
        .from('campanhas')
        .select('localizacao_tipo, raio_km, centro_latitude, centro_longitude, poligono_coordenadas, cidades, estados')
        .eq('id', campanhaId)
        .single()

      if (error || !campanha) {
        return false
      }

      const { localizacao_tipo, raio_km, centro_latitude, centro_longitude, poligono_coordenadas, cidades, estados } = campanha

      if (!localizacao_tipo) {
        return false
      }

      if (localizacao_tipo === 'raio') {
        if (centro_latitude && centro_longitude && raio_km) {
          return verificarPontoEmRaio(lat, lng, centro_latitude, centro_longitude, raio_km)
        }
      }

      if (localizacao_tipo === 'poligono') {
        if (poligono_coordenadas && Array.isArray(poligono_coordenadas)) {
          return verificarPontoEmPoligono(lat, lng, poligono_coordenadas as Array<[number, number]>)
        }
      }

      if (localizacao_tipo === 'cidade' || localizacao_tipo === 'estado') {
        // Buscar cidade/estado da coordenada
        const endereco = await reverseGeocode(lat, lng)
        if (endereco?.address) {
          if (localizacao_tipo === 'cidade' && cidades) {
            const cidadeEstado = `${endereco.address.city}, ${endereco.address.state}`
            return cidades.includes(cidadeEstado)
          }
          if (localizacao_tipo === 'estado' && estados && endereco.address.state) {
            return estados.includes(endereco.address.state)
          }
        }
      }

      return false
    } catch (error) {
      console.error('Erro ao verificar localização da campanha:', error)
      return false
    }
  },

  /**
   * Buscar campanhas ativas por localização usando função SQL
   */
  async getCampanhasPorLocalizacao(lat: number, lng: number) {
    try {
      const { data, error } = await supabase.rpc('get_campanhas_por_localizacao', {
        p_lat: lat,
        p_lng: lng,
      })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao buscar campanhas por localização:', error)
      throw error
    }
  },
}


