import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Eye, Edit, Pause, Play, AlertCircle, Calendar, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import type { CampanhaWithEmpresa, CampanhaStatus } from '@/types/database'
import { useNavigate } from 'react-router-dom'

const statusConfig: Record<CampanhaStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  em_analise: { label: 'Em Análise', variant: 'secondary' },
  aprovada: { label: 'Aprovada', variant: 'default' },
  reprovada: { label: 'Reprovada', variant: 'destructive' },
  ativa: { label: 'Ativa', variant: 'default' },
  pausada: { label: 'Pausada', variant: 'secondary' },
  finalizada: { label: 'Finalizada', variant: 'secondary' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
}

interface CampanhaCardProps {
  campanha: CampanhaWithEmpresa
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onPause?: (id: string) => void
  onActivate?: (id: string) => void
  className?: string
}

export function CampanhaCard({
  campanha,
  onView,
  onEdit,
  onPause,
  onActivate,
  className,
}: CampanhaCardProps) {
  const navigate = useNavigate()
  const status = statusConfig[campanha.status]
  const progressoOrcamento = campanha.orcamento > 0
    ? Math.min((campanha.orcamento_utilizado / campanha.orcamento) * 100, 100)
    : 0

  const podeEditar = campanha.status === 'em_analise' || campanha.status === 'reprovada'
  const podePausar = campanha.status === 'ativa'
  const podeAtivar = campanha.status === 'pausada'

  const saldoDisponivel = campanha.orcamento - (campanha.orcamento_utilizado || 0)
  const isRascunho = campanha.is_rascunho
  const temSaldoInsuficiente = campanha.saldo_insuficiente

  return (
    <Card className={cn(
      "card-premium hover:shadow-xl transition-all duration-300 cursor-pointer group",
      className
    )}
    onClick={() => onView ? onView(campanha.id) : navigate(`/empresa/campanhas/${campanha.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {campanha.titulo}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm">
              {campanha.descricao || 'Sem descrição'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
            {isRascunho && (
              <Badge variant="outline" className="text-xs">
                Rascunho
              </Badge>
            )}
            {temSaldoInsuficiente && (
              <Badge variant="destructive" className="text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Saldo Insuficiente
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações Financeiras */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Orçamento</span>
            </div>
            <p className="font-semibold text-base">{formatCurrency(campanha.orcamento)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Utilizado</span>
              <span className="font-medium">
                {formatCurrency(campanha.orcamento_utilizado || 0)} ({progressoOrcamento.toFixed(1)}%)
              </span>
            </div>
            <Progress 
              value={progressoOrcamento} 
              className={cn(
                "h-2",
                progressoOrcamento > 80 ? "bg-destructive" : progressoOrcamento > 50 ? "bg-yellow-500" : ""
              )}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Saldo Disponível</span>
            <span className={cn(
              "font-bold text-base",
              saldoDisponivel < 100 ? "text-yellow-500" : "text-primary"
            )}>
              {formatCurrency(saldoDisponivel)}
            </span>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>Início</span>
            </div>
            <p className="font-medium text-sm">{formatDate(campanha.data_inicio)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>Fim</span>
            </div>
            <p className="font-medium text-sm">{formatDate(campanha.data_fim)}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView ? onView(campanha.id) : navigate(`/empresa/campanhas/${campanha.id}`)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          {isRascunho && !temSaldoInsuficiente && onActivate && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onActivate(campanha.id)}
            >
              <Play className="h-4 w-4 mr-1" />
              Ativar
            </Button>
          )}
          {podeEditar && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit ? onEdit(campanha.id) : navigate(`/empresa/campanhas/${campanha.id}`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}
          {podePausar && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onPause?.(campanha.id)}
            >
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </Button>
          )}
          {podeAtivar && !isRascunho && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onActivate?.(campanha.id)}
            >
              <Play className="h-4 w-4 mr-1" />
              Ativar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

