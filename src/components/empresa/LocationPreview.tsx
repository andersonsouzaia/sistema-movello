import { MapContainer, TileLayer, Marker, Circle, Polygon, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Edit, Circle as CircleIcon, Navigation2, Maximize2, Info, Map } from 'lucide-react'
import type { LocalizacaoTipo } from '@/types/database'
import { formatarCoordenadas } from '@/utils/geocoding'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import 'leaflet/dist/leaflet.css'

// Função para calcular área de polígono usando fórmula de Shoelace
function calcularAreaPoligono(coordenadas: Array<[number, number]>): number {
  if (coordenadas.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < coordenadas.length; i++) {
    const j = (i + 1) % coordenadas.length
    area += coordenadas[i][0] * coordenadas[j][1]
    area -= coordenadas[j][0] * coordenadas[i][1]
  }
  
  // Converter para km² (aproximação)
  // 1 grau de latitude ≈ 111 km
  // 1 grau de longitude varia, mas usamos média de ~111 km para Brasil
  const areaKm2 = Math.abs(area) * 0.5 * 111 * 111 / 1000000
  return areaKm2
}

// Componente para ajustar o mapa ao bounds
function MapBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap()
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 })
    }
  }, [map, bounds])
  
  return null
}

interface LocationPreviewProps {
  tipo: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  onEdit?: () => void
  className?: string
  readOnly?: boolean
}

export function LocationPreview({
  tipo,
  raio_km,
  centro_latitude,
  centro_longitude,
  poligono_coordenadas,
  cidades,
  estados,
  onEdit,
  className,
  readOnly = false,
}: LocationPreviewProps) {
  const [mapDialogOpen, setMapDialogOpen] = useState(false)
  
  const centro: [number, number] | null =
    centro_latitude && centro_longitude
      ? [centro_latitude, centro_longitude]
      : null

  const calcularBounds = () => {
    if (tipo === 'raio' && centro && raio_km) {
      const radiusInDegrees = raio_km / 111 // Aproximação: 1 grau ≈ 111 km
      return L.latLngBounds(
        [centro[0] - radiusInDegrees, centro[1] - radiusInDegrees],
        [centro[0] + radiusInDegrees, centro[1] + radiusInDegrees]
      )
    }
    if (tipo === 'poligono' && poligono_coordenadas && poligono_coordenadas.length > 0) {
      return L.latLngBounds(poligono_coordenadas)
    }
    return null
  }

  const bounds = calcularBounds()
  const areaKm2 = tipo === 'raio' && raio_km 
    ? Math.PI * raio_km * raio_km 
    : tipo === 'poligono' && poligono_coordenadas
    ? calcularAreaPoligono(poligono_coordenadas)
    : 0

  const renderMapa = (isFullscreen = false) => {
    const height = isFullscreen ? '70vh' : '400px'
    
    if (tipo === 'cidade' || tipo === 'estado') {
      return (
        <div className={cn("bg-muted rounded-lg flex flex-col items-center justify-center p-8", isFullscreen ? 'h-full' : 'h-64')}>
          <Map className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            {tipo === 'cidade' ? 'Visualização por Cidade' : 'Visualização por Estado'}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            {tipo === 'cidade' 
              ? 'A campanha será exibida em todas as áreas dentro das cidades selecionadas'
              : 'A campanha será exibida em todas as áreas dentro dos estados selecionados'}
          </p>
        </div>
      )
    }

    if (!centro && tipo === 'raio') {
      return (
        <div className={cn("bg-muted rounded-lg flex flex-col items-center justify-center p-8", isFullscreen ? 'h-full' : 'h-64')}>
          <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Nenhuma localização definida</p>
          <p className="text-sm text-muted-foreground text-center">
            Selecione um ponto no mapa para definir a área de cobertura
          </p>
        </div>
      )
    }

    if (tipo === 'poligono' && (!poligono_coordenadas || poligono_coordenadas.length === 0)) {
      return (
        <div className={cn("bg-muted rounded-lg flex flex-col items-center justify-center p-8", isFullscreen ? 'h-full' : 'h-64')}>
          <Navigation2 className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Nenhum polígono definido</p>
          <p className="text-sm text-muted-foreground text-center">
            Desenhe um polígono no mapa para definir a área de cobertura
          </p>
        </div>
      )
    }

    return (
      <MapContainer
        center={centro || [-23.5505, -46.6333]}
        zoom={bounds ? undefined : 13}
        bounds={bounds || undefined}
        style={{ height, width: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={true}
        zoomControl={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {bounds && <MapBounds bounds={bounds} />}
        
        {tipo === 'raio' && centro && raio_km && (
          <>
            <Marker 
              position={centro}
              icon={L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            />
            <Circle
              center={centro}
              radius={raio_km * 1000}
              pathOptions={{ 
                color: '#3b82f6', 
                fillColor: '#3b82f6', 
                fillOpacity: 0.25,
                weight: 3
              }}
            />
            {/* Círculo interno para melhor visualização */}
            <Circle
              center={centro}
              radius={raio_km * 1000}
              pathOptions={{ 
                color: '#2563eb', 
                fillColor: 'transparent', 
                fillOpacity: 0,
                weight: 1,
                dashArray: '10, 5'
              }}
            />
          </>
        )}
        
        {tipo === 'poligono' && poligono_coordenadas && poligono_coordenadas.length > 0 && (
          <>
            <Polygon
              positions={poligono_coordenadas}
              pathOptions={{ 
                color: '#3b82f6', 
                fillColor: '#3b82f6', 
                fillOpacity: 0.25,
                weight: 3
              }}
            />
            {poligono_coordenadas.map((point, index) => (
              <Marker 
                key={`${point[0]}-${point[1]}-${index}`}
                position={point}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [20, 32],
                  iconAnchor: [10, 32],
                  popupAnchor: [1, -34],
                  shadowSize: [32, 32]
                })}
              />
            ))}
          </>
        )}
        
        <ZoomControl position="bottomright" />
      </MapContainer>
    )
  }

  return (
    <>
      <Card className={cn("card-premium", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Preview da Localização
              </CardTitle>
              <CardDescription className="mt-1">
                Visualização da área de cobertura da campanha
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(tipo === 'raio' || tipo === 'poligono') && centro && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setMapDialogOpen(true)}
                  className="gap-2"
                >
                  <Maximize2 className="h-4 w-4" />
                  Ampliar
                </Button>
              )}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Badge do Tipo */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {tipo === 'raio' && <CircleIcon className="h-3 w-3 mr-1.5" />}
              {tipo === 'raio' && 'Raio Circular'}
              {tipo === 'poligono' && <Navigation2 className="h-3 w-3 mr-1.5" />}
              {tipo === 'poligono' && 'Polígono Personalizado'}
              {tipo === 'cidade' && <MapPin className="h-3 w-3 mr-1.5" />}
              {tipo === 'cidade' && 'Por Cidade'}
              {tipo === 'estado' && <Map className="h-3 w-3 mr-1.5" />}
              {tipo === 'estado' && 'Por Estado'}
            </Badge>
          </div>

          {/* Mapa */}
          <div className="relative">
            {renderMapa(false)}
          </div>

          {/* Estatísticas e Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {tipo === 'raio' && centro && raio_km && (
              <>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Centro da Área</p>
                      <p className="text-sm font-medium">{formatarCoordenadas(centro[0], centro[1])}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CircleIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Raio de Cobertura</p>
                      <p className="text-sm font-medium">{raio_km.toFixed(2)} km</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Área Total</p>
                      <p className="text-sm font-medium">{areaKm2.toFixed(2)} km²</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Perímetro</p>
                      <p className="text-sm font-medium">{(2 * Math.PI * raio_km).toFixed(2)} km</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tipo === 'poligono' && poligono_coordenadas && poligono_coordenadas.length > 0 && (
              <>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Navigation2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Pontos do Polígono</p>
                      <p className="text-sm font-medium">{poligono_coordenadas.length} vértices</p>
                    </div>
                  </div>
                  {centro && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Centro Aproximado</p>
                        <p className="text-sm font-medium">{formatarCoordenadas(centro[0], centro[1])}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Área Total</p>
                      <p className="text-sm font-medium">{areaKm2.toFixed(2)} km²</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {tipo === 'cidade' && cidades && cidades.length > 0 && (
              <div className="col-span-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Cidades Selecionadas</p>
                    <div className="flex flex-wrap gap-2">
                      {cidades.map((cidade) => (
                        <Badge key={cidade} variant="secondary" className="text-xs px-2 py-1">
                          {cidade}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tipo === 'estado' && estados && estados.length > 0 && (
              <div className="col-span-2">
                <div className="flex items-start gap-2">
                  <Map className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Estados Selecionados</p>
                    <div className="flex flex-wrap gap-2">
                      {estados.map((estado) => (
                        <Badge key={estado} variant="secondary" className="text-xs px-2 py-1">
                          {estado}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para mapa em tela cheia */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="max-w-7xl h-[85vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Visualização Ampliada da Área de Cobertura
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6">
            {renderMapa(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
