import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  MapPin, 
  Star, 
  Plus, 
  Edit, 
  Trash2,
  Share2,
  Circle as CircleIcon,
  Navigation2
} from 'lucide-react'
import { locationTemplateService, type LocationTemplate } from '@/services/locationTemplateService'
import { useLocationHistory } from '@/hooks/useLocationHistory'
import { cn } from '@/lib/utils'
import { formatarCoordenadas } from '@/utils/geocoding'
import type { LocalizacaoTipo } from '@/types/database'

interface LocationTemplatesProps {
  onSelectTemplate: (template: LocationTemplate) => void
  currentLocation?: {
    tipo: LocalizacaoTipo
    raio_km?: number
    centro_latitude?: number
    centro_longitude?: number
    poligono_coordenadas?: Array<[number, number]>
    cidades?: string[]
    estados?: string[]
  }
  className?: string
}

export function LocationTemplates({
  onSelectTemplate,
  currentLocation,
  className,
}: LocationTemplatesProps) {
  const [templates, setTemplates] = useState<LocationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LocationTemplate | null>(null)
  const { addToHistory } = useLocationHistory()

  // Formulário
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [isFavorito, setIsFavorito] = useState(false)
  const [compartilhado, setCompartilhado] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await locationTemplateService.listTemplates(true)
      setTemplates(data)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromCurrent = () => {
    if (!currentLocation) return

    setEditingTemplate(null)
    setNome('')
    setDescricao('')
    setIsFavorito(false)
    setCompartilhado(false)
    setDialogOpen(true)
  }

  const handleSaveTemplate = async () => {
    if (!nome.trim() || !currentLocation) return

    try {
      await locationTemplateService.createTemplate({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        localizacao_tipo: currentLocation.tipo,
        raio_km: currentLocation.raio_km,
        centro_latitude: currentLocation.centro_latitude,
        centro_longitude: currentLocation.centro_longitude,
        poligono_coordenadas: currentLocation.poligono_coordenadas,
        cidades: currentLocation.cidades,
        estados: currentLocation.estados,
        is_favorito: isFavorito,
        compartilhado: compartilhado,
      })

      setDialogOpen(false)
      loadTemplates()
    } catch (error) {
      console.error('Erro ao salvar template:', error)
    }
  }

  const handleToggleFavorite = async (templateId: string) => {
    try {
      await locationTemplateService.toggleFavorite(templateId)
      loadTemplates()
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return

    try {
      await locationTemplateService.deleteTemplate(templateId)
      loadTemplates()
    } catch (error) {
      console.error('Erro ao deletar template:', error)
    }
  }

  const handleSelect = (template: LocationTemplate) => {
    onSelectTemplate(template)
    
    // Adicionar ao histórico
    if (template.centro_latitude && template.centro_longitude) {
      addToHistory({
        display_name: template.nome,
        lat: template.centro_latitude,
        lng: template.centro_longitude,
        localizacao_tipo: template.localizacao_tipo,
        raio_km: template.raio_km,
        poligono_coordenadas: template.poligono_coordenadas,
        cidades: template.cidades,
        estados: template.estados,
      })
    }
  }

  const getLocationTypeIcon = (tipo: LocalizacaoTipo) => {
    switch (tipo) {
      case 'raio':
        return <CircleIcon className="h-3 w-3" />
      case 'poligono':
        return <Navigation2 className="h-3 w-3" />
      default:
        return <MapPin className="h-3 w-3" />
    }
  }

  const favorites = templates.filter(t => t.is_favorito)
  const others = templates.filter(t => !t.is_favorito)

  return (
    <>
      <Card className={cn("card-premium", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Templates de Localização
              </CardTitle>
              <CardDescription className="mt-1">
                Salve e reutilize localizações favoritas
              </CardDescription>
            </div>
            {currentLocation && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={handleCreateFromCurrent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Salvar Atual
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Template de Localização</DialogTitle>
                    <DialogDescription>
                      Salve a localização atual como template para reutilizar depois
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-nome">Nome *</Label>
                      <Input
                        id="template-nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Ex: Centro de São Paulo - 5km"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="template-descricao">Descrição</Label>
                      <Textarea
                        id="template-descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descrição opcional do template..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="template-favorito">Marcar como favorito</Label>
                      <Switch
                        id="template-favorito"
                        checked={isFavorito}
                        onCheckedChange={setIsFavorito}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="template-compartilhado">Compartilhar com equipe</Label>
                        <p className="text-xs text-muted-foreground">
                          Outros usuários da empresa poderão usar este template
                        </p>
                      </div>
                      <Switch
                        id="template-compartilhado"
                        checked={compartilhado}
                        onCheckedChange={setCompartilhado}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveTemplate} disabled={!nome.trim()}>
                      Salvar Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Carregando templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum template salvo ainda
              </p>
              {currentLocation && (
                <Button variant="outline" onClick={handleCreateFromCurrent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {/* Favoritos */}
                {favorites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <h4 className="text-sm font-semibold">Favoritos</h4>
                    </div>
                    <div className="space-y-1">
                      {favorites.map((template) => (
                        <TemplateItem
                          key={template.id}
                          template={template}
                          onSelect={handleSelect}
                          onToggleFavorite={handleToggleFavorite}
                          onDelete={handleDelete}
                          getLocationTypeIcon={getLocationTypeIcon}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Outros */}
                {others.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Todos os Templates</h4>
                    <div className="space-y-1">
                      {others.map((template) => (
                        <TemplateItem
                          key={template.id}
                          template={template}
                          onSelect={handleSelect}
                          onToggleFavorite={handleToggleFavorite}
                          onDelete={handleDelete}
                          getLocationTypeIcon={getLocationTypeIcon}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  )
}

interface TemplateItemProps {
  template: LocationTemplate
  onSelect: (template: LocationTemplate) => void
  onToggleFavorite: (templateId: string) => void
  onDelete: (templateId: string) => void
  getLocationTypeIcon: (tipo: LocalizacaoTipo) => React.ReactNode
}

function TemplateItem({
  template,
  onSelect,
  onToggleFavorite,
  onDelete,
  getLocationTypeIcon,
}: TemplateItemProps) {
  return (
    <div className="group flex items-start gap-2 p-3 rounded-lg border border-border hover:bg-accent transition-colors">
      <button
        type="button"
        onClick={() => onSelect(template)}
        className="flex-1 text-left space-y-1"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{template.nome}</p>
              {template.compartilhado && (
                <Badge variant="outline" className="text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartilhado
                </Badge>
              )}
            </div>
            {template.descricao && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {template.descricao}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {getLocationTypeIcon(template.localizacao_tipo)}
                <span className="ml-1 capitalize">{template.localizacao_tipo}</span>
              </Badge>
              {template.raio_km && (
                <span className="text-xs text-muted-foreground">
                  {template.raio_km} km
                </span>
              )}
              {template.centro_latitude && template.centro_longitude && (
                <span className="text-xs text-muted-foreground">
                  {formatarCoordenadas(template.centro_latitude, template.centro_longitude)}
                </span>
              )}
            </div>
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
            onToggleFavorite(template.id)
          }}
        >
          <Star className={cn(
            "h-3 w-3",
            template.is_favorito && "fill-yellow-500 text-yellow-500"
          )} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(template.id)
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

