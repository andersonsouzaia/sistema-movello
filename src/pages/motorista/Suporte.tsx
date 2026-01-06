import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, Column } from '@/components/ui/DataTable'
import { Plus, Loader2, MessageSquare, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDateTime } from '@/lib/utils/formatters'
import { TicketComments } from '@/components/admin/TicketComments'
import type { TicketWithDetails } from '@/types/database'

// Mock - será substituído por hook real quando o backend estiver pronto
const useMotoristaTickets = (filters: { status?: string } = {}) => {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  
  return {
    tickets,
    loading,
    refetch: () => Promise.resolve(),
  }
}

const useMotoristaTicket = (id: string | null) => {
  return {
    ticket: null as TicketWithDetails | null,
    loading: false,
  }
}

const useCreateMotoristaTicket = () => {
  const [loading, setLoading] = useState(false)
  
  const createTicket = async (data: { assunto: string; descricao: string; prioridade: string }) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast.success('Ticket criado com sucesso!')
  }
  
  return { createTicket, loading }
}

const useAddMotoristaTicketComment = () => {
  const [loading, setLoading] = useState(false)
  
  const addComment = async (ticketId: string, comment: string, interno: boolean) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast.success('Comentário adicionado com sucesso!')
  }
  
  return { addComment, loading }
}

const ticketSchema = z.object({
  assunto: z.string().min(3, 'Assunto deve ter no mínimo 3 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']),
})

type TicketFormData = z.infer<typeof ticketSchema>

const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary'; icon: any }> = {
  aberto: { label: 'Aberto', variant: 'secondary', icon: AlertCircle },
  em_andamento: { label: 'Em Andamento', variant: 'default', icon: Clock },
  resolvido: { label: 'Resolvido', variant: 'default', icon: CheckCircle2 },
  fechado: { label: 'Fechado', variant: 'secondary', icon: XCircle },
}

const prioridadeConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  baixa: { label: 'Baixa', variant: 'secondary' },
  media: { label: 'Média', variant: 'default' },
  alta: { label: 'Alta', variant: 'destructive' },
  urgente: { label: 'Urgente', variant: 'destructive' },
}

export default function MotoristaSuporte() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const { tickets, loading, refetch } = useMotoristaTickets({
    status: statusFilter || undefined,
  })
  const { createTicket, loading: creating } = useCreateMotoristaTicket()

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      assunto: '',
      descricao: '',
      prioridade: 'media',
    },
  })

  const handleCreateTicket = async (data: TicketFormData) => {
    try {
      await createTicket({
        assunto: data.assunto,
        descricao: data.descricao,
        prioridade: data.prioridade,
      })
      setCreateDialogOpen(false)
      form.reset()
      refetch()
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  const columns: Column<TicketWithDetails>[] = [
    {
      key: 'assunto',
      header: 'Assunto',
      render: (row) => (
        <div className="font-medium">{row.assunto}</div>
      ),
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      render: (row) => {
        const config = prioridadeConfig[row.prioridade] || { label: row.prioridade, variant: 'secondary' as const }
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const config = statusConfig[row.status] || { label: row.status, variant: 'secondary' as const }
        const Icon = config.icon || MessageSquare
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        )
      },
    },
    {
      key: 'criado_em',
      header: 'Criado em',
      render: (row) => (
        <div className="text-sm text-muted-foreground">
          {formatDateTime(row.criado_em)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedTicket(row.id)}
        >
          Ver Detalhes
        </Button>
      ),
    },
  ]

  return (
    <ProtectedRoute requiredUserType="motorista">
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Suporte
              </h1>
              <p className="text-lg text-muted-foreground">
                Entre em contato com nossa equipe de suporte
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ticket</DialogTitle>
                  <DialogDescription>
                    Descreva seu problema ou dúvida para nossa equipe de suporte
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleCreateTicket)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assunto">Assunto *</Label>
                    <Input
                      id="assunto"
                      {...form.register('assunto')}
                      placeholder="Ex: Problema com tablet"
                      className="h-11"
                    />
                    {form.formState.errors.assunto && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.assunto.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prioridade">Prioridade *</Label>
                    <Select
                      value={form.watch('prioridade')}
                      onValueChange={(value) => form.setValue('prioridade', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.prioridade && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.prioridade.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea
                      id="descricao"
                      {...form.register('descricao')}
                      placeholder="Descreva detalhadamente seu problema ou dúvida..."
                      rows={6}
                    />
                    {form.formState.errors.descricao && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.descricao.message}
                      </p>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCreateDialogOpen(false)
                        form.reset()
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creating}>
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Ticket'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Filtros */}
          <Card className="card-premium">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === '__all__' ? '' : value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos os status</SelectItem>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={loading}
                >
                  <Loader2 className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Atualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Tickets */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle>Meus Tickets</CardTitle>
              <CardDescription>Lista de todos os seus tickets de suporte</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum ticket encontrado</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Crie seu primeiro ticket para começar
                  </p>
                </div>
              ) : (
                <DataTable
                  data={tickets}
                  columns={columns}
                  searchKey="assunto"
                  searchPlaceholder="Buscar tickets por assunto..."
                  emptyMessage="Nenhum ticket encontrado. Crie seu primeiro ticket!"
                  onRowClick={(row) => setSelectedTicket(row.id)}
                />
              )}
            </CardContent>
          </Card>

          {/* Dialog de Detalhes do Ticket */}
          {selectedTicket && (
            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detalhes do Ticket</DialogTitle>
                  <DialogDescription>
                    Visualize e adicione comentários ao ticket
                  </DialogDescription>
                </DialogHeader>
                <TicketDetails ticketId={selectedTicket} onClose={() => setSelectedTicket(null)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

// Componente para detalhes do ticket
function TicketDetails({ ticketId, onClose }: { ticketId: string; onClose: () => void }) {
  const { ticket, loading } = useMotoristaTicket(ticketId)
  const { addComment, loading: addingComment } = useAddMotoristaTicketComment()
  const { user } = useAuth()

  const handleAddComment = async (comment: string, interno: boolean) => {
    if (!comment.trim()) {
      toast.error('Digite um comentário')
      return
    }

    try {
      await addComment(ticketId, comment, interno)
    } catch (error) {
      // Erro já é tratado no hook
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ticket não encontrado</p>
      </div>
    )
  }

  const status = statusConfig[ticket.status] || { label: ticket.status, variant: 'secondary' as const }
  const prioridade = prioridadeConfig[ticket.prioridade] || { label: ticket.prioridade, variant: 'secondary' as const }

  return (
    <div className="space-y-6">
      {/* Informações do Ticket */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle>{ticket.assunto}</CardTitle>
              <CardDescription className="mt-2">
                Criado em {formatDateTime(ticket.criado_em)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={prioridade.variant}>{prioridade.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Descrição</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.descricao}</p>
            </div>
            {ticket.atribuido && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Atribuído a</p>
                <p className="text-sm">{ticket.atribuido.nome}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comentários */}
      <TicketComments
        comments={[]}
        loading={false}
        onAddComment={handleAddComment}
        currentUserId={user?.id}
      />
    </div>
  )
}

