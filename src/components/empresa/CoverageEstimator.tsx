import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Eye, 
  MousePointerClick, 
  MapPin,
  TrendingUp,
  Info
} from 'lucide-react'
import { estimarCobertura } from '@/utils/coverageEstimator'
import { formatCurrency } from '@/lib/utils/formatters'
import type { LocalizacaoTipo } from '@/types/database'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CoverageEstimatorProps {
  tipo: LocalizacaoTipo
  raio_km?: number
  poligono_coordenadas?: Array<[number, number]>
  centro_latitude?: number
  centro_longitude?: number
  cidades?: string[]
  estados?: string[]
  orcamento?: number
  className?: string
}

export function CoverageEstimator({
  tipo,
  raio_km,
  poligono_coordenadas,
  centro_latitude,
  centro_longitude,
  cidades,
  estados,
  orcamento,
  className,
}: CoverageEstimatorProps) {
  const estimativa = useMemo(() => {
    return estimarCobertura(
      tipo,
      raio_km,
      poligono_coordenadas,
      centro_latitude,
      centro_longitude,
      cidades,
      estados,
      orcamento
    )
  }, [tipo, raio_km, poligono_coordenadas, centro_latitude, centro_longitude, cidades, estados, orcamento])

  if (estimativa.areaKm2 === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Estimativa de Cobertura
          </CardTitle>
          <CardDescription>
            Configure a localização para ver estimativas
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Estimativa de Cobertura
            </CardTitle>
            <CardDescription>
              Projeções baseadas em densidade populacional média
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  As estimativas são baseadas em densidade populacional média e podem variar
                  conforme a região específica. Valores reais podem diferir.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Área de Cobertura */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Área</span>
            </div>
            <p className="text-lg font-semibold">
              {estimativa.areaKm2.toLocaleString('pt-BR')} km²
            </p>
          </div>

          {/* Alcance Estimado */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Alcance</span>
            </div>
            <p className="text-lg font-semibold">
              {estimativa.alcanceEstimado.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">pessoas</p>
          </div>

          {/* Impressões Estimadas */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>Impressões</span>
            </div>
            <p className="text-lg font-semibold">
              {estimativa.impressoesEstimadas.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground">estimadas</p>
          </div>

          {/* CPM Estimado */}
          {orcamento && estimativa.cpmEstimado > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MousePointerClick className="h-4 w-4" />
                <span>CPM</span>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(estimativa.cpmEstimado)}
              </p>
              <p className="text-xs text-muted-foreground">por mil</p>
            </div>
          )}
        </div>

        {/* Densidade Populacional */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Densidade Populacional</span>
            <Badge variant="outline" className="text-xs">
              {estimativa.densidadePopulacional.toLocaleString('pt-BR')} pessoas/km²
            </Badge>
          </div>
        </div>

        {/* Aviso */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Nota:</strong> Estas são estimativas baseadas em dados médios. 
            Os valores reais podem variar conforme a região específica e outros fatores.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

