import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { geocodeEndereco, validarCoordenadas } from '@/utils/geocoding'
import { AddressAutocomplete } from '@/components/empresa/AddressAutocomplete'
import type { LocalizacaoTipo } from '@/types/database'
import { cn } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

// Fix para ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapSelectorProps {
  value?: {
    tipo: LocalizacaoTipo
    raio_km?: number
    centro_latitude?: number
    centro_longitude?: number
    poligono_coordenadas?: Array<[number, number]>
    cidades?: string[]
    estados?: string[]
  }
  onChange: (value: {
    tipo: LocalizacaoTipo
    raio_km?: number
    centro_latitude?: number
    centro_longitude?: number
    poligono_coordenadas?: Array<[number, number]>
    cidades?: string[]
    estados?: string[]
  }) => void
  tipo?: LocalizacaoTipo
  readOnly?: boolean
  className?: string
}

// Componente para atualizar o centro do mapa
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export function MapSelector({
  value,
  onChange,
  tipo: tipoProp,
  readOnly = false,
  className,
}: MapSelectorProps) {
  const [tipo, setTipo] = useState<LocalizacaoTipo>(tipoProp || value?.tipo || 'raio')
  const [centro, setCentro] = useState<[number, number]>(
    value?.centro_latitude && value?.centro_longitude
      ? [value.centro_latitude, value.centro_longitude]
      : [-23.5505, -46.6333] // São Paulo padrão
  )
  const [raio, setRaio] = useState<number>(value?.raio_km || 1)
  const [poligono, setPoligono] = useState<Array<[number, number]>>(
    value?.poligono_coordenadas || []
  )
  const [buscaEndereco, setBuscaEndereco] = useState('')
  const [modoDesenho, setModoDesenho] = useState(false)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const polygonRef = useRef<L.Polygon | null>(null)

  // Sincronizar valor externo apenas quando realmente mudar
  useEffect(() => {
    if (!value) return
    
    // Comparar valores para evitar atualizações desnecessárias
    if (value.tipo && value.tipo !== tipo) {
      setTipo(value.tipo)
    }
    if (value.centro_latitude && value.centro_longitude) {
      const novoCentro: [number, number] = [value.centro_latitude, value.centro_longitude]
      if (centro[0] !== novoCentro[0] || centro[1] !== novoCentro[1]) {
        setCentro(novoCentro)
      }
    }
    if (value.raio_km !== undefined && value.raio_km !== raio) {
      setRaio(value.raio_km)
    }
    if (value.poligono_coordenadas && JSON.stringify(value.poligono_coordenadas) !== JSON.stringify(poligono)) {
      setPoligono(value.poligono_coordenadas)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.tipo, value?.centro_latitude, value?.centro_longitude, value?.raio_km, value?.poligono_coordenadas])

  // Usar useRef para armazenar a última versão do onChange e evitar loops
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // Atualizar onChange apenas quando valores realmente mudarem (não quando onChange mudar)
  useEffect(() => {
    const novoValor: any = { tipo }
    
    if (tipo === 'raio' && centro && raio) {
      novoValor.centro_latitude = centro[0]
      novoValor.centro_longitude = centro[1]
      novoValor.raio_km = raio
    } else if (tipo === 'poligono' && poligono.length > 0) {
      novoValor.poligono_coordenadas = poligono
      // Calcular centro do polígono
      const latMedia = poligono.reduce((sum, [lat]) => sum + lat, 0) / poligono.length
      const lngMedia = poligono.reduce((sum, [, lng]) => sum + lng, 0) / poligono.length
      novoValor.centro_latitude = latMedia
      novoValor.centro_longitude = lngMedia
    }
    
    // Usar ref para evitar dependência de onChange
    onChangeRef.current(novoValor)
     
  }, [tipo, centro, raio, poligono])

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (readOnly || tipo === 'cidade' || tipo === 'estado') return
    
    const { lat, lng } = e.latlng
    
    if (tipo === 'raio') {
      setCentro([lat, lng])
      // Atualizar onChange imediatamente para raio
      onChangeRef.current({
        tipo: 'raio',
        centro_latitude: lat,
        centro_longitude: lng,
        raio_km: raio,
      })
    } else if (tipo === 'poligono' && modoDesenho) {
      const novosPontos = [...poligono, [lat, lng]]
      setPoligono(novosPontos)
      // Calcular centro do polígono
      const latMedia = novosPontos.reduce((sum, [lat]) => sum + lat, 0) / novosPontos.length
      const lngMedia = novosPontos.reduce((sum, [, lng]) => sum + lng, 0) / novosPontos.length
      // Atualizar onChange imediatamente para polígono
      onChangeRef.current({
        tipo: 'poligono',
        poligono_coordenadas: novosPontos,
        centro_latitude: latMedia,
        centro_longitude: lngMedia,
      })
    }
  }

  const handleTipoChange = (novoTipo: LocalizacaoTipo) => {
    setTipo(novoTipo)
    setModoDesenho(false)
    if (novoTipo === 'cidade' || novoTipo === 'estado') {
      // Não precisa de mapa para cidade/estado
      onChange({ tipo: novoTipo })
    }
  }

  const handleRemoverUltimoPonto = () => {
    if (poligono.length > 0) {
      setPoligono(poligono.slice(0, -1))
    }
  }

  const handleLimparPoligono = () => {
    setPoligono([])
    setModoDesenho(false)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Seletor de Tipo */}
      <div className="space-y-2">
        <Label>Tipo de Localização</Label>
        <Select
          value={tipo}
          onValueChange={(value) => handleTipoChange(value as LocalizacaoTipo)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="raio">Raio (km)</SelectItem>
            <SelectItem value="poligono">Polígono</SelectItem>
            <SelectItem value="cidade">Cidade</SelectItem>
            <SelectItem value="estado">Estado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Busca de Endereço com Autocomplete (apenas para raio e polígono) */}
      {(tipo === 'raio' || tipo === 'poligono') && (
        <div className="space-y-2">
          <Label>Buscar Endereço</Label>
          <AddressAutocomplete
            value={buscaEndereco}
            onSelect={(address) => {
              setCentro([address.lat, address.lng])
              setBuscaEndereco(address.display_name)
              if (mapRef.current) {
                mapRef.current.setView([address.lat, address.lng], 15)
              }
              // Atualizar onChange
              onChangeRef.current({
                tipo,
                centro_latitude: address.lat,
                centro_longitude: address.lng,
                raio_km: tipo === 'raio' ? raio : undefined,
              })
            }}
            placeholder="Digite um endereço..."
            disabled={readOnly}
          />
        </div>
      )}

      {/* Mapa (apenas para raio e polígono) */}
      {(tipo === 'raio' || tipo === 'poligono') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Selecione a Área no Mapa</CardTitle>
            <CardDescription>
              {tipo === 'raio'
                ? 'Clique no mapa para definir o centro e ajuste o raio abaixo'
                : 'Clique no mapa para adicionar pontos do polígono'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <MapContainer
                center={centro}
                zoom={13}
                style={{ height: '400px', width: '100%', zIndex: 0 }}
                whenCreated={(map) => {
                  mapRef.current = map
                  map.on('click', handleMapClick)
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={centro} />
                
                {/* Marcador central */}
                {tipo === 'raio' && centro && (
                  <Marker position={centro} />
                )}
                
                {/* Círculo de raio */}
                {tipo === 'raio' && centro && raio && (
                  <Circle
                    center={centro}
                    radius={raio * 1000} // Converter km para metros
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                  />
                )}
                
                {/* Polígono */}
                {tipo === 'poligono' && poligono.length > 0 && (
                  <Polygon
                    positions={poligono}
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }}
                  />
                )}
                
                {/* Marcadores dos pontos do polígono */}
                {tipo === 'poligono' &&
                  poligono.map((point, index) => (
                    <Marker key={`polygon-point-${index}-${point[0]}-${point[1]}`} position={point} />
                  ))}
              </MapContainer>
              
              {/* Controles do polígono */}
              {tipo === 'poligono' && !readOnly && (
                <div className="absolute top-2 right-2 bg-background p-2 rounded-lg shadow-lg space-y-2 z-[1000]">
                  <Button
                    type="button"
                    size="sm"
                    variant={modoDesenho ? 'default' : 'outline'}
                    onClick={() => setModoDesenho(!modoDesenho)}
                  >
                    {modoDesenho ? 'Parar Desenho' : 'Iniciar Desenho'}
                  </Button>
                  {poligono.length > 0 && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRemoverUltimoPonto}
                      >
                        Remover Último
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={handleLimparPoligono}
                      >
                        Limpar
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Informações */}
            {tipo === 'raio' && centro && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Centro: {centro[0].toFixed(6)}, {centro[1].toFixed(6)}
                </p>
                <p>Raio: {raio} km</p>
              </div>
            )}
            
            {tipo === 'poligono' && poligono.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Pontos: {poligono.length}</p>
                {poligono.length < 3 && (
                  <p className="text-yellow-600">
                    Adicione pelo menos 3 pontos para formar um polígono
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!readOnly && (
        <div className="text-sm text-muted-foreground space-y-1">
          {tipo === 'raio' && (
            <>
              <p>• Clique no mapa para definir o centro</p>
              <p>• Use o controle abaixo para ajustar o raio</p>
            </>
          )}
          {tipo === 'poligono' && (
            <>
              <p>• Clique em "Iniciar Desenho" para começar</p>
              <p>• Clique no mapa para adicionar pontos</p>
              <p>• Mínimo de 3 pontos para formar um polígono</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

