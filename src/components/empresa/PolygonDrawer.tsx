import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Check, X, Edit2, Move, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import 'leaflet/dist/leaflet.css'

// Fix para ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface PolygonDrawerProps {
  value?: Array<[number, number]>
  onChange: (poligono: Array<[number, number]>) => void
  center?: [number, number]
  className?: string
  disabled?: boolean
}

// Componente para atualizar o mapa quando o centro muda
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

// Componente para capturar cliques no mapa
function MapClickHandler({ 
  enabled, 
  onMapClick 
}: { 
  enabled: boolean
  onMapClick: (e: L.LeafletMouseEvent) => void 
}) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onMapClick(e)
      }
    },
  })
  return null
}

export function PolygonDrawer({
  value = [],
  onChange,
  center = [-23.5505, -46.6333],
  className,
  disabled = false,
}: PolygonDrawerProps) {
  const [pontos, setPontos] = useState<Array<[number, number]>>(value)
  const [modoDesenho, setModoDesenho] = useState(false)
  const [pontoEditando, setPontoEditando] = useState<number | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const previousValueRef = useRef<Array<[number, number]>>(value)

  // Sincronizar pontos apenas quando value realmente mudar
  useEffect(() => {
    // Comparar valores profundamente para evitar loops
    const valueChanged = 
      value.length !== previousValueRef.current.length ||
      value.some((p, i) => {
        const prev = previousValueRef.current[i]
        return !prev || p[0] !== prev[0] || p[1] !== prev[1]
      })
    
    if (valueChanged) {
      previousValueRef.current = value
      setPontos(value)
    }
  }, [value])

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (disabled || !modoDesenho || pontoEditando !== null) return

    const { lat, lng } = e.latlng
    const novoPonto: [number, number] = [lat, lng]
    const novosPontos = [...pontos, novoPonto]
    
    setPontos(novosPontos)
    onChange(novosPontos)
  }

  const handleRemoverPonto = (index: number) => {
    const novosPontos = pontos.filter((_, i) => i !== index)
    setPontos(novosPontos)
    onChange(novosPontos)
    setPontoEditando(null)
  }

  const handleEditarPonto = (index: number, novoPonto: [number, number]) => {
    const novosPontos = [...pontos]
    novosPontos[index] = novoPonto
    setPontos(novosPontos)
    onChange(novosPontos)
  }

  const handleLimpar = () => {
    setPontos([])
    onChange([])
    setModoDesenho(false)
    setPontoEditando(null)
  }

  const handleFinalizar = () => {
    if (pontos.length >= 3) {
      setModoDesenho(false)
      setPontoEditando(null)
    }
  }

  const handleDesfazerUltimo = () => {
    if (pontos.length > 0) {
      const novosPontos = pontos.slice(0, -1)
      setPontos(novosPontos)
      onChange(novosPontos)
    }
  }

  const calcularAreaKm2 = () => {
    if (pontos.length < 3) return 0

    let area = 0
    for (let i = 0; i < pontos.length; i++) {
      const j = (i + 1) % pontos.length
      area += pontos[i][0] * pontos[j][1]
      area -= pontos[j][0] * pontos[i][1]
    }
    
    // Converter para km² (aproximação: 1 grau ≈ 111 km)
    const areaKm2 = Math.abs(area) * 0.5 * 111 * 111 / 1000000
    return areaKm2
  }

  const calcularPerimetroKm = () => {
    if (pontos.length < 2) return 0
    
    let perimetro = 0
    for (let i = 0; i < pontos.length; i++) {
      const j = (i + 1) % pontos.length
      const lat1 = pontos[i][0]
      const lng1 = pontos[i][1]
      const lat2 = pontos[j][0]
      const lng2 = pontos[j][1]
      
      // Fórmula de Haversine simplificada para distância
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distancia = 6371 * c // Raio da Terra em km
      
      perimetro += distancia
    }
    
    return perimetro
  }

  const bounds = pontos.length > 0 ? L.latLngBounds(pontos) : null
  const areaKm2 = calcularAreaKm2()
  const perimetroKm = calcularPerimetroKm()

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Desenhar Polígono
            </CardTitle>
            <CardDescription className="mt-1">
              Clique no mapa para adicionar pontos. Mínimo de 3 pontos para formar um polígono válido.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant={modoDesenho ? 'default' : 'outline'}
            onClick={() => {
              setModoDesenho(!modoDesenho)
              setPontoEditando(null)
            }}
            disabled={disabled}
            className="gap-2"
          >
            {modoDesenho ? (
              <>
                <Move className="h-4 w-4" />
                Modo Desenho Ativo
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Iniciar Desenho
              </>
            )}
          </Button>
          
          {pontos.length >= 3 && modoDesenho && (
            <Button
              type="button"
              variant="default"
              onClick={handleFinalizar}
              disabled={disabled}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Finalizar
            </Button>
          )}
          
          {pontos.length > 0 && modoDesenho && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDesfazerUltimo}
              disabled={disabled}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Desfazer Último
            </Button>
          )}
          
          {pontos.length > 0 && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleLimpar}
              disabled={disabled}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Tudo
            </Button>
          )}
        </div>

        {/* Alerta de modo desenho */}
        {modoDesenho && (
          <Alert className="border-primary bg-primary/5">
            <Move className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong>Modo Desenho Ativo:</strong> Clique no mapa para adicionar pontos ao polígono.
              {pontos.length < 3 && (
                <span className="block mt-1 text-yellow-600">
                  Adicione mais {3 - pontos.length} ponto{3 - pontos.length !== 1 ? 's' : ''} para formar um polígono válido.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Status e Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-1">Pontos</span>
            <Badge variant={pontos.length >= 3 ? 'default' : 'secondary'} className="w-fit">
              {pontos.length} / 3+
            </Badge>
          </div>
          {pontos.length >= 3 && (
            <>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Área</span>
                <span className="text-sm font-medium">{areaKm2.toFixed(2)} km²</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Perímetro</span>
                <span className="text-sm font-medium">{perimetroKm.toFixed(2)} km</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Status</span>
                <Badge variant="default" className="w-fit">
                  <Check className="h-3 w-3 mr-1" />
                  Válido
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Mapa */}
        <div className="relative border rounded-lg overflow-hidden">
          <MapContainer
            center={center}
            zoom={bounds ? undefined : 13}
            bounds={bounds ? bounds.pad(0.1) : undefined}
            style={{ height: '500px', width: '100%' }}
            scrollWheelZoom={true}
            zoomControl={true}
            whenCreated={(map) => {
              mapRef.current = map
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={center} />
            <MapClickHandler enabled={modoDesenho} onMapClick={handleMapClick} />
            
            {/* Polígono */}
            {pontos.length >= 3 && (
              <Polygon
                positions={pontos}
                pathOptions={{ 
                  color: '#3b82f6', 
                  fillColor: '#3b82f6', 
                  fillOpacity: 0.25,
                  weight: 3
                }}
              />
            )}
            
            {/* Linha guia (mostra pontos mesmo sem polígono válido) */}
            {pontos.length >= 2 && pontos.length < 3 && (
              <Polygon
                positions={pontos}
                pathOptions={{ 
                  color: '#f59e0b', 
                  fillColor: 'transparent', 
                  fillOpacity: 0,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            )}
            
            {/* Marcadores dos pontos */}
            {pontos.map((point, index) => (
              <Marker
                key={`${point[0]}-${point[1]}-${index}`}
                position={point}
                icon={L.icon({
                  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
                eventHandlers={{
                  click: () => {
                    if (!modoDesenho && !disabled) {
                      setPontoEditando(pontoEditando === index ? null : index)
                    }
                  }
                }}
              />
            ))}
          </MapContainer>
          
          {/* Overlay de instruções */}
          {modoDesenho && (
            <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm p-3 rounded-lg shadow-lg z-[1000] border border-border">
              <p className="text-sm font-medium mb-1">Modo Desenho Ativo</p>
              <p className="text-xs text-muted-foreground">
                Clique no mapa para adicionar pontos
              </p>
              {pontos.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {pontos.length} ponto{pontos.length !== 1 ? 's' : ''} adicionado{pontos.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lista de Pontos */}
        {pontos.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Pontos do Polígono</h4>
              <Badge variant="secondary" className="text-xs">
                {pontos.length} vértice{pontos.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 border rounded-lg p-2 bg-muted/30">
              {pontos.map((point, index) => (
                <div
                  key={`${point[0]}-${point[1]}-${index}`}
                  className={cn(
                    "flex items-center justify-between p-2 rounded text-sm transition-colors",
                    pontoEditando === index ? "bg-primary/10 border border-primary" : "bg-background border border-border"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant="outline" className="text-xs w-6 h-6 flex items-center justify-center p-0">
                      {index + 1}
                    </Badge>
                    <span className="font-mono text-xs">
                      {point[0].toFixed(6)}, {point[1].toFixed(6)}
                    </span>
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleRemoverPonto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
