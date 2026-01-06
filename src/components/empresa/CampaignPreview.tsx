import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  MapPin, 
  DollarSign, 
  Calendar, 
  Target, 
  Users, 
  Eye, 
  MousePointerClick,
  TrendingUp,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { LocationPreview } from './LocationPreview'
import type { LocalizacaoTipo } from '@/types/database'

interface CampaignPreviewProps {
  // Dados básicos
  titulo?: string
  descricao?: string
  orcamento?: number
  data_inicio?: string
  data_fim?: string
  
  // Localização
  localizacao_tipo?: LocalizacaoTipo
  raio_km?: number
  centro_latitude?: number
  centro_longitude?: number
  poligono_coordenadas?: Array<[number, number]>
  cidades?: string[]
  estados?: string[]
  
  // Nicho
  nicho?: string
  categorias?: string[]
  
  // Público-alvo
  publico_alvo?: {
    idade_min?: number
    idade_max?: number
    genero?: string[]
    interesses?: string[]
  }
  dias_semana?: number[]
  
  // Objetivos
  objetivo_principal?: string
  estrategia?: string
  
  // UI
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function CampaignPreview({
  titulo,
  descricao,
  orcamento,
  data_inicio,
  data_fim,
  localizacao_tipo,
  raio_km,
  centro_latitude,
  centro_longitude,
  poligono_coordenadas,
  cidades,
  estados,
  nicho,
  categorias,
  publico_alvo,
  dias_semana,
  objetivo_principal,
  estrategia,
  collapsed = false,
  onToggle,
  className,
}: CampaignPreviewProps) {
  // Calcular estimativas
  const estimativas = useMemo(() => {
    // Estimativa básica de alcance (pessoas/km²)
    const densidadeMedia = 5000 // pessoas por km² (média urbana Brasil)
    let areaKm2 = 0
    
    if (localizacao_tipo === 'raio' && raio_km) {
      areaKm2 = Math.PI * raio_km * raio_km
    } else if (localizacao_tipo === 'poligono' && poligono_coordenadas && poligono_coordenadas.length >= 3) {
      // Cálculo simplificado de área de polígono
      let area = 0
      for (let i = 0; i < poligono_coordenadas.length; i++) {
        const j = (i + 1) % poligono_coordenadas.length
        area += poligono_coordenadas[i][0] * poligono_coordenadas[j][1]
        area -= poligono_coordenadas[j][0] * poligono_coordenadas[i][1]
      }
      areaKm2 = Math.abs(area) * 0.5 * 111 * 111 / 1000000
    }
    
    const alcanceEstimado = Math.round(areaKm2 * densidadeMedia)
    const impressoesEstimadas = alcanceEstimado * 3 // 3 impressões por pessoa em média
    const cpmEstimado = orcamento && impressoesEstimadas > 0 
      ? (orcamento / impressoesEstimadas) * 1000 
      : 0
    
    return {
      areaKm2: areaKm2.toFixed(2),
      alcanceEstimado,
      impressoesEstimadas,
      cpmEstimado: cpmEstimado.toFixed(2),
    }
  }, [localizacao_tipo, raio_km, poligono_coordenadas, orcamento])

  // Calcular duração em dias
  const duracaoDias = useMemo(() => {
    if (!data_inicio || !data_fim) return 0
    const inicio = new Date(data_inicio)
    const fim = new Date(data_fim)
    const diffTime = Math.abs(fim.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [data_inicio, data_fim])

  // Se não tem onToggle, renderiza como componente inline (dentro do card)
  const isInline = !onToggle

  if (collapsed && !isInline) {
    return (
      <div className={cn("fixed right-0 top-1/2 -translate-y-1/2 z-40", className)}>
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="rounded-l-lg rounded-r-none shadow-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const previewContent = (
    <div className={cn("space-y-4", isInline ? "" : "p-4")}>
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Título</p>
                <p className="text-sm font-medium">{titulo || 'Sem título'}</p>
              </div>
              {descricao && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-xs line-clamp-3">{descricao}</p>
                </div>
              )}
              {orcamento && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Orçamento</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(orcamento)}</span>
                </div>
              )}
              {(data_inicio || data_fim) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Duração</span>
                  </div>
                  <span className="text-sm">
                    {duracaoDias} dia{duracaoDias !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Localização */}
          {localizacao_tipo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LocationPreview
                  tipo={localizacao_tipo}
                  raio_km={raio_km}
                  centro_latitude={centro_latitude}
                  centro_longitude={centro_longitude}
                  poligono_coordenadas={poligono_coordenadas}
                  cidades={cidades}
                  estados={estados}
                  readOnly
                  className="border-0 shadow-none"
                />
              </CardContent>
            </Card>
          )}

          {/* Nicho */}
          {(nicho || (categorias && categorias.length > 0)) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nicho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {nicho && (
                  <Badge variant="secondary">{nicho}</Badge>
                )}
                {categorias && categorias.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {categorias.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Público-Alvo */}
          {publico_alvo && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Público-Alvo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {publico_alvo.idade_min && publico_alvo.idade_max && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Idade</span>
                    <span>{publico_alvo.idade_min} - {publico_alvo.idade_max} anos</span>
                  </div>
                )}
                {publico_alvo.genero && publico_alvo.genero.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Gênero</p>
                    <div className="flex flex-wrap gap-1">
                      {publico_alvo.genero.map((g) => (
                        <Badge key={g} variant="outline" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {dias_semana && dias_semana.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dias da Semana</p>
                    <div className="flex flex-wrap gap-1">
                      {dias_semana.map((dia) => (
                        <Badge key={dia} variant="outline" className="text-xs">
                          {DIAS_SEMANA[dia]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Objetivos */}
          {(objetivo_principal || estrategia) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Objetivos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {objetivo_principal && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Objetivo Principal</span>
                    <Badge variant="secondary" className="capitalize">
                      {objetivo_principal}
                    </Badge>
                  </div>
                )}
                {estrategia && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estratégia</span>
                    <Badge variant="outline" className="uppercase">
                      {estrategia}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estatísticas Estimadas */}
          {estimativas.alcanceEstimado > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Estatísticas Estimadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Alcance Estimado</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {estimativas.alcanceEstimado.toLocaleString('pt-BR')} pessoas
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Impressões Estimadas</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {estimativas.impressoesEstimadas.toLocaleString('pt-BR')}
                  </span>
                </div>
                {orcamento && estimativas.cpmEstimado !== '0.00' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">CPM Estimado</span>
                    </div>
                    <span className="text-sm font-semibold">
                      R$ {estimativas.cpmEstimado}
                    </span>
                  </div>
                )}
                {estimativas.areaKm2 !== '0.00' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Área de Cobertura</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {estimativas.areaKm2} km²
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
    </div>
  )

  if (isInline) {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview da Campanha
          </CardTitle>
          <CardDescription>Atualização em tempo real</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            {previewContent}
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("fixed right-0 top-0 h-screen w-96 bg-background border-l shadow-xl z-40 flex flex-col", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Preview da Campanha</h3>
          <p className="text-xs text-muted-foreground">Atualização em tempo real</p>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {previewContent}
      </ScrollArea>
    </div>
  )
}

