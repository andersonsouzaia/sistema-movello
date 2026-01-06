import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { useTicket, useTicketComments } from '@/hooks/useTickets'
import { ticketService } from '@/services/ticketService'
import { tagService } from '@/services/tagService'
import { useAuth } from '@/contexts/AuthContext'
import { TicketComments } from '@/components/admin/TicketComments'
import { TicketTimeline } from '@/components/admin/TicketTimeline'
import { TagSelector } from '@/components/admin/TagSelector'
import { ArrowLeft, CheckCircle, XCircle, User } from 'lucide-react'
import { formatDateTime } from '@/lib/utils/formatters'
import type { TicketStatus, TicketPrioridade, Tag } from '@/types/database'
import { toast } from 'sonner'

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

export default function AdminTicketDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { ticket, loading, refetch: refetchTicket } = useTicket(id || '')
  const { comments, loading: loadingComentarios, refetch: refetchComments } = useTicketComments(id || '')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])

  useEffect(() => {
    if (ticket?.tags) {
      setSelectedTags(ticket.tags)
    }
  }, [ticket])

  const handleAssign = async () => {
    if (!user?.id || !id) return
    const result = await ticketService.assignTicket(id, user.id)
    if (result.success) {
      refetchTicket()
    }
  }

  const handleResolve = async () => {
    if (!user?.id || !id) return
    const result = await ticketService.resolveTicket(id, user.id)
    if (result.success) {
      refetchTicket()
    }
  }

  const handleClose = async () => {
    if (!user?.id || !id) return
    const result = await ticketService.closeTicket(id, user.id)
    if (result.success) {
      navigate('/admin/suporte')
    }
  }

  const handleAddComment = async (
    comment: string,
    interno: boolean,
    anexos?: Array<{ url: string; nome: string }>
  ) => {
    if (!user?.id || !id) return
    const result = await ticketService.addComment(id, comment, user.id, anexos || [], interno)
    if (result.success) {
      refetchComments()
      refetchTicket()
    }
  }

  const handleTagsChange = async (tags: Tag[]) => {
    if (!id) return
    
    // Encontrar tags adicionadas e removidas
    const currentTagIds = selectedTags.map((t) => t.id)
    const newTagIds = tags.map((t) => t.id)
    
    const tagsToAdd = tags.filter((t) => !currentTagIds.includes(t.id))
    const tagsToRemove = selectedTags.filter((t) => !newTagIds.includes(t.id))

    // Adicionar novas tags
    for (const tag of tagsToAdd) {
      await ticketService.addTag(id, tag.id)
    }

    // Remover tags
    for (const tag of tagsToRemove) {
      await ticketService.removeTag(id, tag.id)
    }

    setSelectedTags(tags)
    refetchTicket()
  }

  if (loading) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <RequirePermission permission="suporte.read">
          <DashboardLayout>
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          </DashboardLayout>
        </RequirePermission>
      </ProtectedRoute>
    )
  }

  if (!ticket) {
    return (
      <ProtectedRoute requiredUserType="admin">
        <RequirePermission permission="suporte.read">
          <DashboardLayout>
            <div className="text-center py-12">
              <p className="text-muted-foreground">Ticket não encontrado</p>
              <Button onClick={() => navigate('/admin/suporte')} className="mt-4">
                Voltar para Suporte
              </Button>
            </div>
          </DashboardLayout>
        </RequirePermission>
      </ProtectedRoute>
    )
  }

  const status = statusConfig[ticket.status]
  const prioridade = prioridadeConfig[ticket.prioridade]

  return (
    <ProtectedRoute requiredUserType="admin">
      <RequirePermission permission="suporte.read">
        <DashboardLayout>
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/suporte')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                    #{ticket.id.slice(0, 8)} - {ticket.titulo}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <div className={`h-2 w-16 rounded-full ${prioridade.color}`} title={prioridade.label} />
                    <span className="text-muted-foreground">
                      Criado em {formatDateTime(ticket.criado_em)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {ticket.status === 'aberto' && (
                    <Button variant="default" onClick={handleAssign}>
                      <User className="h-4 w-4 mr-2" />
                      Atribuir
                    </Button>
                  )}
                  {ticket.status === 'em_andamento' && (
                    <Button variant="default" onClick={handleResolve}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>
                  )}
                  {ticket.status === 'resolvido' && (
                    <Button variant="outline" onClick={handleClose}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Fechar
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{ticket.descricao}</p>
                  </CardContent>
                </Card>

                <TicketComments
                  comments={comments}
                  loading={loadingComentarios}
                  onAddComment={handleAddComment}
                  currentUserId={user?.id}
                />

                {ticket && <TicketTimeline ticket={ticket} comments={comments} />}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Prioridade</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${prioridade.color}`} />
                        <span className="text-sm capitalize">{ticket.prioridade}</span>
                      </div>
                    </div>
                    {ticket.atribuido && (
                      <div>
                        <Label className="text-muted-foreground">Atribuído a</Label>
                        <p className="font-medium">{ticket.atribuido.nome}</p>
                      </div>
                    )}
                    {ticket.empresa && (
                      <div>
                        <Label className="text-muted-foreground">Empresa</Label>
                        <p className="font-medium">{ticket.empresa.razao_social}</p>
                      </div>
                    )}
                    {ticket.motorista && (
                      <div>
                        <Label className="text-muted-foreground">Motorista</Label>
                        <p className="font-medium">{ticket.motorista.nome}</p>
                      </div>
                    )}
                    {ticket.tempo_resposta && (
                      <div>
                        <Label className="text-muted-foreground">Tempo de Resposta</Label>
                        <p className="font-medium">{ticket.tempo_resposta}</p>
                      </div>
                    )}
                    {ticket.tempo_resolucao && (
                      <div>
                        <Label className="text-muted-foreground">Tempo de Resolução</Label>
                        <p className="font-medium">{ticket.tempo_resolucao}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TagSelector
                      selectedTags={selectedTags}
                      tipoRecurso="tickets"
                      onTagsChange={handleTagsChange}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </RequirePermission>
    </ProtectedRoute>
  )
}

