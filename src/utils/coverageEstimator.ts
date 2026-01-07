/**
 * Utilitários para estimar alcance e cobertura de campanhas
 */

export interface CoverageEstimate {
  areaKm2: number
  alcanceEstimado: number
  impressoesEstimadas: number
  cpmEstimado: number
  densidadePopulacional: number
}

// Densidade populacional média por tipo de área (pessoas/km²)
const DENSIDADES = {
  urbana: 5000,
  suburbana: 2000,
  rural: 100,
  metropolitana: 10000,
}

/**
 * Calcular área de um círculo (raio)
 */
export function calcularAreaRaio(raioKm: number): number {
  return Math.PI * raioKm * raioKm
}

/**
 * Calcular área aproximada de um polígono usando fórmula de Shoelace
 */
export function calcularAreaPoligono(coordenadas: Array<[number, number]>): number {
  if (coordenadas.length < 3) return 0

  let area = 0
  for (let i = 0; i < coordenadas.length; i++) {
    const j = (i + 1) % coordenadas.length
    area += coordenadas[i][0] * coordenadas[j][1]
    area -= coordenadas[j][0] * coordenadas[i][1]
  }

  // Converter graus para km² (aproximação)
  // 1 grau de latitude ≈ 111 km
  // 1 grau de longitude varia, mas usamos média de 111 km
  const areaKm2 = Math.abs(area) * 0.5 * 111 * 111 / 1000000
  return areaKm2
}

/**
 * Estimar densidade populacional baseado na localização
 */
export function estimarDensidadePopulacional(
  tipo: 'raio' | 'poligono' | 'cidade' | 'estado',
  centroLat?: number,
  centroLng?: number,
  cidades?: string[]
): number {
  // Se tem cidades específicas, assumir área urbana
  if (cidades && cidades.length > 0) {
    return DENSIDADES.urbana
  }

  // Se tem coordenadas, tentar determinar se é área urbana/suburbana
  if (centroLat && centroLng) {
    // Coordenadas de grandes cidades brasileiras (aproximação)
    const grandesCidades = [
      { lat: -23.5505, lng: -46.6333, nome: 'São Paulo' },
      { lat: -22.9068, lng: -43.1729, nome: 'Rio de Janeiro' },
      { lat: -19.9167, lng: -43.9345, nome: 'Belo Horizonte' },
      { lat: -30.0346, lng: -51.2177, nome: 'Porto Alegre' },
      { lat: -25.4284, lng: -49.2733, nome: 'Curitiba' },
    ]

    // Verificar se está próximo de uma grande cidade (dentro de 50km)
    for (const cidade of grandesCidades) {
      const distancia = calcularDistancia(
        centroLat,
        centroLng,
        cidade.lat,
        cidade.lng
      )
      if (distancia < 50) {
        return DENSIDADES.metropolitana
      }
      if (distancia < 100) {
        return DENSIDADES.urbana
      }
    }

    // Se não está próximo de grandes cidades, assumir suburbana
    return DENSIDADES.suburbana
  }

  // Padrão: área urbana
  return DENSIDADES.urbana
}

/**
 * Calcular distância entre dois pontos (Haversine)
 */
function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Estimar alcance e métricas de uma campanha
 */
export function estimarCobertura(
  tipo: 'raio' | 'poligono' | 'cidade' | 'estado',
  raioKm?: number,
  poligonoCoordenadas?: Array<[number, number]>,
  centroLat?: number,
  centroLng?: number,
  cidades?: string[],
  estados?: string[],
  orcamento?: number
): CoverageEstimate {
  let areaKm2 = 0

  // Calcular área baseado no tipo
  if (tipo === 'raio' && raioKm) {
    areaKm2 = calcularAreaRaio(raioKm)
  } else if (tipo === 'poligono' && poligonoCoordenadas) {
    areaKm2 = calcularAreaPoligono(poligonoCoordenadas)
  } else if (tipo === 'cidade' && cidades && cidades.length > 0) {
    // Estimativa média de área de cidade brasileira: 500 km²
    areaKm2 = cidades.length * 500
  } else if (tipo === 'estado' && estados && estados.length > 0) {
    // Estimativa média de área de estado brasileiro: 200,000 km²
    areaKm2 = estados.length * 200000
  }

  // Estimar densidade populacional
  const densidade = estimarDensidadePopulacional(
    tipo,
    centroLat,
    centroLng,
    cidades
  )

  // Calcular alcance estimado
  const alcanceEstimado = Math.round(areaKm2 * densidade)

  // Estimar impressões (3 impressões por pessoa em média durante a campanha)
  const impressoesEstimadas = alcanceEstimado * 3

  // Calcular CPM estimado
  const cpmEstimado = orcamento && impressoesEstimadas > 0
    ? (orcamento / impressoesEstimadas) * 1000
    : 0

  return {
    areaKm2: parseFloat(areaKm2.toFixed(2)),
    alcanceEstimado,
    impressoesEstimadas,
    cpmEstimado: parseFloat(cpmEstimado.toFixed(2)),
    densidadePopulacional: densidade,
  }
}

/**
 * Comparar duas áreas de cobertura
 */
export function compararCoberturas(
  estimativa1: CoverageEstimate,
  estimativa2: CoverageEstimate
): {
  diferencaArea: number
  diferencaAlcance: number
  diferencaImpressoes: number
  diferencaCPM: number
} {
  return {
    diferencaArea: estimativa2.areaKm2 - estimativa1.areaKm2,
    diferencaAlcance: estimativa2.alcanceEstimado - estimativa1.alcanceEstimado,
    diferencaImpressoes: estimativa2.impressoesEstimadas - estimativa1.impressoesEstimadas,
    diferencaCPM: estimativa2.cpmEstimado - estimativa1.cpmEstimado,
  }
}


