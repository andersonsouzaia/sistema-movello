import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, RefreshCw, Eye } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters'
import type { Pagamento, Repasse, PagamentoStatus, RepasseStatus } from '@/types/database'

interface PaymentCardProps {
  payment?: Pagamento
  repasse?: Repasse
  onProcess?: (id: string) => void
  onRetry?: (id: string) => void
  onView?: (id: string) => void
}

const paymentStatusConfig: Record<PagamentoStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  processando: { label: 'Processando', variant: 'default' },
  pago: { label: 'Pago', variant: 'default' },
  falhou: { label: 'Falhou', variant: 'destructive' },
  cancelado: { label: 'Cancelado', variant: 'secondary' },
  reembolsado: { label: 'Reembolsado', variant: 'secondary' },
}

const repasseStatusConfig: Record<RepasseStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  pendente: { label: 'Pendente', variant: 'secondary' },
  processando: { label: 'Processando', variant: 'default' },
  pago: { label: 'Pago', variant: 'default' },
  falhou: { label: 'Falhou', variant: 'destructive' },
}

export function PaymentCard({ payment, repasse, onProcess, onRetry, onView }: PaymentCardProps) {
  const item = payment || repasse
  const isPayment = !!payment
  const statusConfig = isPayment ? paymentStatusConfig : repasseStatusConfig
  const status = item ? statusConfig[item.status as PagamentoStatus | RepasseStatus] : null

  if (!item) return null

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">
            {isPayment ? 'Pagamento' : 'Repasse'} #{item.id.slice(0, 8)}
          </CardTitle>
          {status && <Badge variant={status.variant}>{status.label}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Valor:</span>
              <p className="font-medium">{formatCurrency(isPayment ? item.valor : item.valor_liquido)}</p>
            </div>
            {item.taxa_comissao > 0 && (
              <div>
                <span className="text-muted-foreground">Taxa:</span>
                <p className="font-medium">{item.taxa_comissao}%</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Criado em:</span>
              <p className="font-medium">{formatDateTime(item.criado_em)}</p>
            </div>
            {item.processado_em && (
              <div>
                <span className="text-muted-foreground">Processado em:</span>
                <p className="font-medium">{formatDateTime(item.processado_em)}</p>
              </div>
            )}
          </div>
          {item.erro_mensagem && (
            <div className="p-2 bg-destructive/10 text-destructive text-sm rounded">
              {item.erro_mensagem}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(item.id)}>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            )}
            {(item.status === 'pendente' || item.status === 'processando') && onProcess && (
              <Button variant="default" size="sm" onClick={() => onProcess(item.id)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Processar
              </Button>
            )}
            {item.status === 'falhou' && onRetry && (
              <Button variant="outline" size="sm" onClick={() => onRetry(item.id)}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reprocessar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

