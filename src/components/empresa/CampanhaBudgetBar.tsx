import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'

interface CampanhaBudgetBarProps {
  orcamento: number
  utilizado: number
  showValues?: boolean
  className?: string
}

export function CampanhaBudgetBar({
  orcamento,
  utilizado,
  showValues = true,
  className,
}: CampanhaBudgetBarProps) {
  const progresso = orcamento > 0 ? Math.min((utilizado / orcamento) * 100, 100) : 0
  const saldoDisponivel = orcamento - utilizado

  return (
    <div className={cn("space-y-2", className)}>
      {showValues && (
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-muted-foreground">Utilizado: </span>
            <span className="font-semibold">{formatCurrency(utilizado)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Disponível: </span>
            <span className={cn(
              "font-semibold",
              saldoDisponivel < 100 ? "text-yellow-500" : "text-primary"
            )}>
              {formatCurrency(saldoDisponivel)}
            </span>
          </div>
        </div>
      )}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">{progresso.toFixed(1)}%</span>
        </div>
        <Progress
          value={progresso}
          className={cn(
            "h-2",
            progresso > 80 && "bg-destructive",
            progresso > 50 && progresso <= 80 && "bg-yellow-500"
          )}
        />
      </div>
      {showValues && (
        <div className="text-xs text-muted-foreground">
          Total: {formatCurrency(orcamento)}
        </div>
      )}
    </div>
  )
}

