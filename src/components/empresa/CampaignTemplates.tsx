import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  FileText, 
  Search, 
  Star,
  TrendingUp,
  Users,
  Sparkles
} from 'lucide-react'
import { campaignTemplateService } from '@/services/campaignTemplateService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ObjetivoPrincipal } from '@/types/database'

export interface CampaignTemplate {
  id: string
  nome: string
  descricao?: string
  nicho?: string
  objetivo_principal?: ObjetivoPrincipal
  categoria?: string
  is_sistema: boolean
  compartilhado: boolean
  dados_template: any
  uso_count: number
  rating: number
  criado_em: string
}

interface CampaignTemplatesProps {
  onSelectTemplate: (template: CampaignTemplate) => void
  className?: string
}

export function CampaignTemplates({
  onSelectTemplate,
  className,
}: CampaignTemplatesProps) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtroNicho, setFiltroNicho] = useState<string>('all')
  const [filtroObjetivo, setFiltroObjetivo] = useState<string>('all')

  useEffect(() => {
    loadTemplates()
  }, [filtroNicho, filtroObjetivo])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await campaignTemplateService.listTemplates({
        nicho: filtroNicho === 'all' ? undefined : filtroNicho,
        objetivo: filtroObjetivo === 'all' ? undefined : filtroObjetivo,
        categoria: undefined,
        includeSistema: true,
        includeShared: true,
      })
      setTemplates(data)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      // Erro já é tratado no serviço
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = async (template: CampaignTemplate) => {
    // Incrementar uso (silencioso)
    await campaignTemplateService.incrementUsage(template.id)
    onSelectTemplate(template)
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.descricao?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const templatesSistema = filteredTemplates.filter(t => t.is_sistema)
  const templatesCompartilhados = filteredTemplates.filter(t => !t.is_sistema && t.compartilhado)
  const templatesProprios = filteredTemplates.filter(t => !t.is_sistema && !t.compartilhado)

  return (
    <Card className={cn("card-premium", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Templates de Campanha
        </CardTitle>
        <CardDescription>
          Use templates pré-configurados para criar campanhas rapidamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={filtroNicho} onValueChange={setFiltroNicho}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os nichos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nichos</SelectItem>
                <SelectItem value="restaurante">Restaurante</SelectItem>
                <SelectItem value="varejo">Varejo</SelectItem>
                <SelectItem value="servicos">Serviços</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
                <SelectItem value="educacao">Educação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroObjetivo} onValueChange={setFiltroObjetivo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os objetivos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os objetivos</SelectItem>
                <SelectItem value="awareness">Awareness</SelectItem>
                <SelectItem value="traffic">Tráfego</SelectItem>
                <SelectItem value="conversions">Conversões</SelectItem>
                <SelectItem value="engagement">Engajamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Carregando templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum template encontrado
            </p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            <div className="space-y-4">
              {/* Templates do Sistema */}
              {templatesSistema.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold">Templates do Sistema</h4>
                  </div>
                  <div className="space-y-2">
                    {templatesSistema.map((template) => (
                      <TemplateItem
                        key={template.id}
                        template={template}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Templates Compartilhados */}
              {templatesCompartilhados.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Compartilhados</h4>
                  </div>
                  <div className="space-y-2">
                    {templatesCompartilhados.map((template) => (
                      <TemplateItem
                        key={template.id}
                        template={template}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Templates Próprios */}
              {templatesProprios.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Meus Templates</h4>
                  <div className="space-y-2">
                    {templatesProprios.map((template) => (
                      <TemplateItem
                        key={template.id}
                        template={template}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface TemplateItemProps {
  template: CampaignTemplate
  onSelect: (template: CampaignTemplate) => void
}

function TemplateItem({ template, onSelect }: TemplateItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className="w-full text-left p-4 rounded-lg border border-border hover:bg-accent transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium truncate">{template.nome}</h4>
            {template.is_sistema && (
              <Badge variant="secondary" className="text-xs">
                Sistema
              </Badge>
            )}
            {template.compartilhado && (
              <Badge variant="outline" className="text-xs">
                Compartilhado
              </Badge>
            )}
          </div>
          {template.descricao && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {template.descricao}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {template.nicho && (
              <Badge variant="outline" className="text-xs">
                {template.nicho}
              </Badge>
            )}
            {template.objetivo_principal && (
              <Badge variant="outline" className="text-xs capitalize">
                {template.objetivo_principal}
              </Badge>
            )}
            {template.rating > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <span>{template.rating.toFixed(1)}</span>
              </div>
            )}
            {template.uso_count > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{template.uso_count} usos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

