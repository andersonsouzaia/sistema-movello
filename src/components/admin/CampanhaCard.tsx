import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Pause, Play, Eye } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/formatters'
import type { CampanhaWithEmpresa, CampanhaStatus } from '@/types/database'
import { cn } from '@/lib/utils'

interface CampanhaCardProps {
  campanha: CampanhaWithEmpresa
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onPause?: (id: string) => void
  onActivate?: (id: string) => void
  onView?: (id: string) => void
}

const statusConfig: Record<CampanhaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
  ativa: { label: 'Ativa', variant: 'default' },
  pausada: { label: 'Pausada', variant: 'secondary' },
  finalizada: { label: 'Finalizada', variant: 'secondary' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
}

export function CampanhaCard({
  campanha,
  onApprove,
  onReject,
  onPause,
  onActivate,
  onView,
}: CampanhaCardProps) {
  const status = statusConfig[campanha.status]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{campanha.titulo}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campanha.descricao}</p>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Empresa:</span>
              <p className="font-medium">{campanha.empresa?.razao_social || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Orçamento:</span>
              <p className="font-medium">{formatCurrency(campanha.orcamento)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Período:</span>
              <p className="font-medium">
                {formatDate(campanha.data_inicio)} - {formatDate(campanha.data_fim)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Utilizado:</span>
              <p className="font-medium">{formatCurrency(campanha.orcamento_utilizado)}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(campanha.id)}>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            )}
            {campanha.status === 'em_analise' && (
              <>
                {onApprove && (
                  <Button variant="default" size="sm" onClick={() => onApprove(campanha.id)}>
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                )}
                {onReject && (
                  <Button variant="destructive" size="sm" onClick={() => onReject(campanha.id)}>
                    <X className="h-4 w-4 mr-1" />
                    Reprovar
                  </Button>
                )}
              </>
            )}
            {campanha.status === 'aprovada' && onActivate && (
              <Button variant="default" size="sm" onClick={() => onActivate(campanha.id)}>
                <Play className="h-4 w-4 mr-1" />
                Ativar
              </Button>
            )}
            {(campanha.status === 'ativa' || campanha.status === 'aprovada') && onPause && (
              <Button variant="outline" size="sm" onClick={() => onPause(campanha.id)}>
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

