import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils/formatters'
import type { TicketWithDetails, TicketComentario } from '@/types/database'
import { CheckCircle, XCircle, User, MessageSquare, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimelineEvent {
  id: string
  type: 'created' | 'assigned' | 'resolved' | 'closed' | 'comment' | 'status_change'
  title: string
  description: string
  timestamp: string
  user?: { id: string; nome: string }
}

interface TicketTimelineProps {
  ticket: TicketWithDetails
  comments?: TicketComentario[]
}

const eventIcons = {
  created: Clock,
  assigned: User,
  resolved: CheckCircle,
  closed: XCircle,
  comment: MessageSquare,
  status_change: Clock,
}

const eventColors = {
  created: 'text-blue-500',
  assigned: 'text-purple-500',
  resolved: 'text-green-500',
  closed: 'text-gray-500',
  comment: 'text-yellow-500',
  status_change: 'text-orange-500',
}

export function TicketTimeline({ ticket, comments = [] }: TicketTimelineProps) {
  const events: TimelineEvent[] = []

  // Evento de criação
  events.push({
    id: 'created',
    type: 'created',
    title: 'Ticket criado',
    description: `Ticket criado por ${ticket.criado_por_user?.nome || 'Usuário desconhecido'}`,
    timestamp: ticket.criado_em,
    user: ticket.criado_por_user,
  })

  // Evento de atribuição
  if (ticket.atribuido_a && ticket.atribuido) {
    events.push({
      id: 'assigned',
      type: 'assigned',
      title: 'Ticket atribuído',
      description: `Atribuído a ${ticket.atribuido.nome}`,
      timestamp: ticket.atualizado_em || ticket.criado_em,
      user: ticket.atribuido,
    })
  }

  // Evento de resolução
  if (ticket.resolvido_em && ticket.resolvido_por_user) {
    events.push({
      id: 'resolved',
      type: 'resolved',
      title: 'Ticket resolvido',
      description: `Resolvido por ${ticket.resolvido_por_user.nome}`,
      timestamp: ticket.resolvido_em,
      user: ticket.resolvido_por_user,
    })
  }

  // Eventos de comentários
  comments.forEach((comment) => {
    events.push({
      id: `comment-${comment.id}`,
      type: 'comment',
      title: comment.interno ? 'Comentário interno adicionado' : 'Comentário adicionado',
      description: comment.comentario.substring(0, 100) + (comment.comentario.length > 100 ? '...' : ''),
      timestamp: comment.criado_em,
      user: comment.user,
    })
  })

  // Ordenar eventos por timestamp
  events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline do Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {events.map((event, index) => {
            const Icon = eventIcons[event.type]
            const isLast = index === events.length - 1

            return (
              <div key={event.id} className="relative flex gap-4 pb-6">
                {/* Linha vertical */}
                {!isLast && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                )}

                {/* Ícone */}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background',
                    eventColors[event.type]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{event.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  {event.user && (
                    <Badge variant="outline" className="text-xs">
                      {event.user.nome}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

