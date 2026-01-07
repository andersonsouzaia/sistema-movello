import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Clock, 
  Star, 
  MapPin, 
  Search, 
  X, 
  Trash2,
  Circle as CircleIcon,
  Navigation2
} from 'lucide-react'
import { useLocationHistory, type LocationHistoryItem } from '@/hooks/useLocationHistory'
import { cn } from '@/lib/utils'
import { formatarCoordenadas } from '@/utils/geocoding'

interface LocationHistoryProps {
  onSelect: (item: LocationHistoryItem) => void
  className?: string
}

export function LocationHistory({ onSelect, className }: LocationHistoryProps) {
  const { history, favorites, recent, toggleFavorite, removeFromHistory, clearHistory } = useLocationHistory()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredHistory = history.filter(item => 
    item.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFavorites = favorites.filter(item =>
    item.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredRecent = recent.filter(item =>
    item.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getLocationTypeIcon = (tipo?: string) => {
    switch (tipo) {
      case 'raio':
        return <CircleIcon className="h-3 w-3" />
      case 'poligono':
        return <Navigation2 className="h-3 w-3" />
      default:
        return <MapPin className="h-3 w-3" />
    }
  }

  const getLocationTypeLabel = (tipo?: string) => {
    switch (tipo) {
      case 'raio':
        return 'Raio'
      case 'poligono':
        return 'Polígono'
      case 'cidade':
        return 'Cidade'
      case 'estado':
        return 'Estado'
      default:
        return 'Localização'
    }
  }

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Histórico de Localizações
            </CardTitle>
            <CardDescription className="mt-1">
              Acesse rapidamente localizações usadas anteriormente
            </CardDescription>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {/* Favoritos */}
            {filteredFavorites.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <h4 className="text-sm font-semibold">Favoritos</h4>
                </div>
                <div className="space-y-1">
                  {filteredFavorites.map((item, index) => (
                    <LocationHistoryItem
                      key={`favorite-${index}-${item.timestamp}`}
                      item={item}
                      onSelect={onSelect}
                      onToggleFavorite={toggleFavorite}
                      onRemove={removeFromHistory}
                      getLocationTypeIcon={getLocationTypeIcon}
                      getLocationTypeLabel={getLocationTypeLabel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recentes */}
            {filteredRecent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Recentes</h4>
                </div>
                <div className="space-y-1">
                  {filteredRecent.map((item, index) => (
                    <LocationHistoryItem
                      key={`recent-${index}-${item.timestamp}`}
                      item={item}
                      onSelect={onSelect}
                      onToggleFavorite={toggleFavorite}
                      onRemove={removeFromHistory}
                      getLocationTypeIcon={getLocationTypeIcon}
                      getLocationTypeLabel={getLocationTypeLabel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sem resultados */}
            {filteredHistory.length === 0 && (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma localização no histórico'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface LocationHistoryItemProps {
  item: LocationHistoryItem
  onSelect: (item: LocationHistoryItem) => void
  onToggleFavorite: (displayName: string) => void
  onRemove: (displayName: string) => void
  getLocationTypeIcon: (tipo?: string) => React.ReactNode
  getLocationTypeLabel: (tipo?: string) => string
}

function LocationHistoryItem({
  item,
  onSelect,
  onToggleFavorite,
  onRemove,
  getLocationTypeIcon,
  getLocationTypeLabel,
}: LocationHistoryItemProps) {
  return (
    <div className="group flex items-start gap-2 p-2 rounded-lg border border-border hover:bg-accent transition-colors">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="flex-1 text-left space-y-1"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.display_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {getLocationTypeIcon(item.localizacao_tipo)}
                <span className="ml-1">{getLocationTypeLabel(item.localizacao_tipo)}</span>
              </Badge>
              {item.raio_km && (
                <span className="text-xs text-muted-foreground">
                  {item.raio_km} km
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatarCoordenadas(item.lat, item.lng)}
            </p>
          </div>
        </div>
      </button>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(item.display_name)
          }}
        >
          <Star className={cn(
            "h-3 w-3",
            item.is_favorite && "fill-yellow-500 text-yellow-500"
          )} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(item.display_name)
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}


