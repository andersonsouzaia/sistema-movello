import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Eye, User } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import type { TicketWithDetails, TicketStatus, TicketPrioridade } from '@/types/database'

interface TicketCardProps {
  ticket: TicketWithDetails
  onAssign?: (id: string) => void
  onResolve?: (id: string) => void
  onClose?: (id: string) => void
  onView?: (id: string) => void
}

const statusConfig: Record<TicketStatus, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  aberto: { label: 'Aberto', variant: 'secondary' },
  em_andamento: { label: 'Em Andamento', variant: 'default' },
  resolvido: { label: 'Resolvido', variant: 'default' },
  fechado: { label: 'Fechado', variant: 'secondary' },
}

const prioridadeConfig: Record<TicketPrioridade, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'bg-green-500' },
  media: { label: 'Média', color: 'bg-yellow-500' },
  alta: { label: 'Alta', color: 'bg-orange-500' },
  urgente: { label: 'Urgente', color: 'bg-red-500' },
}

export function TicketCard({ ticket, onAssign, onResolve, onClose, onView }: TicketCardProps) {
  const status = statusConfig[ticket.status]
  const prioridade = prioridadeConfig[ticket.prioridade]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">#{ticket.id.slice(0, 8)} - {ticket.titulo}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.descricao}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={status.variant}>{status.label}</Badge>
            <div className={`h-2 w-16 rounded-full ${prioridade.color}`} title={prioridade.label} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Criado em:</span>
              <p className="font-medium">{formatDateTime(ticket.criado_em)}</p>
            </div>
            {ticket.atribuido && (
              <div>
                <span className="text-muted-foreground">Atribuído a:</span>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {ticket.atribuido.nome}
                </p>
              </div>
            )}
          </div>
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ticket.tags.map((tag) => (
                <Badge key={tag.id} style={{ backgroundColor: tag.cor }} className="text-white">
                  {tag.nome}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {onView && (
              <Button variant="outline" size="sm" onClick={() => onView(ticket.id)}>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </Button>
            )}
            {ticket.status === 'aberto' && onAssign && (
              <Button variant="default" size="sm" onClick={() => onAssign(ticket.id)}>
                Atribuir
              </Button>
            )}
            {ticket.status === 'em_andamento' && onResolve && (
              <Button variant="default" size="sm" onClick={() => onResolve(ticket.id)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolver
              </Button>
            )}
            {ticket.status === 'resolvido' && onClose && (
              <Button variant="outline" size="sm" onClick={() => onClose(ticket.id)}>
                <XCircle className="h-4 w-4 mr-1" />
                Fechar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

